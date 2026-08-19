import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import { runAtsAnalysis } from './server/ats-engine';
import { executeTestSuite } from './server/test-runner';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// 1. Basic In-Memory Rate Limiter to prevent DoS/Flooding on API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Muitas requisições enviadas. Aguarde 1 minuto antes de tentar novamente.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count += 1;
  next();
}

// 2. Strict Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com;",
  );
  next();
});

// 3. CORS Middleware with configured origins
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env['ALLOWED_ORIGINS'] || '').split(',').map((o) => o.trim()).filter(Boolean);

  if (origin) {
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// 4. Body parser with strict payload size limit (max 1MB)
app.use(express.json({ limit: '1mb' }));

// 5. In-memory Telemetry Tracker for Live Visits and Analyses
let telemetryVisits = 1420;
let telemetryAudits = 684;

app.get('/api/telemetry/stats', (_req: Request, res: Response) => {
  res.json({
    totalVisits: telemetryVisits,
    totalAudits: telemetryAudits,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/telemetry/record-visit', (_req: Request, res: Response) => {
  telemetryVisits += 1;
  res.json({
    totalVisits: telemetryVisits,
    totalAudits: telemetryAudits,
  });
});

app.post('/api/telemetry/record-audit', (_req: Request, res: Response) => {
  telemetryAudits += 1;
  res.json({
    totalVisits: telemetryVisits,
    totalAudits: telemetryAudits,
  });
});

/**
 * Health check endpoint (for Vercel / Kubernetes probes)
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    hasAiKey: !!process.env['GEMINI_API_KEY'],
  });
});

/**
 * ATS Match Analysis Endpoint (Rate Limited & Sanitized)
 */
app.post('/api/match', apiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { jobDescription, resumeText } = req.body || {};

    if (!jobDescription || !resumeText) {
      return res.status(400).json({
        error: 'É necessário fornecer tanto a descrição da vaga quanto o texto do currículo.',
      });
    }

    const jobStr = String(jobDescription).trim();
    const resumeStr = String(resumeText).trim();

    if (jobStr.length < 50 || resumeStr.length < 50) {
      return res.status(400).json({
        error: 'A descrição da vaga e o currículo devem conter ao menos 50 caracteres para uma análise consistente.',
      });
    }

    const result = await runAtsAnalysis(jobStr, resumeStr);
    return res.json(result);
  } catch (error: unknown) {
    console.error('Erro na rota /api/match:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao processar requisição';
    return res.status(500).json({
      error: 'Falha ao processar análise de match ATS.',
      details: message,
    });
  }
});

/**
 * Automated Test Suite Runner Endpoint
 */
app.post('/api/run-tests', apiRateLimiter, async (req: Request, res: Response) => {
  try {
    const report = await executeTestSuite();
    return res.json(report);
  } catch (error: unknown) {
    console.error('Erro na rota /api/run-tests:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({
      error: 'Falha ao executar suíte de testes automáticos.',
      details: message,
    });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is run via PM2/Container.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Production server running on port ${port}`);
  });
}

/**
 * Request handler for serverless platforms (Vercel, AWS Lambda, Cloud Run, Firebase)
 */
export const reqHandler = createNodeRequestHandler(app);
export default app;
