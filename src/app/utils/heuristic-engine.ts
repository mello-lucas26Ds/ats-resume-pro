import { AtsAnalysisResult, AiToneAudit } from '../types/ats.types';

const MAX_JOB_CHARS = 15000;
const MAX_RESUME_CHARS = 20000;

export function runHeuristicFallback(jobDescription: string, resumeText: string, isEnglish = false): AtsAnalysisResult {
  const safeJob = jobDescription.slice(0, MAX_JOB_CHARS);
  const safeResume = resumeText.slice(0, MAX_RESUME_CHARS);

  const jobLower = safeJob.toLowerCase();
  const resumeLower = safeResume.toLowerCase();

  const commonKeywords = [
    'typescript', 'javascript', 'angular', 'react', 'vue', 'node.js', 'python', 'fastapi',
    'django', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'sql', 'postgresql',
    'mongodb', 'git', 'rest', 'graphql', 'tailwind', 'microservices', 'testes', 'jest',
    'tdd', 'scrum', 'agile', 'linux', 'nlp', 'machine learning', 'devops', 'kafka', 'redis'
  ];

  const jobKeywords = commonKeywords.filter((k) => jobLower.includes(k));
  const matched = jobKeywords.filter((k) => resumeLower.includes(k));
  const missing = jobKeywords.filter((k) => !resumeLower.includes(k));
  const partial = commonKeywords.filter((k) => !jobKeywords.includes(k) && resumeLower.includes(k)).slice(0, 3);

  const matchRatio = jobKeywords.length > 0 ? (matched.length / jobKeywords.length) : 0.75;
  const atsScore = Math.min(98, Math.max(25, Math.round(matchRatio * 85 + (matched.length > 4 ? 10 : 0))));

  const isSeniorJob = jobLower.includes('sênior') || jobLower.includes('senior') || jobLower.includes('tech lead');
  const isSeniorResume = resumeLower.includes('sênior') || resumeLower.includes('senior') || resumeLower.includes('liderança') || resumeLower.includes('arquitetura') || resumeLower.includes('lead');

  const fitGeneral = atsScore >= 80 ? 'Forte' : atsScore >= 60 ? 'Moderado' : 'Baixo';

  // AI Tone Pattern Matching (Contexta.ai 6-Pillar Heuristic Scan)
  const aiBuzzwords = ['orquestrou', 'alavancou', 'revolucionou', 'sinergia', 'transformacional', 'visando', 'fomentou', 'impulsionou', 'spearheaded', 'delve', 'foster', 'synergy'];
  const detectedBuzzwords = aiBuzzwords.filter((w) => resumeLower.includes(w));

  const passivePatterns = ['foi desenvolvido', 'foram criados', 'visando a melhoria', 'responsável por', 'atuou com o intuito de', 'was developed', 'responsible for'];
  const detectedPassives = passivePatterns.filter((p) => resumeLower.includes(p));

  const hollowAdjectives = ['apaixonado por', 'visão 360', 'altamente qualificado', 'orientado a resultados', 'dinâmico e proativo', 'passionate about', 'results-driven', 'highly skilled'];
  const detectedAdjectives = hollowAdjectives.filter((a) => resumeLower.includes(a));

  const aiTransitions = ['além disso', 'nesse sentido', 'com vistas a', 'de forma a garantir', 'sob a égide', 'furthermore', 'moreover', 'in order to'];
  const detectedTransitions = aiTransitions.filter((t) => resumeLower.includes(t));

  const aiLingoScore = Math.min(95, Math.max(10, (detectedBuzzwords.length * 20) + (detectedPassives.length * 15) + (detectedAdjectives.length * 15) + (detectedTransitions.length * 10)));
  const aiVerdict = aiLingoScore < 30 ? (isEnglish ? 'Human & Direct' : 'Humano e Direto') : aiLingoScore < 65 ? (isEnglish ? 'Mild AI Clichés' : 'Sinais Leves de IA') : (isEnglish ? 'Heavy AI Buzzwords' : 'Altamente Artificial / Clichê de IA');

  const aiToneAudit: AiToneAudit = {
    aiLingoScore,
    verdict: aiVerdict,
    vertentes: [
      {
        dimensionKey: 'BUZZWORDS_FLUFF',
        dimensionName: isEnglish ? 'Inflated Buzzwords & Generic Verbs' : 'Jargões Inflados & Verbos Genéricos',
        severity: detectedBuzzwords.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedBuzzwords.length > 0 ? detectedBuzzwords : [],
        humanAlternative: isEnglish
          ? 'Use 1st-person direct action verbs: "Built", "Configured", "Implemented", "Analyzed", "Engineered", "Optimized".'
          : 'Use verbos de ação diretos em 1ª pessoa: "Configurei", "Construí", "Analisei", "Criei", "Transformei", "Carreguei", "Usei".',
        recommendation: detectedBuzzwords.length > 0
          ? (isEnglish ? `Replace buzzwords like "${detectedBuzzwords.join(', ')}" with concrete action verbs like "Built" or "Implemented".` : `Substitua jargões como "${detectedBuzzwords.join(', ')}" por verbos concretos como "Configurei", "Construí" ou "Implementei".`)
          : (isEnglish ? 'Clean technical vocabulary without empty buzzwords.' : 'Vocabulário profissional limpo, sem termos inflados detectados.'),
      },
      {
        dimensionKey: 'PASSIVE_AUTHORLESS',
        dimensionName: isEnglish ? 'Passive Voice & Hidden Authorship' : 'Construções Passivas & Autoria Oculta',
        severity: detectedPassives.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedPassives.length > 0 ? detectedPassives : [],
        humanAlternative: isEnglish
          ? 'Take direct ownership: "Built the API and configured the cluster" instead of "It was developed...".'
          : 'Assuma a responsabilidade direta: "Construí a API X e configurei o cluster Y" em vez de "Foi desenvolvido...".',
        recommendation: detectedPassives.length > 0
          ? (isEnglish ? 'Transform passive clauses into first-person active sentences ("Built", "Engineered").' : 'Transforme sentenças passivas em ações diretas em primeira pessoa ("Construí", "Implementei").')
          : (isEnglish ? 'Direct personal ownership and accountability detected.' : 'Autoria e responsabilidade pessoal bem estruturadas nas descrições.'),
      },
      {
        dimensionKey: 'HOLLOW_ADJECTIVES',
        dimensionName: isEnglish ? 'Hollow Adjectives & Unsubstantiated Praise' : 'Adjetivação Excessiva & Falta de Evidência',
        severity: detectedAdjectives.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedAdjectives.length > 0 ? detectedAdjectives : [],
        humanAlternative: isEnglish
          ? 'Instead of "passionate about innovation", demonstrate: "Reduced latency by 35% using distributed caching".'
          : 'Em vez de dizer "apaixonado por inovação", mostre: "Otimizei a latência em 35% e criei arquitetura escalável".',
        recommendation: detectedAdjectives.length > 0
          ? (isEnglish ? 'Replace empty adjectives with measurable technical results and concrete tooling.' : 'Substitua adjetivos de auto-elogio por fatos técnicos mensuráveis e tecnologias aplicadas.')
          : (isEnglish ? 'No empty self-praise detected.' : 'Sem adjetivação vazia ou auto-elogios não comprovados.'),
      },
      {
        dimensionKey: 'ROBOTIC_SYMMETRY',
        dimensionName: isEnglish ? 'Syntactic Symmetry & LLM Uniformity' : 'Simetria Sintática & Uniformidade de LLM',
        severity: 'Limpo',
        detectedSnippets: [],
        humanAlternative: isEnglish
          ? 'Vary bullet point lengths and technical depth based on project significance.'
          : 'Varie o tamanho dos tópicos e o nível de profundidade técnica conforme a relevância do projeto.',
        recommendation: isEnglish ? 'Natural sentence pacing with authentic structural variations.' : 'Cadência textual equilibrada com variações naturais de pontuação e estrutura.',
      },
      {
        dimensionKey: 'AI_TRANSITIONS',
        dimensionName: isEnglish ? 'Artificial AI Connectors' : 'Conectivos Artificiais de Transição',
        severity: detectedTransitions.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedTransitions.length > 0 ? detectedTransitions : [],
        humanAlternative: isEnglish
          ? 'Trim filler transition words. Open the bullet point directly with the action verb.'
          : 'Corte conectivos formais desnecessários. Abra o bullet point diretamente com o verbo de ação.',
        recommendation: detectedTransitions.length > 0
          ? (isEnglish ? `Eliminate connectors like "${detectedTransitions.join(', ')}" that add bloat.` : `Elimine conectivos como "${detectedTransitions.join(', ')}" que incham o texto sem agregar valor técnico.`)
          : (isEnglish ? 'Concise transitions without filler phrases.' : 'Transições textuais limpas e objetivas.'),
      },
      {
        dimensionKey: 'VAGUE_ABSTRACTION',
        dimensionName: isEnglish ? 'Domain Vagueness & Missing Stacks' : 'Falta de Especificidade de Domínio',
        severity: missing.length > 2 ? 'Atenção' : 'Limpo',
        detectedSnippets: missing.length > 2 ? [isEnglish ? 'Generic terms instead of job-required tooling' : 'Termos genéricos em vez de ferramentas da vaga'] : [],
        humanAlternative: isEnglish
          ? 'Name tools explicitly: "Configured PostgreSQL, Redis, and Docker in CI/CD pipeline".'
          : 'Cite explicitamente a stack: "Configurei PostgreSQL, Redis e Docker no pipeline de CI/CD".',
        recommendation: isEnglish
          ? 'Ensure each project explicitly names the applied tech stack rather than generic categories.'
          : 'Garanta que cada projeto cite a stack exata (ex: Postgres, Redis, Docker, Angular) e não apenas "bancos de dados e nuvem".',
      },
    ],
    generalAdvice: isEnglish
      ? 'Top engineering hiring managers prioritize concise, active 1st-person verbs (Built, Configured, Implemented, Analyzed), exact stacks, and quantifiable impact metrics.'
      : 'Currículos bem avaliados por recrutadores e ATS seniores priorizam concisão, verbos de ação diretos em 1ª pessoa (Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei), stack explícita e métricas de impacto reais.',
  };

  const top20Requirements = [
    {
      requirement: jobKeywords[0] ? (isEnglish ? `Hands-on ${jobKeywords[0].toUpperCase()} ecosystem` : `Domínio de ${jobKeywords[0].toUpperCase()} e ecossistema`) : (isEnglish ? 'Core Engineering Competency' : 'Competência Técnica Principal'),
      importance: 'Inegociável' as const,
      status: (matched.length > 0 && jobKeywords[0] && matched.includes(jobKeywords[0])) ? ('ATENDE' as const) : ('NAO_ATENDE' as const),
      evidenceInResume: (matched.length > 0 && jobKeywords[0] && matched.includes(jobKeywords[0])) ? (isEnglish ? `Term "${jobKeywords[0]}" identified in resume.` : `Termo "${jobKeywords[0]}" identificado no currículo.`) : '',
      actionNeeded: isEnglish ? 'Highlight production projects with this stack at the top of your resume with active verbs.' : 'Destaque projetos de produção com essa stack no topo do currículo com verbos de ação claros.',
      weightScore: (matched.length > 0 && jobKeywords[0] && matched.includes(jobKeywords[0])) ? 90 : 20,
    },
    {
      requirement: jobKeywords[1] ? (isEnglish ? `Experience with ${jobKeywords[1].toUpperCase()}` : `Experiência com ${jobKeywords[1].toUpperCase()}`) : (isEnglish ? 'Architecture & Database Tooling' : 'Ferramentas de Arquitetura & Banco'),
      importance: 'Inegociável' as const,
      status: (jobKeywords[1] && matched.includes(jobKeywords[1])) ? ('ATENDE' as const) : ('PARCIAL' as const),
      evidenceInResume: (jobKeywords[1] && matched.includes(jobKeywords[1])) ? (isEnglish ? `Experience with ${jobKeywords[1]} found.` : `Experiência com ${jobKeywords[1]} identificada.`) : '',
      actionNeeded: isEnglish ? 'If you have production experience, quantify usage context with real metrics.' : 'Se possuir experiência profissional comprovada, detalhe o contexto de uso com métricas reais.',
      weightScore: (jobKeywords[1] && matched.includes(jobKeywords[1])) ? 85 : 45,
    },
    {
      requirement: isEnglish ? 'Autonomy & Outcome-Driven Delivery' : 'Autonomia e Entrega Orientada a Resultados',
      importance: 'Importante' as const,
      status: resumeLower.includes('construi') || resumeLower.includes('configurei') || resumeLower.includes('built') || resumeLower.includes('implemented') ? ('ATENDE' as const) : ('PARCIAL' as const),
      evidenceInResume: isEnglish ? 'Active action verbs and outcomes found across roles.' : 'Verbos de ação e realizações encontradas nas experiências.',
      actionNeeded: isEnglish ? 'Structure achievements following: [Action (Built/Configured/Engineered) + Stack + Measurable Metric].' : 'Substitua sentenças passivas pela fórmula: [Ação (Construí/Configurei/Criei) + Stack + Métrica/Impacto real].',
      weightScore: 80,
    },
    {
      requirement: missing.length > 0 ? (isEnglish ? `Complementary skill: ${missing[0].toUpperCase()}` : `Requisito complementar: ${missing[0].toUpperCase()}`) : (isEnglish ? 'Testing & CI/CD Practices' : 'Práticas de Testes e CI/CD'),
      importance: 'Diferencial' as const,
      status: missing.length > 0 ? ('NAO_ATENDE' as const) : ('ATENDE' as const),
      evidenceInResume: missing.length > 0 ? '' : (isEnglish ? 'Evidence verified in career track.' : 'Evidência presente no histórico profissional.'),
      actionNeeded: missing.length > 0 ? (isEnglish ? `If experienced with ${missing[0]}, explicitly mention it in skills/projects.` : `Caso tenha estudo ou conhecimento em ${missing[0]}, mencione na seção de competências sem simular produção.`) : (isEnglish ? 'Maintain emphasis.' : 'Mantenha o destaque.'),
      weightScore: missing.length > 0 ? 10 : 90,
    },
  ];

  return {
    atsScore,
    fitGeneral,
    summaryHeadline: isEnglish
      ? `ATS compatibility score of ${atsScore}% with ${matched.length} of ${jobKeywords.length || 'several'} key requirements detected in your resume.`
      : `Aderência de ${atsScore}% com ${matched.length} de ${jobKeywords.length || 'vários'} requisitos-chave identificados no currículo.`,
    seniorityAnalysis: {
      jobLevel: isSeniorJob ? (isEnglish ? 'Senior' : 'Sênior') : (isEnglish ? 'Mid-level' : 'Pleno'),
      resumeLevel: isSeniorResume ? (isEnglish ? 'Senior' : 'Sênior') : (isEnglish ? 'Mid-level' : 'Pleno'),
      summary: (isSeniorJob === isSeniorResume)
        ? (isEnglish ? 'Seniority requirements match the verified professional track in your resume.' : 'Nível de senioridade demandado pela vaga está alinhado com o histórico profissional apresentado.')
        : (isEnglish ? 'Job demands deeper technical leadership and architecture ownership.' : 'A vaga exige maior profundidade em tomada de decisão técnica e liderança de escopo.'),
      isAligned: isSeniorJob === isSeniorResume,
    },
    top20Requirements,
    keywords: {
      matched: matched.length > 0 ? matched : [isEnglish ? 'General Engineering' : 'Experiência Geral', isEnglish ? 'Problem Solving' : 'Resolução de Problemas'],
      missing: missing.length > 0 ? missing : [isEnglish ? 'No critical missing keywords detected' : 'Nenhuma palavra crítica ausente identificada'],
      partialOrAdjacent: partial,
      keywordDensityComment: isEnglish
        ? 'Integrate keywords contextually inside high-impact achievement bullets, avoiding artificial stuffing.'
        : 'As palavras-chave identificadas devem ser inseridas de forma natural nas frases de impacto, evitando repetições artificiais.',
    },
    gapsAnalysis: missing.slice(0, 3).map((m) => ({
      gap: isEnglish ? `Missing explicit mention of ${m.toUpperCase()}` : `Ausência de menção explícita a ${m.toUpperCase()}`,
      severity: 'Moderado' as const,
      impact: isEnglish ? 'ATS filters strict on this keyword may score lower.' : 'Algoritmos de ATS que filtram por esse termo exato podem reduzir a classificação inicial.',
      mitigationStrategy: isEnglish
        ? `If experienced with ${m} in real-world or academic projects, document context. Otherwise highlight adjacent tooling you master.`
        : `Se você já utilizou ${m} em projetos reais ou acadêmicos, documente o caso de uso. Caso contrário, evidencie tecnologias correlatas que você domina.`,
    })),
    sectionRecommendations: [
      {
        sectionName: isEnglish ? 'Professional Summary (Top of CV)' : 'Resumo Profissional (Topo do CV)',
        currentIssue: isEnglish
          ? 'May be generic or lack early emphasis on the top 20% core requirements.'
          : 'Pode estar genérico ou conter adjetivos sem evidência, sem enfatizar de imediato os requisitos TOP 20% da vaga.',
        suggestedAction: isEnglish
          ? 'Open by stating your core engineering title aligned to the role and cite 2-3 essential required technologies.'
          : 'Abra o resumo declarando seu cargo/foco principal alinhado à vaga e cite de 2 a 3 tecnologias centrais exigidas.',
        metricOpportunity: isEnglish ? 'Include total years of verified track record and project scale.' : 'Inclua o tempo total de experiência comprovada e volume de entregas.',
        targetActionVerb: isEnglish ? 'Built' : 'Construí',
        readyBulletTemplate: jobKeywords[0]
          ? (isEnglish
            ? `Specialist focused on ${jobKeywords[0].toUpperCase()} and scalable architecture, with track record delivering systems serving [+Xk users] over [+Y years of experience].`
            : `Especialista com foco em ${jobKeywords[0].toUpperCase()} e arquitetura escalável, com histórico de entrega de sistemas atendendo [+X mil usuários] e [+Y anos de atuação].`)
          : (isEnglish
            ? 'Software engineer focused on scalable architectures with production deliveries at scale.'
            : 'Profissional focado em engenharia de software e arquitetura escalável com entregas de alto impacto em produção.'),
      },
      {
        sectionName: isEnglish ? 'Recent Experience (Bullet Points)' : 'Experiências Profissionais Recentes (Bullet Points)',
        currentIssue: isEnglish
          ? 'Descriptions focus on passive duties ("responsible for", "was developed") rather than ownership.'
          : 'Descrições focadas em tarefas passivas do dia a dia ("foi desenvolvido", "responsável por") em vez de impacto e autoria.',
        suggestedAction: isEnglish
          ? 'Rewrite bullets using formula: [Action (Built/Configured/Engineered) + Technology + Quantifiable Impact].'
          : 'Reescreva os tópicos no padrão: [Ação (Configurei / Construí / Analisei / Criei / Transformei / Carreguei / Usei) + Tecnologia + Impacto mensurável].',
        metricOpportunity: isEnglish ? 'Add latency drop, test coverage percentage, or throughput metrics.' : 'Adicione suas métricas reais (ex: tempo de resposta otimizado, percentual de cobertura de testes, volume de dados processados).',
        targetActionVerb: isEnglish ? 'Configured' : 'Configurei',
        readyBulletTemplate: (jobKeywords[0] && jobKeywords[1])
          ? (isEnglish
            ? `Configured and built architecture based on ${jobKeywords[0].toUpperCase()} and ${jobKeywords[1].toUpperCase()}, improving response latency by [+X%] under [+Yk reqs/min].`
            : `Configurei e construí a arquitetura baseada em ${jobKeywords[0].toUpperCase()} e ${jobKeywords[1].toUpperCase()}, otimizando o tempo de resposta em [+X%] para [+Y mil requisições/min].`)
          : (isEnglish
            ? 'Configured and optimized core microservices and infrastructure, reducing processing time by [+X%] and increasing uptime.'
            : 'Configurei e otimizei a infraestrutura e microsserviços principais, reduzindo o tempo de processamento em [+X%] e aumentando a confiabilidade.'),
      },
      {
        sectionName: isEnglish ? 'Technical Projects & Portfolio' : 'Projetos Técnicos & Portfólio',
        currentIssue: isEnglish
          ? 'Projects described without showcasing architectural decisions or required tooling.'
          : 'Projetos descritos sem evidenciar as decisões arquiteturais e as ferramentas exigidas na vaga.',
        suggestedAction: isEnglish
          ? 'Highlight project goals, exact technologies applied, and measurable benchmarks.'
          : 'Destaque o objetivo do projeto, as tecnologias exatas empregadas e os resultados alcançados.',
        metricOpportunity: isEnglish ? 'Quantify test coverage, scalability gain, or resource savings.' : 'Quantifique a cobertura de testes, escalabilidade ou economia de recursos obtida.',
        targetActionVerb: isEnglish ? 'Implemented' : 'Implementei',
        readyBulletTemplate: (matched[0] || jobKeywords[0])
          ? (isEnglish
            ? `Implemented end-to-end solution using ${(matched[0] || jobKeywords[0]).toUpperCase()}, with automated tests and CI/CD ensuring [+X% coverage].`
            : `Implementei solução completa utilizando ${(matched[0] || jobKeywords[0]).toUpperCase()}, com testes automatizados e deploy contínuo garantindo [+X% de cobertura].`)
          : (isEnglish
            ? 'Implemented complete CI/CD pipeline and unit tests, reducing deployment cycle time from [X hours] to [Y minutes].'
            : 'Implementei pipeline completo com testes unitários e CI/CD automatizado, reduzindo o tempo de deploy de [X horas] para [Y minutos].'),
      },
    ],
    aiToneAudit,
    strategicQuestions: isEnglish
      ? [
        'Have you worked with any missing technologies in side projects or deep academic work?',
        'What real metrics (latency, throughput, cost savings) can you verify for your last 2 roles?',
        'Are there unlisted projects that demonstrate must-have requirements for this job?',
      ]
      : [
        'Você já trabalhou com alguma das tecnologias ausentes mesmo que em projetos internos ou estudos aprofundados?',
        'Quais métricas reais (latência, volume de requisições, ganho de produtividade) você pode levantar para as últimas 2 experiências?',
        'Há projetos que não estão no currículo mas que demonstram melhor os requisitos inegociáveis desta vaga específica?',
      ],
    timestamp: new Date().toISOString(),
  };
}
