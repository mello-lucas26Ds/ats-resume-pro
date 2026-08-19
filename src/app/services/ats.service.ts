import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AtsAnalysisResult, AnalyzePayload } from '../types/ats.types';
import { runHeuristicFallback } from '../utils/heuristic-engine';

export const MAX_JOB_CHARS = 15000;
export const MAX_RESUME_CHARS = 20000;
export const MIN_TEXT_CHARS = 50;
export const COOLDOWN_DURATION_SEC = 6;

export interface PresetScenario {
  id: string;
  namePt: string;
  nameEn: string;
  badgePt: string;
  badgeEn: string;
  jobDescriptionPt: string;
  resumeTextPt: string;
  jobDescriptionEn: string;
  resumeTextEn: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'frontend-angular',
    namePt: 'Frontend Sênior (Angular + TypeScript)',
    nameEn: 'Senior Frontend (Angular + TypeScript)',
    badgePt: 'Match Forte (85%+)',
    badgeEn: 'Strong Match (85%+)',
    jobDescriptionPt: `Vaga: Desenvolvedor Frontend Sênior (Angular & TypeScript)
Empresa: TechSolutions Global
Modelo: Remoto

Sobre a Posição:
Buscamos profissional Sênior para liderar a arquitetura de novas interfaces corporativas.

Requisitos Inegociáveis (Eliminatórios):
- Mais de 5 anos de experiência comprovada com Angular moderno (v17+) e TypeScript.
- Domínio de gerenciamento de estado reativo com Signals e RxJS.
- Prática sólida com Tailwind CSS e Design Systems componentizados.
- Experiência em produção com testes automatizados e consumo de APIs REST/GraphQL.

Requisitos Importantes:
- Experiência com SSR (Server-Side Rendering) e otimização de Web Vitals.
- Vivência em ambiente ágil (Scrum/Kanban) e CI/CD.

Diferenciais:
- Conhecimento em acessibilidade web (WCAG) e arquitetura de Micro-frontends.`,
    resumeTextPt: `LUCAS MENDES
Desenvolvedor Frontend Sênior | Angular & TypeScript Especialista
lucas.mendes@email.com | (11) 98765-4321 | São Paulo, SP

RESUMO PROFISSIONAL
Desenvolvedor Frontend Sênior com 6 anos de atuação na concepção de SPAs e arquiteturas de alta performance com Angular, TypeScript e Tailwind CSS. Liderei a refatoração de sistemas legados para Angular moderno com Signals e reduzi o tempo de carregamento em 40%.

EXPERIÊNCIA PROFISSIONAL

TechFin Solutions — Desenvolvedor Frontend Sênior (2022 - Atual)
- Desenvolvi a nova plataforma de pagamentos em Angular 18 e TypeScript, atendendo mais de 200.000 usuários diários.
- Implementei arquitetura com Signals e RxJS para fluxo reativo de dados em tempo real, diminuindo o consumo de memória em 35%.
- Integrei componentes padronizados com Tailwind CSS e Angular CDK garantindo conformidade WCAG AA.
- Estruturei pipeline de testes unitários com Jest e Cypress, elevando a cobertura de código para 88%.

Inovare Digital — Desenvolvedor Frontend Pleno (2019 - 2022)
- Construí dashboards analíticos em Angular e consumo de APIs RESTful.
- Participei de migrações de interfaces legadas para monorepo corporativo.

COMPETÊNCIAS TÉCNICAS
- Linguagens & Frameworks: Angular, TypeScript, JavaScript (ES6+), RxJS, Signals, HTML5, CSS3, Tailwind CSS.
- Arquitetura & Testes: REST, GraphQL, Jest, Cypress, Design Systems, Clean Code.
- Ferramentas & DevOps: Git, GitHub Actions, Docker básico, NPM.

FORMAÇÃO
- Bacharelado em Ciência da Computação — Universidade Federal (2015 - 2019).`,
    jobDescriptionEn: `Role: Senior Frontend Engineer (Angular & TypeScript)
Company: TechSolutions Global
Model: 100% Remote (Global)

About the Position:
We are seeking a Senior Frontend Engineer to lead the architecture of high-scale enterprise applications.

Must-Have Requirements (Non-Negotiable):
- 5+ years of verified production experience with modern Angular (v17+) and TypeScript.
- Deep expertise in reactive state management using Signals and RxJS.
- Solid production practice with Tailwind CSS and modular Design Systems.
- Production track record with automated unit/E2E testing and REST/GraphQL API integration.

Important Requirements:
- Hands-on experience with SSR (Server-Side Rendering) and Core Web Vitals optimization.
- Proven experience in Agile (Scrum/Kanban) environments and CI/CD automation pipelines.

Nice-to-Have:
- Web accessibility standards (WCAG AA) and Micro-frontend architecture.`,
    resumeTextEn: `LUCAS MENDES
Senior Frontend Engineer | Angular & TypeScript Specialist
lucas.mendes@email.com | +1 (555) 019-2834 | San Francisco, CA (Open to Remote)

PROFESSIONAL SUMMARY
Senior Frontend Engineer with 6+ years designing high-performance enterprise SPAs using Angular, TypeScript, and Tailwind CSS. Architected legacy codebase migrations to modern Angular Signals, reducing page load times by 40%.

PROFESSIONAL EXPERIENCE

TechFin Solutions — Senior Frontend Engineer (2022 - Present)
- Engineered the core payment checkout gateway in Angular 18 and TypeScript, serving 200,000+ daily active users.
- Implemented reactive state pipelines with Signals and RxJS, decreasing runtime memory footprint by 35%.
- Integrated reusable component libraries with Tailwind CSS and Angular CDK ensuring strict WCAG AA compliance.
- Structured automated test suites with Jest and Cypress, increasing test coverage from 45% to 88%.

Inovare Digital — Mid-Level Frontend Engineer (2019 - 2022)
- Built enterprise analytical dashboards consuming high-throughput RESTful microservices.
- Optimized bundle delivery strategies, achieving 98+ Google Lighthouse performance scores.

TECHNICAL SKILLS
- Languages & Frameworks: Angular, TypeScript, JavaScript (ES6+), RxJS, Signals, HTML5, Tailwind CSS.
- Architecture & Testing: REST, GraphQL, Jest, Cypress, Design Systems, Clean Code.
- Tools & Cloud: Git, GitHub Actions, Docker, CI/CD, NPM.

EDUCATION
- B.S. in Computer Science — Federal University (2015 - 2019).`,
  },
  {
    id: 'ai-slop-sample',
    namePt: 'Currículo com Clichês de IA (6 Vertentes)',
    nameEn: 'AI Slop / Robotic CV (6 Dimensions)',
    badgePt: 'Alerta de Tom de IA (75%+)',
    badgeEn: 'High AI Tone Alert (75%+)',
    jobDescriptionPt: `Vaga: Engenheiro de Software Sênior (Sistemas Distribuídos)
Requisitos: Arquitetura de microsserviços, Python, Docker, Kubernetes, PostgreSQL e liderança técnica.`,
    resumeTextPt: `MARCOS VINÍCIUS
Engenheiro de Software & Entusiasta de Inovação

RESUMO
Profissional altamente qualificado e apaixonado por inovação, tecnologia transformacional e sinergia entre equipes ágeis. Possui visão 360 holística com sólida trajetória orientada a resultados e foco intransigente na excelência operacional.

EXPERIÊNCIA

TechCorp Global — Especialista de Soluções (2021 - Atual)
- Orquestrou a transformação digital da infraestrutura corporativa alavancando modernas tecnologias de computação em nuvem.
- Fomentou a sinergia entre os times de desenvolvimento visando a melhoria contínua de processos ágeis.
- Além disso, foi desenvolvida uma arquitetura orientada a serviços com vistas a assegurar a máxima escalabilidade.
- Atuou com o intuito de impulsionar a governança de dados e qualidade de software.

COMPETÊNCIAS
Computação em Nuvem, Inovação, Métodos Ágeis, Arquitetura de Sistemas, Gestão Holística.`,
    jobDescriptionEn: `Role: Senior Distributed Systems Software Engineer
Requirements: Microservices architecture, Python, Docker, Kubernetes, PostgreSQL, and technical leadership.`,
    resumeTextEn: `MARCOS VINICIUS
Software Engineer & Innovation Enthusiast

SUMMARY
Dynamic and passionate professional with transformational vision, delving into synergistic team paradigms and fostering operational excellence across holistic enterprise horizons.

EXPERIENCE

TechCorp Global — Solutions Specialist (2021 - Present)
- Spearheaded the transformational digital evolution of enterprise cloud infrastructure.
- Fostered synergy between cross-functional teams to drive continuous agile excellence.
- Additionally, a microservices framework was implemented to maximize seamless scalability.
- Acted with the endeavor of championing software quality paradigms.

SKILLS
Cloud Computing, Innovation, Agile Synergy, Holistic Systems Management.`,
  },
  {
    id: 'backend-python',
    namePt: 'Backend Python (Gaps e Métricas)',
    nameEn: 'Backend Python (Gaps & Metrics)',
    badgePt: 'Match Moderado (Gaps)',
    badgeEn: 'Moderate Match (Gaps)',
    jobDescriptionPt: `Vaga: Engenheiro de Software Backend Sênior (Python & IA)
Local: Híbrido - SP

Responsabilidades:
- Arquitetar microsserviços de alto volume com FastAPI, Python e mensageria distribuída.
- Implementar pipelines de inferência de LLMs e arquiteturas RAG com bancos vetoriais.
- Garantir observabilidade de sistemas de missão crítica com Prometheus e Grafana.

Requisitos Inegociáveis:
- Mínimo de 5 anos de experiência com Python em produção (FastAPI ou Django).
- Experiência comprovada com Docker, Kubernetes e deploy em AWS (ECS/EKS).
- Arquitetura de microsserviços e mensageria com Apache Kafka ou RabbitMQ.`,
    resumeTextPt: `ROBERTO SILVA
Desenvolvedor Backend
roberto.silva@email.com

RESUMO
Profissional de tecnologia focado em desenvolvimento de sistemas web com Python.

EXPERIÊNCIA

Empresa Alpha (2021 - Atual) - Desenvolvedor Backend
- Responsável pelo desenvolvimento de APIs em Python com framework FastAPI.
- Ajudei a equipe na manutenção de banco de dados PostgreSQL.
- Participei de reuniões de alinhamento com clientes e correções de bugs.
- Fiz estudos em Kubernetes e arquitetura em nuvem.`,
    jobDescriptionEn: `Role: Senior Backend Software Engineer (Python & AI)
Model: Remote

Responsibilities:
- Architect high-throughput distributed microservices using FastAPI, Python, and message queues.
- Implement LLM inference pipelines and RAG architectures with vector stores.
- Guarantee system observability using Prometheus and Grafana.

Must-Have Requirements:
- 5+ years of production experience with Python (FastAPI or Django).
- Proven production experience with Docker, Kubernetes, and AWS (ECS/EKS).
- Distributed messaging with Apache Kafka or RabbitMQ.`,
    resumeTextEn: `ROBERTO SILVA
Backend Developer
roberto.silva@email.com

SUMMARY
Technology professional focused on web systems development with Python.

EXPERIENCE

Alpha Corp (2021 - Present) - Backend Developer
- Responsible for API development in Python with FastAPI framework.
- Assisted the team with PostgreSQL database maintenance.
- Participated in client alignment meetings and bug fixing.
- Conducted studies on Kubernetes and cloud architecture.`,
  },
];

@Injectable({
  providedIn: 'root',
})
export class AtsService {
  private http = inject(HttpClient);

  // Author & Links
  readonly authorName = 'Lucas Mello';
  readonly githubUrl = 'https://github.com/mello-lucas26Ds';
  readonly linkedinUrl = 'https://www.linkedin.com/in/mello-lucas26/';
  readonly repoUrl = 'https://github.com/mello-lucas26Ds/match-curriculo-ats';

  // Limits
  readonly maxJobChars = MAX_JOB_CHARS;
  readonly maxResumeChars = MAX_RESUME_CHARS;
  readonly minTextChars = MIN_TEXT_CHARS;

  // TOGGLE 1: Global UI Language (Controls interface, menus, labels, badges)
  uiLanguage = signal<'pt' | 'en'>('pt');

  // TOGGLE 2: INDEPENDENT Resume Language (Controls solely the candidate's resume text/adaptation)
  resumeLanguage = signal<'pt' | 'en'>('pt');

  // Active state
  selectedPresetId = signal<string>('frontend-angular');
  jobDescription = signal<string>(PRESET_SCENARIOS[0].jobDescriptionPt);
  resumeText = signal<string>(PRESET_SCENARIOS[0].resumeTextPt);
  isAnalyzing = signal<boolean>(false);
  cooldownTimer = signal<number>(0);
  analysisResult = signal<AtsAnalysisResult | null>(null);
  errorMessage = signal<string | null>(null);
  activeTab = signal<'matcher' | 'test-suite'>('matcher');
  selectedFilter = signal<'all' | 'inegociaveis' | 'gaps'>('all');
  scaffoldPrefillData = signal<{ verb: string; stack: string; metric: string } | null>(null);

  // Live Telemetry Counters
  totalVisits = signal<number>(1420);
  totalAudits = signal<number>(684);

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initTelemetry();
  }

  private initTelemetry(): void {
    // Record visit on startup (safe with try/catch for SSR / browser environments)
    if (typeof window !== 'undefined') {
      const storedVisits = localStorage.getItem('ats_telemetry_visits');
      const storedAudits = localStorage.getItem('ats_telemetry_audits');
      if (storedVisits) this.totalVisits.set(Math.max(1420, parseInt(storedVisits, 10)));
      if (storedAudits) this.totalAudits.set(Math.max(684, parseInt(storedAudits, 10)));

      this.http.post<{ totalVisits: number; totalAudits: number }>('/api/telemetry/record-visit', {}).subscribe({
        next: (stats) => {
          if (stats?.totalVisits) {
            this.totalVisits.set(stats.totalVisits);
            localStorage.setItem('ats_telemetry_visits', stats.totalVisits.toString());
          }
          if (stats?.totalAudits) {
            this.totalAudits.set(stats.totalAudits);
            localStorage.setItem('ats_telemetry_audits', stats.totalAudits.toString());
          }
        },
        error: () => {
          // Local fallback increment
          this.totalVisits.update((v) => {
            const next = v + 1;
            localStorage.setItem('ats_telemetry_visits', next.toString());
            return next;
          });
        },
      });
    }
  }

  recordAuditExecution(): void {
    this.totalAudits.update((a) => {
      const next = a + 1;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ats_telemetry_audits', next.toString());
      }
      return next;
    });

    this.http.post<{ totalVisits: number; totalAudits: number }>('/api/telemetry/record-audit', {}).subscribe({
      next: (stats) => {
        if (stats?.totalAudits) {
          this.totalAudits.set(stats.totalAudits);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ats_telemetry_audits', stats.totalAudits.toString());
          }
        }
      },
      error: (err) => {
        console.debug('Telemetry audit record skipped:', err?.status);
      },
    });
  }

  loadIntoScaffold(verb: string, stack: string, metric: string): void {
    this.scaffoldPrefillData.set({ verb, stack, metric });
  }

  // TOGGLE 1 Action: Switches UI Language ONLY (without wiping or forcing custom user resume text)
  setUiLanguage(lang: 'pt' | 'en'): void {
    this.uiLanguage.set(lang);
  }

  toggleUiLanguage(): void {
    this.uiLanguage.update((curr) => (curr === 'pt' ? 'en' : 'pt'));
  }

  // TOGGLE 2 Action: INDEPENDENTLY adapts/rewrites the Resume Text (PT-BR vs EN-US)
  setResumeLanguage(targetLang: 'pt' | 'en'): void {
    this.resumeLanguage.set(targetLang);
    const currentPreset = PRESET_SCENARIOS.find((s) => s.id === this.selectedPresetId()) || PRESET_SCENARIOS[0];
    
    // Check if the current resume text matches any preset or is custom
    const isPresetPt = PRESET_SCENARIOS.some((p) => p.resumeTextPt.trim() === this.resumeText().trim());
    const isPresetEn = PRESET_SCENARIOS.some((p) => p.resumeTextEn.trim() === this.resumeText().trim());

    if (isPresetPt || isPresetEn || this.resumeText().trim() === '') {
      // If using presets or empty, load clean professional version in target language
      this.resumeText.set(targetLang === 'en' ? currentPreset.resumeTextEn : currentPreset.resumeTextPt);
    } else {
      // If user typed custom text, intelligently adapt standard sections and action verbs
      this.resumeText.set(this.adaptCustomResumeText(this.resumeText(), targetLang));
    }
  }

  // Smart in-place text adaptation helper for custom CV text
  private adaptCustomResumeText(text: string, targetLang: 'pt' | 'en'): string {
    if (targetLang === 'en') {
      return text
        .replace(/RESUMO PROFISSIONAL|RESUMO/gi, 'PROFESSIONAL SUMMARY')
        .replace(/EXPERIÊNCIA PROFISSIONAL|EXPERIÊNCIA/gi, 'PROFESSIONAL EXPERIENCE')
        .replace(/COMPETÊNCIAS TÉCNICAS|COMPETÊNCIAS|HABILIDADES/gi, 'TECHNICAL SKILLS')
        .replace(/FORMAÇÃO ACADÊMICA|FORMAÇÃO/gi, 'EDUCATION')
        .replace(/Desenvolvedor Frontend Sênior/gi, 'Senior Frontend Engineer')
        .replace(/Desenvolvedor Backend Sênior/gi, 'Senior Backend Engineer')
        .replace(/Desenvolvedor/gi, 'Software Engineer')
        .replace(/Desenvolvi /gi, 'Engineered ')
        .replace(/Implementei /gi, 'Implemented ')
        .replace(/Construí /gi, 'Built ')
        .replace(/Configurei /gi, 'Configured ')
        .replace(/Estruturei /gi, 'Structured ')
        .replace(/Otimizei /gi, 'Optimized ')
        .replace(/Analisei /gi, 'Analyzed ')
        .replace(/Liderei /gi, 'Led ')
        .replace(/Atual\b/gi, 'Present')
        .replace(/Bacharelado em Ciência da Computação/gi, 'B.S. in Computer Science');
    } else {
      return text
        .replace(/PROFESSIONAL SUMMARY|SUMMARY/gi, 'RESUMO PROFISSIONAL')
        .replace(/PROFESSIONAL EXPERIENCE|EXPERIENCE/gi, 'EXPERIÊNCIA PROFISSIONAL')
        .replace(/TECHNICAL SKILLS|SKILLS/gi, 'COMPETÊNCIAS TÉCNICAS')
        .replace(/EDUCATION/gi, 'FORMAÇÃO')
        .replace(/Senior Frontend Engineer/gi, 'Desenvolvedor Frontend Sênior')
        .replace(/Senior Backend Engineer/gi, 'Desenvolvedor Backend Sênior')
        .replace(/Software Engineer/gi, 'Desenvolvedor de Software')
        .replace(/Engineered |Architected /gi, 'Desenvolvi ')
        .replace(/Implemented /gi, 'Implementei ')
        .replace(/Built /gi, 'Construí ')
        .replace(/Configured /gi, 'Configurei ')
        .replace(/Structured /gi, 'Estruturei ')
        .replace(/Optimized /gi, 'Otimizei ')
        .replace(/Analyzed /gi, 'Analisei ')
        .replace(/Led /gi, 'Liderei ')
        .replace(/Present\b/gi, 'Atual')
        .replace(/B\.S\. in Computer Science/gi, 'Bacharelado em Ciência da Computação');
    }
  }

  loadPreset(presetId: string): void {
    this.selectedPresetId.set(presetId);
    const scenario = PRESET_SCENARIOS.find((s) => s.id === presetId);
    if (scenario) {
      // Load Job according to UI Language, and Resume according to Resume Language
      const isUiEn = this.uiLanguage() === 'en';
      const isResumeEn = this.resumeLanguage() === 'en';

      this.jobDescription.set(isUiEn ? scenario.jobDescriptionEn : scenario.jobDescriptionPt);
      this.resumeText.set(isResumeEn ? scenario.resumeTextEn : scenario.resumeTextPt);
      this.analysisResult.set(null);
      this.errorMessage.set(null);
    }
  }

  clearInputs(): void {
    this.jobDescription.set('');
    this.resumeText.set('');
    this.analysisResult.set(null);
    this.errorMessage.set(null);
  }

  setTab(tab: 'matcher' | 'test-suite'): void {
    this.activeTab.set(tab);
  }

  setFilter(filter: 'all' | 'inegociaveis' | 'gaps'): void {
    this.selectedFilter.set(filter);
  }

  private startCooldown(): void {
    this.cooldownTimer.set(COOLDOWN_DURATION_SEC);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerInterval = setInterval(() => {
      const current = this.cooldownTimer();
      if (current <= 1) {
        this.cooldownTimer.set(0);
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      } else {
        this.cooldownTimer.set(current - 1);
      }
    }, 1000);
  }

  analyze(): void {
    if (this.isAnalyzing() || this.cooldownTimer() > 0) {
      return;
    }

    let job = this.jobDescription().trim();
    let resume = this.resumeText().trim();

    if (!job || !resume) {
      this.errorMessage.set(
        this.uiLanguage() === 'en'
          ? 'Please enter both the Job Description and the Resume text.'
          : 'Por favor, informe tanto a descrição da vaga quanto o texto do currículo.'
      );
      return;
    }

    if (job.length < this.minTextChars) {
      this.errorMessage.set(
        this.uiLanguage() === 'en'
          ? `The job description must be at least ${this.minTextChars} characters for a reliable audit.`
          : `A descrição da vaga precisa ter no mínimo ${this.minTextChars} caracteres para uma análise consistente.`
      );
      return;
    }

    if (resume.length < this.minTextChars) {
      this.errorMessage.set(
        this.uiLanguage() === 'en'
          ? `The resume must be at least ${this.minTextChars} characters for a reliable audit.`
          : `O currículo precisa ter no mínimo ${this.minTextChars} caracteres para uma análise consistente.`
      );
      return;
    }

    // Enforce hard character truncation to avoid memory / token overflows
    if (job.length > this.maxJobChars) {
      job = job.slice(0, this.maxJobChars);
      this.jobDescription.set(job);
    }

    if (resume.length > this.maxResumeChars) {
      resume = resume.slice(0, this.maxResumeChars);
      this.resumeText.set(resume);
    }

    this.isAnalyzing.set(true);
    this.errorMessage.set(null);

    const payload: AnalyzePayload = {
      jobDescription: job,
      resumeText: resume,
    };

    this.http.post<AtsAnalysisResult>('/api/match', payload).subscribe({
      next: (result) => {
        this.analysisResult.set(result);
        this.isAnalyzing.set(false);
        this.recordAuditExecution();
        this.startCooldown();
      },
      error: (err) => {
        console.warn('API backend indisponível ou em modo estático. Executando motor heurístico local:', err?.status);
        try {
          const fallbackResult = runHeuristicFallback(job, resume, this.uiLanguage() === 'en');
          this.analysisResult.set(fallbackResult);
          this.recordAuditExecution();
        } catch (fallbackErr) {
          console.error('Erro no fallback heurístico local:', fallbackErr);
          this.errorMessage.set(
            this.uiLanguage() === 'en'
              ? 'Error processing ATS analysis. Please verify your input and try again.'
              : 'Erro ao processar análise. Verifique os dados e tente novamente.'
          );
        } finally {
          this.isAnalyzing.set(false);
          this.startCooldown();
        }
      },
    });
  }
}
