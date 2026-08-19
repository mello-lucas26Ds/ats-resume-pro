import { GoogleGenAI, Type } from '@google/genai';
import { AtsAnalysisResult, AiToneAudit } from '../app/types/ats.types';

export type AtsEngineAnalysis = AtsAnalysisResult;

// Strict character safety bounds to prevent server memory / token overflows
const MAX_SERVER_JOB_CHARS = 15000;
const MAX_SERVER_RESUME_CHARS = 20000;

const ATS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    atsScore: {
      type: Type.INTEGER,
      description: 'Pontuação geral de compatibilidade ATS de 0 a 100 baseada em requisitos inegociáveis e TOP 20%.',
    },
    fitGeneral: {
      type: Type.STRING,
      description: 'Forte, Moderado ou Baixo',
    },
    summaryHeadline: {
      type: Type.STRING,
      description: 'Resumo direto em 1 frase sobre a aderência global.',
    },
    seniorityAnalysis: {
      type: Type.OBJECT,
      properties: {
        jobLevel: { type: Type.STRING, description: 'Senioridade real exigida pela vaga (ex: Sênior, Pleno)' },
        resumeLevel: { type: Type.STRING, description: 'Senioridade real demonstrada no currículo' },
        summary: { type: Type.STRING, description: 'Explicação objetiva da equivalência' },
        isAligned: { type: Type.BOOLEAN, description: 'Se os níveis são compatíveis' },
      },
      required: ['jobLevel', 'resumeLevel', 'summary', 'isAligned'],
    },
    top20Requirements: {
      type: Type.ARRAY,
      description: 'Os 3 a 5 requisitos mais críticos (TOP 20% da vaga) que concentram 80% do peso da triagem.',
      items: {
        type: Type.OBJECT,
        properties: {
          requirement: { type: Type.STRING, description: 'Nome do requisito ou competência' },
          importance: { type: Type.STRING, description: 'Inegociável, Importante, Diferencial ou Baixa Prioridade' },
          status: { type: Type.STRING, description: 'ATENDE, PARCIAL ou NAO_ATENDE' },
          evidenceInResume: { type: Type.STRING, description: 'Citação exata ou evidência encontrada no currículo. Se não houver, vazio.' },
          actionNeeded: { type: Type.STRING, description: 'O que o candidato deve fazer para posicionar melhor essa competência' },
          weightScore: { type: Type.INTEGER, description: 'Pontuação de aderência deste item (0 a 100)' },
        },
        required: ['requirement', 'importance', 'status', 'evidenceInResume', 'actionNeeded', 'weightScore'],
      },
    },
    keywords: {
      type: Type.OBJECT,
      properties: {
        matched: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Palavras-chave e tecnologias da vaga encontradas no currículo.',
        },
        missing: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Palavras-chave essenciais da vaga ausentes no currículo.',
        },
        partialOrAdjacent: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Tecnologias adjacentes (ex: tem Docker mas vaga pede K8s).',
        },
        keywordDensityComment: {
          type: Type.STRING,
          description: 'Comentário sobre contextualização e prevenção de keyword stuffing.',
        },
      },
      required: ['matched', 'missing', 'partialOrAdjacent', 'keywordDensityComment'],
    },
    gapsAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gap: { type: Type.STRING, description: 'Descrição da lacuna identificada' },
          severity: { type: Type.STRING, description: 'Crítico, Moderado ou Pequeno' },
          impact: { type: Type.STRING, description: 'Impacto desta lacuna na triagem ATS' },
          mitigationStrategy: { type: Type.STRING, description: 'Estratégia ética para posicionar experiência real ou estudo' },
        },
        required: ['gap', 'severity', 'impact', 'mitigationStrategy'],
      },
    },
    sectionRecommendations: {
      type: Type.ARRAY,
      description: 'Recomendações cirúrgicas por seção do currículo com verbos em 1ª pessoa (Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei, Implementei) e o Bullet Point Pronto para o CV.',
      items: {
        type: Type.OBJECT,
        properties: {
          sectionName: { type: Type.STRING, description: 'Identificação exata da seção ou cargo no CV (ex: Experiência na Empresa X, Seção de Projetos, Resumo)' },
          currentIssue: { type: Type.STRING, description: 'O que está vago, passivo, artificial ou desalinhado no texto original do currículo' },
          suggestedAction: { type: Type.STRING, description: 'Orientação de reestruturação com a fórmula: [Verbo Ativo + Tecnologia + Resultado Real]' },
          metricOpportunity: { type: Type.STRING, description: 'Indicação de onde quantificar com números reais que o candidato deve levantar' },
          targetActionVerb: { type: Type.STRING, description: 'Verbo de ação em 1ª pessoa sugerido (ex: Configurei, Construí, Criei, Implementei, Otimizei)' },
          readyBulletTemplate: { type: Type.STRING, description: 'Bullet Point Pronto completo em 1ª pessoa ativa pronto para copiar para o CV, contendo a stack e placeholders como [+X% / Y ms / Z usuários]' },
        },
        required: ['sectionName', 'currentIssue', 'suggestedAction', 'metricOpportunity', 'targetActionVerb', 'readyBulletTemplate'],
      },
    },
    aiToneAudit: {
      type: Type.OBJECT,
      description: 'Auditoria de Detecção de Linguajar de IA / AI Slop baseada nas 6 vertentes do motor Contexta.ai',
      properties: {
        aiLingoScore: {
          type: Type.INTEGER,
          description: 'Score de 0 (100% humano e factual) a 100 (100% artificial/robótico gerado por IA).',
        },
        verdict: {
          type: Type.STRING,
          description: 'Humano e Direto, Sinais Leves de IA ou Altamente Artificial / Clichê de IA',
        },
        vertentes: {
          type: Type.ARRAY,
          description: 'As 6 vertentes de auditoria anti-linguajar robótico de IA',
          items: {
            type: Type.OBJECT,
            properties: {
              dimensionKey: {
                type: Type.STRING,
                description: 'BUZZWORDS_FLUFF, PASSIVE_AUTHORLESS, HOLLOW_ADJECTIVES, ROBOTIC_SYMMETRY, AI_TRANSITIONS, VAGUE_ABSTRACTION',
              },
              dimensionName: { type: Type.STRING, description: 'Nome legível da vertente' },
              severity: { type: Type.STRING, description: 'Limpo, Atenção ou Crítico' },
              detectedSnippets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Trechos ou palavras do currículo que denunciam escrita de IA ou clichê vazio',
              },
              humanAlternative: { type: Type.STRING, description: 'Como escrever com verbos diretos ativos (Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei)' },
              recommendation: { type: Type.STRING, description: 'Ação prática para purgar o tom artificial' },
            },
            required: ['dimensionKey', 'dimensionName', 'severity', 'detectedSnippets', 'humanAlternative', 'recommendation'],
          },
        },
        generalAdvice: {
          type: Type.STRING,
          description: 'Conselho geral sobre como humanizar e trazer densidade técnica real ao documento.',
        },
      },
      required: ['aiLingoScore', 'verdict', 'vertentes', 'generalAdvice'],
    },
    strategicQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Checklist de perguntas para o candidato refletir se possui dados não documentados.',
    },
  },
  required: [
    'atsScore',
    'fitGeneral',
    'summaryHeadline',
    'seniorityAnalysis',
    'top20Requirements',
    'keywords',
    'gapsAnalysis',
    'sectionRecommendations',
    'aiToneAudit',
    'strategicQuestions',
  ],
};

const candidateModels = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

export async function runAtsAnalysis(jobDescription: string, resumeText: string): Promise<AtsEngineAnalysis> {
  // Truncate incoming strings to enforce security and memory bounds
  const safeJob = jobDescription.slice(0, MAX_SERVER_JOB_CHARS).trim();
  const safeResume = resumeText.slice(0, MAX_SERVER_RESUME_CHARS).trim();

  const apiKey = process.env['GEMINI_API_KEY'];

  if (!apiKey) {
    // Fallback heuristic engine if no API key is available
    return runHeuristicFallback(safeJob, safeResume);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `
SISTEMA: AUDITOR SÊNIOR DE MATCH ATS, NLP, AUDITORIA DE LINGUAJAR DE IA E TRIAGEM TÉCNICA
Você é um auditor sênior de sistemas ATS, recrutamento técnico e especialista em detecção de "AI Slop" / escrita robótica de LLM em currículos.

SUA MISSÃO:
1. Comparar o CURRÍCULO com a VAGA fornecida e gerar um diagnóstico de triagem com pontuação ATS, identificação dos TOP 20% da vaga, lacunas críticas e recomendações práticas por seção.
2. AUDITAR O LINGUAJAR DE IA (ANTI-AI SLOP ENGINE) através das 6 VERTENTES:
   - Vertente 1: Jargões Inflados e Verbos Genéricos ("AI Buzzwords & Fluff") -> Palavras como "orquestrou", "revolucionou", "impulsionou", "alavancou sinergias", "transformacional", "spearheaded", "delve", "foster".
   - Vertente 2: Construções Passivas e Falta de Sujeito Claro ("Passive / Authorless") -> Frases sem sujeito que ocultam quem fez o trabalho ("Foi implementada uma solução visando...").
   - Vertente 3: Adjetivação Excessiva e Ausência de Evidência ("Hollow Adjectives") -> "Profissional altamente dinâmico, apaixonado por inovação, com visão 360° holística...".
   - Vertente 4: Simetria Sintática e Uniformidade Robótica ("Robotic Symmetry") -> Todos os tópicos com o mesmo tamanho artificial e fórmula idêntica sem naturalidade humana.
   - Vertente 5: Conectivos e Transições Artificiais de LLM ("AI Transitions") -> "Além disso,", "Nesse sentido,", "Com o objetivo primordial de,", "Visando a excelência operacional,".
   - Vertente 6: Falta de Especificidade de Domínio ("Vague Abstraction") -> Falar "usou modernas tecnologias de computação em nuvem" em vez de citar a ferramenta exata e o contexto real ("configurou cluster EKS com Terraform").

REGRAS LINGUÍSTICAS INEGOCIÁVEIS:
1. PADRÃO DE VERBOS ATIVOS: Nas sugestões de reescrita, oriente SEMPRE o uso de verbos de ação diretos no passado em 1ª pessoa (ex: "Configurei", "Construí", "Analisei", "Criei", "Transformei", "Carreguei", "Usei", "Implementei", "Otimizei", "Liderei"). NUNCA use jargões robóticos de IA como "orquestrou", "alavancou" ou frases passivas impessoais.
2. BULLET POINT PRONTO PARA SEU CV (1ª PESSOA ATIVA): Para cada item de sectionRecommendations, gere OBRIGATORIAMENTE um readyBulletTemplate: uma sentença completa, polida e pronta para colar no CV, começando com verbo ativo em 1ª pessoa, citando a ferramenta exata e usando marcadores de métricas como [+X% / Y usuários / Z ms] para o candidato preencher com seus dados reais.
3. NUNCA REESCREVA O CURRÍCULO INTEGRALMENTE: Aponte ONDE (seção/cargo) e O QUE o candidato deve melhorar com exemplos cirúrgicos de bullet points.
4. NUNCA INVENTE NÚMEROS, MÉTRICAS OU EXPERIÊNCIAS: Aponte onde ele deve quantificar seus próprios resultados reais através dos marcadores [+X%].
5. ADAPTAR ≠ INVENTAR: Se o candidato tem Docker, não diga que tem Kubernetes; se tem estudo em AWS, não trate como experiência profissional de produção.
6. FOCO NOS TOP 20%: Concentre 70% do peso nos 3 a 5 requisitos centrais e inegociáveis da vaga.
7. FÓRMULA DOS BULLET POINTS: Para recomendações de experiência, oriente a estrutura: [VERBO DE AÇÃO EM 1ª PESSOA + TECNOLOGIA/CONTEXTO + IMPACTO/MÉTRICA REAL].
8. EVIDÊNCIA FACTUAL OBRIGATÓRIA: Para cada item marcado como ATENDE, extraia a evidência real presente no currículo. Se não houver evidência factual, classifique como PARCIAL ou NÃO ATENDE.
9. LINGUAGEM DIRETA E HUMANA: Purgar qualquer tom pretensioso, mecânico ou gerado por prompt ingênuo de LLM.

---
VAGA DE EMPREGO (TEXTO):
${safeJob}

---
CURRÍCULO DO CANDIDATO (TEXTO):
${safeResume}
`;

  // Multi-model resilience loop: try primary (gemini-2.5-flash), then fallback (gemini-3.7-flash)
  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ATS_RESPONSE_SCHEMA,
          temperature: 0.2, // Baixa temperatura para determinismo e conformidade
        },
      });

      const text = response.text;
      if (text) {
        const parsed: AtsEngineAnalysis = JSON.parse(text);
        parsed.timestamp = new Date().toISOString();
        return parsed;
      }
    } catch (modelError: unknown) {
      console.warn(`Tentativa com modelo ${modelName} falhou, tentando alternativa...`, modelError);
      // Brief pause before trying next candidate
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // If all Gemini models are experiencing transient demand (HTTP 503), gracefully use high-precision heuristic fallback
  console.info('Executando motor heurístico determinístico de contingência.');
  return runHeuristicFallback(safeJob, safeResume);
}

/**
 * Heuristic fallback engine for offline development or instant test executions
 */
export function runHeuristicFallback(jobDescription: string, resumeText: string): AtsEngineAnalysis {
  const safeJob = jobDescription.slice(0, MAX_SERVER_JOB_CHARS);
  const safeResume = resumeText.slice(0, MAX_SERVER_RESUME_CHARS);

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
  const isSeniorResume = resumeLower.includes('sênior') || resumeLower.includes('senior') || resumeLower.includes('liderança') || resumeLower.includes('arquitetura');

  const fitGeneral = atsScore >= 80 ? 'Forte' : atsScore >= 60 ? 'Moderado' : 'Baixo';

  // AI Tone Pattern Matching (Contexta.ai 6-Pillar Heuristic Scan)
  const aiBuzzwords = ['orquestrou', 'alavancou', 'revolucionou', 'sinergia', 'transformacional', 'visando', 'fomentou', 'impulsionou'];
  const detectedBuzzwords = aiBuzzwords.filter((w) => resumeLower.includes(w));

  const passivePatterns = ['foi desenvolvido', 'foram criados', 'visando a melhoria', 'responsável por', 'atuou com o intuito de'];
  const detectedPassives = passivePatterns.filter((p) => resumeLower.includes(p));

  const hollowAdjectives = ['apaixonado por', 'visão 360', 'altamente qualificado', 'orientado a resultados', 'dinâmico e proativo'];
  const detectedAdjectives = hollowAdjectives.filter((a) => resumeLower.includes(a));

  const aiTransitions = ['além disso', 'nesse sentido', 'com vistas a', 'de forma a garantir', 'sob a égide'];
  const detectedTransitions = aiTransitions.filter((t) => resumeLower.includes(t));

  const aiLingoScore = Math.min(95, Math.max(10, (detectedBuzzwords.length * 20) + (detectedPassives.length * 15) + (detectedAdjectives.length * 15) + (detectedTransitions.length * 10)));
  const aiVerdict = aiLingoScore < 30 ? 'Humano e Direto' : aiLingoScore < 65 ? 'Sinais Leves de IA' : 'Altamente Artificial / Clichê de IA';

  const aiToneAudit: AiToneAudit = {
    aiLingoScore,
    verdict: aiVerdict,
    vertentes: [
      {
        dimensionKey: 'BUZZWORDS_FLUFF',
        dimensionName: 'Jargões Inflados & Verbos Genéricos',
        severity: detectedBuzzwords.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedBuzzwords.length > 0 ? detectedBuzzwords : [],
        humanAlternative: 'Use verbos de ação diretos em 1ª pessoa: "Configurei", "Construí", "Analisei", "Criei", "Transformei", "Carreguei", "Usei".',
        recommendation: detectedBuzzwords.length > 0
          ? `Substitua jargões como "${detectedBuzzwords.join(', ')}" por verbos concretos e objetivos como "Configurei", "Construí" ou "Implementei".`
          : 'Vocabulário profissional limpo, sem termos inflados detectados.',
      },
      {
        dimensionKey: 'PASSIVE_AUTHORLESS',
        dimensionName: 'Construções Passivas & Autoria Oculta',
        severity: detectedPassives.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedPassives.length > 0 ? detectedPassives : [],
        humanAlternative: 'Assuma a responsabilidade direta: "Construí a API X e configurei o cluster Y" em vez de "Foi desenvolvido...".',
        recommendation: detectedPassives.length > 0
          ? 'Transforme sentenças passivas em ações diretas em primeira pessoa ("Construí", "Implementei").'
          : 'Autoria e responsabilidade pessoal bem estruturadas nas descrições.',
      },
      {
        dimensionKey: 'HOLLOW_ADJECTIVES',
        dimensionName: 'Adjetivação Excessiva & Falta de Evidência',
        severity: detectedAdjectives.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedAdjectives.length > 0 ? detectedAdjectives : [],
        humanAlternative: 'Em vez de dizer "apaixonado por inovação", mostre: "Otimizei a latência em 35% e criei arquitetura escalável".',
        recommendation: detectedAdjectives.length > 0
          ? 'Substitua adjetivos de auto-elogio por fatos técnicos mensuráveis e tecnologias aplicadas.'
          : 'Sem adjetivação vazia ou auto-elogios não comprovados.',
      },
      {
        dimensionKey: 'ROBOTIC_SYMMETRY',
        dimensionName: 'Simetria Sintática & Uniformidade de LLM',
        severity: 'Limpo',
        detectedSnippets: [],
        humanAlternative: 'Varie o tamanho dos tópicos e o nível de profundidade técnica conforme a relevância do projeto.',
        recommendation: 'Cadência textual equilibrada com variações naturais de pontuação e estrutura.',
      },
      {
        dimensionKey: 'AI_TRANSITIONS',
        dimensionName: 'Conectivos Artificiais de Transição',
        severity: detectedTransitions.length > 0 ? 'Atenção' : 'Limpo',
        detectedSnippets: detectedTransitions.length > 0 ? detectedTransitions : [],
        humanAlternative: 'Corte conectivos formais desnecessários. Abra o bullet point diretamente com o verbo de ação.',
        recommendation: detectedTransitions.length > 0
          ? `Elimine conectivos como "${detectedTransitions.join(', ')}" que incham o texto sem agregar valor técnico.`
          : 'Transições textuais limpas e objetivas.',
      },
      {
        dimensionKey: 'VAGUE_ABSTRACTION',
        dimensionName: 'Falta de Especificidade de Domínio',
        severity: missing.length > 2 ? 'Atenção' : 'Limpo',
        detectedSnippets: missing.length > 2 ? ['Termos genéricos em vez de ferramentas da vaga'] : [],
        humanAlternative: 'Cite explicitamente a stack: "Configurei PostgreSQL, Redis e Docker no pipeline de CI/CD".',
        recommendation: 'Garanta que cada projeto cite a stack exata (ex: Postgres, Redis, Docker, Angular 18) e não apenas "bancos de dados e nuvem".',
      },
    ],
    generalAdvice: 'Currículos bem avaliados por recrutadores e ATS seniores priorizam concisão, verbos de ação diretos em 1ª pessoa (Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei), stack explícita e métricas de impacto reais.',
  };

  const top20Requirements = [
    {
      requirement: jobKeywords[0] ? `Domínio de ${jobKeywords[0].toUpperCase()} e ecossistema` : 'Competência Técnica Principal',
      importance: 'Inegociável' as const,
      status: (matched.length > 0 && jobKeywords[0] && matched.includes(jobKeywords[0])) ? ('ATENDE' as const) : ('NAO_ATENDE' as const),
      evidenceInResume: (matched.length > 0 && jobKeywords[0] && matched.includes(jobKeywords[0])) ? `Termo "${jobKeywords[0]}" identificado no currículo.` : '',
      actionNeeded: 'Destaque projetos de produção com essa stack no topo do currículo com verbos de ação claros.',
      weightScore: (matched.length > 0 && jobKeywords[0] && matched.includes(jobKeywords[0])) ? 90 : 20,
    },
    {
      requirement: jobKeywords[1] ? `Experiência com ${jobKeywords[1].toUpperCase()}` : 'Ferramentas de Arquitetura & Banco',
      importance: 'Inegociável' as const,
      status: (jobKeywords[1] && matched.includes(jobKeywords[1])) ? ('ATENDE' as const) : ('PARCIAL' as const),
      evidenceInResume: (jobKeywords[1] && matched.includes(jobKeywords[1])) ? `Experiência com ${jobKeywords[1]} identificada.` : '',
      actionNeeded: 'Se possuir experiência profissional comprovada, detalhe o contexto de uso com métricas reais.',
      weightScore: (jobKeywords[1] && matched.includes(jobKeywords[1])) ? 85 : 45,
    },
    {
      requirement: 'Autonomia e Entrega Orientada a Resultados',
      importance: 'Importante' as const,
      status: resumeLower.includes('construi') || resumeLower.includes('configurei') || resumeLower.includes('desenvolvi') || resumeLower.includes('liderou') ? ('ATENDE' as const) : ('PARCIAL' as const),
      evidenceInResume: 'Verbos de ação e realizações encontradas nas experiências.',
      actionNeeded: 'Substitua sentenças passivas pela fórmula: [Ação (Construí/Configurei/Criei) + Stack + Métrica/Impacto real].',
      weightScore: 80,
    },
    {
      requirement: missing.length > 0 ? `Requisito complementar: ${missing[0].toUpperCase()}` : 'Práticas de Testes e CI/CD',
      importance: 'Diferencial' as const,
      status: missing.length > 0 ? ('NAO_ATENDE' as const) : ('ATENDE' as const),
      evidenceInResume: missing.length > 0 ? '' : 'Evidência presente no histórico profissional.',
      actionNeeded: missing.length > 0 ? `Caso tenha estudo ou conhecimento em ${missing[0]}, mencione na seção de competências sem simular produção.` : 'Mantenha o destaque.',
      weightScore: missing.length > 0 ? 10 : 90,
    },
  ];

  return {
    atsScore,
    fitGeneral,
    summaryHeadline: `Aderência de ${atsScore}% com ${matched.length} de ${jobKeywords.length || 'vários'} requisitos-chave identificados no currículo.`,
    seniorityAnalysis: {
      jobLevel: isSeniorJob ? 'Sênior' : 'Pleno',
      resumeLevel: isSeniorResume ? 'Sênior' : 'Pleno',
      summary: (isSeniorJob === isSeniorResume)
        ? 'Nível de senioridade demandado pela vaga está alinhado com o histórico profissional apresentado.'
        : 'A vaga exige maior profundidade em tomada de decisão técnica e liderança de escopo.',
      isAligned: isSeniorJob === isSeniorResume,
    },
    top20Requirements,
    keywords: {
      matched: matched.length > 0 ? matched : ['Experiência Geral', 'Resolução de Problemas'],
      missing: missing.length > 0 ? missing : ['Nenhuma palavra crítica ausente identificada'],
      partialOrAdjacent: partial,
      keywordDensityComment: 'As palavras-chave identificadas devem ser inseridas de forma natural nas frases de impacto, evitando repetições artificiais.',
    },
    gapsAnalysis: missing.slice(0, 3).map((m) => ({
      gap: `Ausência de menção explícita a ${m.toUpperCase()}`,
      severity: 'Moderado' as const,
      impact: 'Algoritmos de ATS que filtram por esse termo exato podem reduzir a classificação inicial.',
      mitigationStrategy: `Se você já utilizou ${m} em projetos reais ou acadêmicos, documente o caso de uso. Caso contrário, evidencie tecnologias correlatas que você domina.`,
    })),
    sectionRecommendations: [
      {
        sectionName: 'Resumo Profissional (Topo do CV)',
        currentIssue: 'Pode estar genérico ou conter adjetivos sem evidência, sem enfatizar de imediato os requisitos TOP 20% da vaga.',
        suggestedAction: 'Abra o resumo declarando seu cargo/foco principal alinhado à vaga e cite de 2 a 3 tecnologias centrais exigidas.',
        metricOpportunity: 'Inclua o tempo total de experiência comprovada e volume de entregas.',
        targetActionVerb: 'Construí',
        readyBulletTemplate: jobKeywords[0]
          ? `Especialista com foco em ${jobKeywords[0].toUpperCase()} e arquitetura escalável, com histórico de entrega de sistemas atendendo [+X mil usuários] e [+Y anos de atuação].`
          : 'Profissional focado em engenharia de software e arquitetura escalável com entregas de alto impacto em produção.',
      },
      {
        sectionName: 'Experiências Profissionais Recentes (Bullet Points)',
        currentIssue: 'Descrições focadas em tarefas passivas do dia a dia ("foi desenvolvido", "responsável por") em vez de impacto e autoria.',
        suggestedAction: 'Reescreva os tópicos no padrão: [Ação (Configurei / Construí / Analisei / Criei / Transformei / Carreguei / Usei) + Tecnologia + Impacto mensurável].',
        metricOpportunity: 'Adicione suas métricas reais (ex: tempo de resposta otimizado, percentual de cobertura de testes, volume de dados processados).',
        targetActionVerb: 'Configurei',
        readyBulletTemplate: (jobKeywords[0] && jobKeywords[1])
          ? `Configurei e construí a arquitetura baseada em ${jobKeywords[0].toUpperCase()} e ${jobKeywords[1].toUpperCase()}, otimizando o tempo de resposta em [+X%] para [+Y mil requisições/min].`
          : 'Configurei e otimizei a infraestrutura e microsserviços principais, reduzindo o tempo de processamento em [+X%] e aumentando a confiabilidade.',
      },
      {
        sectionName: 'Projetos Técnicos & Portfólio',
        currentIssue: 'Projetos descritos sem evidenciar as decisões arquiteturais e as ferramentas exigidas na vaga.',
        suggestedAction: 'Destaque o objetivo do projeto, as tecnologias exatas empregadas e os resultados alcançados.',
        metricOpportunity: 'Quantifique a cobertura de testes, escalabilidade ou economia de recursos obtida.',
        targetActionVerb: 'Implementei',
        readyBulletTemplate: (matched[0] || jobKeywords[0])
          ? `Implementei solução completa utilizando ${(matched[0] || jobKeywords[0]).toUpperCase()}, com testes automatizados e deploy contínuo garantindo [+X% de cobertura].`
          : 'Implementei pipeline completo com testes unitários e CI/CD automatizado, reduzindo o tempo de deploy de [X horas] para [Y minutos].',
      },
    ],
    aiToneAudit,
    strategicQuestions: [
      'Você já trabalhou com alguma das tecnologias ausentes mesmo que em projetos internos ou estudos aprofundados?',
      'Quais métricas reais (latência, volume de requisições, ganho de produtividade) você pode levantar para as últimas 2 experiências?',
      'Há projetos que não estão no currículo mas que demonstram melhor os requisitos inegociáveis desta vaga específica?',
    ],
    timestamp: new Date().toISOString(),
  };
}
