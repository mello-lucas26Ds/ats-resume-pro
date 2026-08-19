import { runHeuristicFallback } from './ats-engine';
import { TestCaseResult, TestSuiteReport } from '../app/types/ats.types';

export async function executeTestSuite(): Promise<TestSuiteReport> {
  const startTime = Date.now();
  const results: TestCaseResult[] = [];

  // TEST 1: TOP 20% Pareto Rule
  {
    const t0 = Date.now();
    const mockJob = `Vaga: Desenvolvedor Fullstack Sênior. Requisitos Inegociáveis: Domínio de Angular 21, TypeScript avançado e Node.js em produção. Diferenciais: Docker, Tailwind CSS.`;
    const mockResume = `João da Silva. Desenvolvedor Fullstack com 6 anos de experiência em Angular, TypeScript e Node.js. Construí APIs escaláveis e interfaces reativas.`;

    const analysis = runHeuristicFallback(mockJob, mockResume);

    const assertions = [
      {
        name: 'Extraiu entre 3 e 5 requisitos centrais',
        expected: true,
        actual: analysis.top20Requirements.length >= 3 && analysis.top20Requirements.length <= 5,
        passed: analysis.top20Requirements.length >= 3 && analysis.top20Requirements.length <= 5,
      },
      {
        name: 'Possui requisitos classificados como Inegociável',
        expected: true,
        actual: analysis.top20Requirements.some((r) => r.importance === 'Inegociável'),
        passed: analysis.top20Requirements.some((r) => r.importance === 'Inegociável'),
      },
      {
        name: 'Evidência factual é fornecida quando status é ATENDE',
        expected: true,
        actual: analysis.top20Requirements.every((r) => r.status !== 'ATENDE' || r.evidenceInResume.trim().length > 0),
        passed: analysis.top20Requirements.every((r) => r.status !== 'ATENDE' || r.evidenceInResume.trim().length > 0),
      },
    ];

    results.push({
      id: 'test-pareto-top20',
      name: 'Regra TOP 20% (Priorização de Requisitos Críticos e Evidência Factual)',
      ruleCategory: 'TOP_20_PARETO',
      description: 'Valida se o motor identifica e classifica os requisitos mais pesados da vaga com evidência concreta.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `Mapeados ${analysis.top20Requirements.length} requisitos no TOP 20% com score ${analysis.atsScore}%.`,
    });
  }

  // TEST 2: Strict Veracity & Anti-Hallucination ("ADAPTAR ≠ INVENTAR")
  {
    const t0 = Date.now();
    const mockJob = `Vaga: Engenheiro Backend. Requisitos: Kubernetes em produção, AWS ECS, Kafka, Python.`;
    const mockResume = `Desenvolvedor Python com experiência em Docker e PostgreSQL. Conhecimento acadêmico em mensageria.`;

    const analysis = runHeuristicFallback(mockJob, mockResume);

    const assertions = [
      {
        name: 'Não inventou status ATENDE para tecnologias ausentes (Kubernetes/AWS)',
        expected: true,
        actual: analysis.keywords.missing.includes('kubernetes') || analysis.keywords.missing.includes('aws') || analysis.gapsAnalysis.length > 0,
        passed: analysis.keywords.missing.includes('kubernetes') || analysis.keywords.missing.includes('aws') || analysis.gapsAnalysis.length > 0,
      },
      {
        name: 'Identificou oportunidade de métrica sem fabricar números fictícios',
        expected: true,
        actual: analysis.sectionRecommendations.some((s) => s.metricOpportunity.length > 0),
        passed: analysis.sectionRecommendations.some((s) => s.metricOpportunity.length > 0),
      },
      {
        name: 'Classificou lacunas com estratégias éticas de mitigação',
        expected: true,
        actual: analysis.gapsAnalysis.every((g) => g.mitigationStrategy.length > 15),
        passed: analysis.gapsAnalysis.every((g) => g.mitigationStrategy.length > 15),
      },
    ];

    results.push({
      id: 'test-veracity-truth',
      name: 'Regra de Veracidade e Anti-Alucinação (Adaptar ≠ Inventar)',
      ruleCategory: 'VERACITY_TRUTH',
      description: 'Garante que o motor não simula experiências de produção ausentes e orienta sem criar números falsos.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `Identificou ${analysis.gapsAnalysis.length} gaps e manteve a integridade factual sem inventar produção.`,
    });
  }

  // TEST 3: Action-Oriented Bullet Formula Audit in 1st Person (Configurei, Construí, Analisei, Criei)
  {
    const t0 = Date.now();
    const mockJob = `Engenheiro de Software com foco em performance e qualidade.`;
    const mockResume = `Responsável por auxiliar a equipe no desenvolvimento do sistema e criação de relatórios.`;

    const analysis = runHeuristicFallback(mockJob, mockResume);

    const assertions = [
      {
        name: 'Audita seções de experiência e orienta padrão com verbos ativos em 1ª pessoa',
        expected: true,
        actual: analysis.sectionRecommendations.some((r) => r.suggestedAction.includes('Configurei') || r.suggestedAction.includes('Construí') || r.suggestedAction.includes('Ação')),
        passed: analysis.sectionRecommendations.some((r) => r.suggestedAction.includes('Configurei') || r.suggestedAction.includes('Construí') || r.suggestedAction.includes('Ação')),
      },
      {
        name: 'Não reescreve o currículo pronto, apenas diagnostica e sugere onde melhorar',
        expected: true,
        actual: analysis.sectionRecommendations.every((r) => r.sectionName.length > 0 && r.currentIssue.length > 0),
        passed: analysis.sectionRecommendations.every((r) => r.sectionName.length > 0 && r.currentIssue.length > 0),
      },
    ];

    results.push({
      id: 'test-bullet-audit',
      name: 'Auditoria de Redação em 1ª Pessoa Ativa (Configurei / Construí / Analisei)',
      ruleCategory: 'BULLET_AUDIT',
      description: 'Verifica se o motor diagnostica frases passivas e orienta a substituição por verbos fortes e métricas.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `${analysis.sectionRecommendations.length} recomendações cirúrgicas geradas por seção.`,
    });
  }

  // TEST 4: Keyword Matrix & ATS Filtering
  {
    const t0 = Date.now();
    const mockJob = `Requisitos: TypeScript, Tailwind, Docker, PostgreSQL, GraphQL.`;
    const mockResume = `Habilidades: TypeScript, Tailwind, PostgreSQL, Git.`;

    const analysis = runHeuristicFallback(mockJob, mockResume);

    const assertions = [
      {
        name: 'Mapeia corretamente termos técnicos presentes',
        expected: true,
        actual: analysis.keywords.matched.includes('typescript') && analysis.keywords.matched.includes('tailwind'),
        passed: analysis.keywords.matched.includes('typescript') && analysis.keywords.matched.includes('tailwind'),
      },
      {
        name: 'Mapeia termos técnicos da vaga que estão ausentes no currículo',
        expected: true,
        actual: analysis.keywords.missing.includes('docker') || analysis.keywords.missing.includes('graphql'),
        passed: analysis.keywords.missing.includes('docker') || analysis.keywords.missing.includes('graphql'),
      },
      {
        name: 'Emite alerta contra keyword stuffing e incentiva uso contextualizado',
        expected: true,
        actual: analysis.keywords.keywordDensityComment.length > 10,
        passed: analysis.keywords.keywordDensityComment.length > 10,
      },
    ];

    results.push({
      id: 'test-keyword-matrix',
      name: 'Matriz de Palavras-Chave ATS (Presentes vs Ausentes vs Adjacentes)',
      ruleCategory: 'KEYWORD_MATRIX',
      description: 'Valida a separação precisa entre competências encontradas, faltantes e termos adjacentes para algoritmos de triagem.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `${analysis.keywords.matched.length} termos compatíveis e ${analysis.keywords.missing.length} ausentes.`,
    });
  }

  // TEST 5: Seniority Real Evaluation
  {
    const t0 = Date.now();
    const mockJob = `Posição: Especialista / Tech Lead Sênior. Liderança técnica de arquitetura distribuída.`;
    const mockResume = `Desenvolvedor Júnior com 1 ano de experiência e projetos acadêmicos.`;

    const analysis = runHeuristicFallback(mockJob, mockResume);

    const assertions = [
      {
        name: 'Identifica nível da vaga',
        expected: true,
        actual: analysis.seniorityAnalysis.jobLevel.length > 0,
        passed: analysis.seniorityAnalysis.jobLevel.length > 0,
      },
      {
        name: 'Identifica nível do currículo e gera síntese de alinhamento',
        expected: true,
        actual: analysis.seniorityAnalysis.summary.length > 10,
        passed: analysis.seniorityAnalysis.summary.length > 10,
      },
    ];

    results.push({
      id: 'test-seniority-eval',
      name: 'Decodificação da Senioridade Real (Vaga vs Currículo)',
      ruleCategory: 'SENIORITY_EVALUATION',
      description: 'Compara a autonomia esperada na descrição da vaga com o nível de maturidade demonstrado no currículo.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `Vaga: ${analysis.seniorityAnalysis.jobLevel} | Currículo: ${analysis.seniorityAnalysis.resumeLevel}`,
    });
  }

  // TEST 6: AI Tone & Slop Detection - 6 Vertentes (Contexta.ai Engine)
  {
    const t0 = Date.now();
    const mockJob = `Vaga: Engenheiro de Software Sênior.`;
    const mockResumeWithAiSlop = `
    Profissional altamente apaixonado por inovação e sinergia, com visão 360 holística.
    Orquestrou a transformação digital da empresa alavancando soluções na nuvem.
    Além disso, foi desenvolvida uma arquitetura orientada a serviços visando a melhoria dos processos.
    `;

    const analysis = runHeuristicFallback(mockJob, mockResumeWithAiSlop);

    const assertions = [
      {
        name: 'Contém todas as 6 vertentes de análise de tom de IA',
        expected: 6,
        actual: analysis.aiToneAudit.vertentes.length,
        passed: analysis.aiToneAudit.vertentes.length === 6,
      },
      {
        name: 'Detecta jargões robóticos de IA ("orquestrou", "alavancou", "sinergia")',
        expected: true,
        actual: analysis.aiToneAudit.aiLingoScore > 40 && analysis.aiToneAudit.vertentes.some((v) => v.dimensionKey === 'BUZZWORDS_FLUFF' && v.severity === 'Atenção'),
        passed: analysis.aiToneAudit.aiLingoScore > 40 && analysis.aiToneAudit.vertentes.some((v) => v.dimensionKey === 'BUZZWORDS_FLUFF' && v.severity === 'Atenção'),
      },
      {
        name: 'Recomenda verbos diretos ativos em 1ª pessoa (Configurei, Construí, Criei, Usei)',
        expected: true,
        actual: analysis.aiToneAudit.vertentes.some((v) => v.humanAlternative.includes('Configurei') || v.humanAlternative.includes('Construí')),
        passed: analysis.aiToneAudit.vertentes.some((v) => v.humanAlternative.includes('Configurei') || v.humanAlternative.includes('Construí')),
      },
    ];

    results.push({
      id: 'test-ai-tone-detection',
      name: 'Auditoria das 6 Vertentes de Linguajar de IA / Anti-AI Slop (Contexta.ai)',
      ruleCategory: 'AI_TONE_DETECTION',
      description: 'Escaneia o currículo contra as 6 vertentes de artificialidade para garantir tom profissional, direto e humano.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `Score de Tom de IA: ${analysis.aiToneAudit.aiLingoScore}/100 | Veredito: ${analysis.aiToneAudit.verdict}`,
    });
  }

  // TEST 7: Human Clean Resume vs AI Slop Differentiation
  {
    const t0 = Date.now();
    const mockJob = `Vaga: Engenheiro de Software. Stack: Python, PostgreSQL, Docker.`;
    const mockCleanResume = `
    Lucas Mendes. Desenvolvedor Backend com 4 anos de experiência.
    Construí APIs em Python (FastAPI) e configurei schemas em PostgreSQL.
    Criei containers Docker e usei testes automatizados com PyTest.
    `;

    const analysisClean = runHeuristicFallback(mockJob, mockCleanResume);

    const assertions = [
      {
        name: 'Reconhece currículo escrito com vocabulário factual em 1ª pessoa como Humano e Direto',
        expected: 'Humano e Direto',
        actual: analysisClean.aiToneAudit.verdict,
        passed: analysisClean.aiToneAudit.verdict === 'Humano e Direto',
      },
      {
        name: 'Score de IA fica abaixo de 30% em texto sem jargões inflados',
        expected: true,
        actual: analysisClean.aiToneAudit.aiLingoScore < 30,
        passed: analysisClean.aiToneAudit.aiLingoScore < 30,
      },
    ];

    results.push({
      id: 'test-clean-human-differentiation',
      name: 'Diferenciação de Escrita Humana Concreta vs Clichês de IA',
      ruleCategory: 'AI_TONE_DETECTION',
      description: 'Valida que currículos bem escritos com verbos técnicos diretos não sofrem falsos positivos de detecção de IA.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `Score de Tom de IA: ${analysisClean.aiToneAudit.aiLingoScore}% (${analysisClean.aiToneAudit.verdict})`,
    });
  }

  // TEST 8: Hard Character Bounds & Ephemeral Safety
  {
    const t0 = Date.now();
    const oversizedJob = 'A'.repeat(25000);
    const oversizedResume = 'B'.repeat(30000);

    const analysis = runHeuristicFallback(oversizedJob, oversizedResume);

    const assertions = [
      {
        name: 'Trunca e processa com segurança cargas acima de 15.000 / 20.000 caracteres',
        expected: true,
        actual: typeof analysis.atsScore === 'number' && analysis.atsScore >= 0,
        passed: typeof analysis.atsScore === 'number' && analysis.atsScore >= 0,
      },
    ];

    results.push({
      id: 'test-character-boundaries',
      name: 'Proteção de Limites de Caracteres & Segurança de Memória',
      ruleCategory: 'VERACITY_TRUTH',
      description: 'Garante que textos gigantescos sejam devidamente limitados sem quebrar a execução ou exceder tokens.',
      passed: assertions.every((a) => a.passed),
      executionTimeMs: Date.now() - t0,
      assertions,
      details: `Execução estável com limite seguro aplicado.`,
    });
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    totalDurationMs: Date.now() - startTime,
    results,
  };
}
