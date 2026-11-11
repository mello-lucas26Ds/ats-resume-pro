import {
  AiToneAudit,
  AiToneVertente,
  AtsAnalysisResult,
  ContractChange,
  ContractRequirement,
  FitLevel,
  GapAnalysisItem,
  GapSeverity,
  KeywordsAnalysis,
  MatchStatus,
  RequirementImportance,
  SectionRecommendation,
  SeniorityAnalysis,
  Top20Requirement,
} from '../types/ats.types';

const MAX_JOB_CHARS = 15000;
const MAX_RESUME_CHARS = 20000;

type RequirementKind =
  | 'tech'
  | 'skill'
  | 'area'
  | 'deliverable'
  | 'language'
  | 'certification'
  | 'education'
  | 'soft';

interface LexiconEntry {
  key: string;
  label: string;
  aliases: string[];
  kind: RequirementKind;
}

interface RequirementSpec extends LexiconEntry {
  importance: RequirementImportance;
  position: number;
  qualifier?: string;
  minYears?: number;
  fromTitle?: boolean;
}

interface ResumeSignals {
  raw: string;
  segments: string[];
  years: number;
}

interface EvaluatedRequirement extends RequirementSpec {
  status: MatchStatus;
  value: number;
  evidence: string;
  contextual: boolean;
}

const WEIGHTS: Record<RequirementImportance, number> = {
  Inegociável: 3,
  Importante: 2,
  Diferencial: 0.5,
  'Baixa Prioridade': 0.25,
};

const IMPORTANCE_ORDER: Record<RequirementImportance, number> = {
  Inegociável: 0,
  Importante: 1,
  Diferencial: 2,
  'Baixa Prioridade': 3,
};

// ---------------------------------------------------------------------------
// Normalizacao
// ---------------------------------------------------------------------------

const stripAccents = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const lower = (value: string): string => stripAccents(value).toLowerCase();

/** Texto pronto para comparar termos: minusculo, sem acento e sem pontuacao. */
const matchable = (value: string): string =>
  lower(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const containsAlias = (haystackMatchable: string, alias: string): boolean => {
  const needle = matchable(alias);
  if (!needle) return false;
  return ` ${haystackMatchable} `.includes(` ${needle} `);
};

const countAlias = (haystackMatchable: string, alias: string): number => {
  const needle = matchable(alias);
  if (!needle) return 0;
  const padded = ` ${haystackMatchable} `;
  const pattern = ` ${needle} `;
  let count = 0;
  let index = 0;
  while (true) {
    const found = padded.indexOf(pattern, index);
    if (found === -1) break;
    count += 1;
    index = found + pattern.length - 1;
  }
  return count;
};

/** Mesma semantica da checagem literal usada pelos consumidores da API. */
const literalPresent = (text: string, term: string): boolean => {
  const haystack = lower(text);
  const needle = lower(term);
  if (!needle) return false;
  if (/[^a-z0-9 ]/.test(needle) || needle.includes(' ')) {
    return haystack.includes(needle);
  }
  return new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`).test(haystack);
};

// ---------------------------------------------------------------------------
// Vocabulario: apenas termos que podem ser rastreados na vaga ou no curriculo.
// ---------------------------------------------------------------------------

const LEXICON: LexiconEntry[] = [
  { key: 'sql', label: 'SQL', aliases: ['sql'], kind: 'tech' },
  { key: 'python', label: 'Python', aliases: ['python'], kind: 'tech' },
  { key: 'power bi', label: 'Power BI', aliases: ['power bi', 'powerbi'], kind: 'tech' },
  { key: 'excel', label: 'Excel', aliases: ['excel'], kind: 'tech' },
  { key: 'tableau', label: 'Tableau', aliases: ['tableau'], kind: 'tech' },
  { key: 'looker', label: 'Looker', aliases: ['looker'], kind: 'tech' },
  { key: 'aws', label: 'AWS', aliases: ['aws', 'amazon web services'], kind: 'tech' },
  { key: 'azure', label: 'Azure', aliases: ['azure'], kind: 'tech' },
  { key: 'gcp', label: 'GCP', aliases: ['gcp', 'google cloud'], kind: 'tech' },
  { key: 'cloud', label: 'Cloud', aliases: ['cloud', 'nuvem'], kind: 'tech' },
  { key: 'docker', label: 'Docker', aliases: ['docker'], kind: 'tech' },
  { key: 'kubernetes', label: 'Kubernetes', aliases: ['kubernetes', 'k8s'], kind: 'tech' },
  { key: 'openshift', label: 'OpenShift', aliases: ['openshift'], kind: 'tech' },
  { key: 'terraform', label: 'Terraform', aliases: ['terraform'], kind: 'tech' },
  { key: 'ansible', label: 'Ansible', aliases: ['ansible'], kind: 'tech' },
  { key: 'jenkins', label: 'Jenkins', aliases: ['jenkins'], kind: 'tech' },
  { key: 'gitlab', label: 'GitLab', aliases: ['gitlab'], kind: 'tech' },
  { key: 'github actions', label: 'GitHub Actions', aliases: ['github actions'], kind: 'tech' },
  { key: 'ci/cd', label: 'CI/CD', aliases: ['ci cd', 'cicd', 'ci/cd'], kind: 'tech' },
  { key: 'java', label: 'Java', aliases: ['java'], kind: 'tech' },
  { key: 'javascript', label: 'JavaScript', aliases: ['javascript'], kind: 'tech' },
  { key: 'typescript', label: 'TypeScript', aliases: ['typescript'], kind: 'tech' },
  { key: 'tailwind', label: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css'], kind: 'tech' },
  { key: 'angular', label: 'Angular', aliases: ['angular'], kind: 'tech' },
  { key: 'react', label: 'React', aliases: ['react'], kind: 'tech' },
  { key: 'vue', label: 'Vue', aliases: ['vue', 'vuejs'], kind: 'tech' },
  { key: 'node.js', label: 'Node.js', aliases: ['node js', 'nodejs'], kind: 'tech' },
  { key: 'django', label: 'Django', aliases: ['django'], kind: 'tech' },
  { key: 'fastapi', label: 'FastAPI', aliases: ['fastapi'], kind: 'tech' },
  { key: 'flask', label: 'Flask', aliases: ['flask'], kind: 'tech' },
  { key: 'spring', label: 'Spring', aliases: ['spring boot', 'spring'], kind: 'tech' },
  { key: 'php', label: 'PHP', aliases: ['php'], kind: 'tech' },
  { key: 'ruby', label: 'Ruby', aliases: ['ruby'], kind: 'tech' },
  { key: 'postgresql', label: 'PostgreSQL', aliases: ['postgresql', 'postgres'], kind: 'tech' },
  { key: 'mysql', label: 'MySQL', aliases: ['mysql'], kind: 'tech' },
  { key: 'oracle', label: 'Oracle', aliases: ['oracle'], kind: 'tech' },
  { key: 'mongodb', label: 'MongoDB', aliases: ['mongodb', 'mongo'], kind: 'tech' },
  { key: 'redis', label: 'Redis', aliases: ['redis'], kind: 'tech' },
  { key: 'kafka', label: 'Kafka', aliases: ['kafka'], kind: 'tech' },
  { key: 'rabbitmq', label: 'RabbitMQ', aliases: ['rabbitmq'], kind: 'tech' },
  { key: 'spark', label: 'Spark', aliases: ['spark'], kind: 'tech' },
  { key: 'airflow', label: 'Airflow', aliases: ['airflow'], kind: 'tech' },
  { key: 'databricks', label: 'Databricks', aliases: ['databricks'], kind: 'tech' },
  { key: 'snowflake', label: 'Snowflake', aliases: ['snowflake'], kind: 'tech' },
  { key: 'bigquery', label: 'BigQuery', aliases: ['bigquery'], kind: 'tech' },
  { key: 'nlp', label: 'NLP', aliases: ['nlp', 'processamento de linguagem natural'], kind: 'tech' },
  { key: 'llm', label: 'LLM', aliases: ['llm', 'large language model'], kind: 'tech' },
  { key: 'machine learning', label: 'Machine learning', aliases: ['machine learning', 'aprendizado de maquina'], kind: 'tech' },
  { key: 'ia', label: 'IA', aliases: ['ia', 'inteligencia artificial'], kind: 'tech' },
  { key: 'salesforce', label: 'Salesforce', aliases: ['salesforce'], kind: 'tech' },
  { key: 'hubspot', label: 'HubSpot', aliases: ['hubspot'], kind: 'tech' },
  { key: 'sap', label: 'SAP', aliases: ['sap'], kind: 'tech' },
  { key: 'erp', label: 'ERP', aliases: ['erp'], kind: 'tech' },
  { key: 'crm', label: 'CRM', aliases: ['crm'], kind: 'skill' },
  { key: 'vba', label: 'VBA', aliases: ['vba'], kind: 'tech' },
  { key: 'scala', label: 'Scala', aliases: ['scala'], kind: 'tech' },
  { key: 'matlab', label: 'MATLAB', aliases: ['matlab'], kind: 'tech' },
  { key: 'spss', label: 'SPSS', aliases: ['spss'], kind: 'tech' },

  { key: 'análise de dados', label: 'Análise de dados', aliases: ['analise de dados', 'analises de dados', 'analista de dados', 'analisei dados', 'analisar dados', 'trabalhei com dados'], kind: 'area' },
  { key: 'financeiro', label: 'Financeiro', aliases: ['analista financeiro', 'financeiro', 'financeira'], kind: 'area' },
  { key: 'análise de despesas', label: 'Análise de despesas', aliases: ['analise de despesas', 'analises de despesas', 'analise de gastos'], kind: 'deliverable' },
  { key: 'redução de custos', label: 'Redução de custos', aliases: ['reducao de custos', 'reduzir custos', 'reducao de despesas'], kind: 'deliverable' },
  { key: 'relatórios', label: 'Relatórios', aliases: ['relatorio', 'relatorios'], kind: 'deliverable' },
  { key: 'dashboards', label: 'Dashboards', aliases: ['dashboard', 'dashboards'], kind: 'deliverable' },
  { key: 'indicadores', label: 'Indicadores', aliases: ['indicador', 'indicadores', 'kpi', 'kpis'], kind: 'deliverable' },
  { key: 'automação', label: 'Automação', aliases: ['automacao', 'automatizar', 'automatizei', 'automatizado'], kind: 'deliverable' },
  { key: 'consultas', label: 'Consultas', aliases: ['consulta', 'consultas', 'query', 'queries'], kind: 'deliverable' },
  { key: 'migração de dados', label: 'Migração de dados', aliases: ['migracao de dados', 'migracao', 'migrei', 'migrar dados'], kind: 'deliverable' },
  { key: 'modelagem de dados', label: 'Modelagem de dados', aliases: ['modelagem de dados'], kind: 'deliverable' },
  { key: 'modelagem dimensional', label: 'Modelagem dimensional', aliases: ['modelagem dimensional'], kind: 'deliverable' },
  { key: 'pipelines', label: 'Pipelines', aliases: ['pipeline', 'pipelines'], kind: 'deliverable' },
  { key: 'orquestração', label: 'Orquestração', aliases: ['orquestracao'], kind: 'deliverable' },
  { key: 'microsserviços', label: 'Microsserviços', aliases: ['microsservicos', 'microservices'], kind: 'deliverable' },
  { key: 'testes automatizados', label: 'Testes automatizados', aliases: ['testes automatizados', 'testes unitarios', 'test automation'], kind: 'deliverable' },
  { key: 'rest', label: 'REST', aliases: ['rest', 'restful'], kind: 'tech' },
  { key: 'graphql', label: 'GraphQL', aliases: ['graphql'], kind: 'tech' },
  { key: 'git', label: 'Git', aliases: ['git'], kind: 'tech' },
  { key: 'scrum', label: 'Scrum', aliases: ['scrum'], kind: 'skill' },
  { key: 'kanban', label: 'Kanban', aliases: ['kanban'], kind: 'skill' },
  { key: 'gestão de projetos', label: 'Gestão de projetos', aliases: ['gestao de projetos', 'gerenciamento de projetos', 'administracao de projetos', 'entregas de projeto'], kind: 'skill' },
  { key: 'gestão de cronogramas', label: 'Gestão de cronogramas', aliases: ['gestao de cronogramas', 'cronograma', 'cronogramas'], kind: 'skill' },
  { key: 'gestão de prazos', label: 'Gestão de prazos', aliases: ['gestao de prazos', 'acompanhamento de prazos', 'prazos'], kind: 'skill' },
  { key: 'gestão de pessoas', label: 'Gestão de pessoas', aliases: ['gestao de pessoas', 'gestao de equipe', 'gestao de equipes'], kind: 'skill' },
  { key: 'liderança de equipes', label: 'Liderança de equipes', aliases: ['lideranca de equipes', 'lideranca', 'lider de equipe', 'liderar equipes'], kind: 'skill' },
  { key: 'coordenação de equipes', label: 'Coordenação de equipes', aliases: ['coordenacao de equipes', 'coordenacao de times', 'coordenar equipes'], kind: 'skill' },
  { key: 'coordenação de projetos', label: 'Coordenação de projetos', aliases: ['coordenacao de projetos', 'coordenar projetos'], kind: 'skill' },
  { key: 'análise de projetos', label: 'Análise de projetos', aliases: ['analise de projetos', 'analisar projetos'], kind: 'area' },
  { key: 'engenharia de dados', label: 'Engenharia de dados', aliases: ['engenharia de dados', 'engenheiro de dados'], kind: 'area' },
  { key: 'ciência de dados', label: 'Ciência de dados', aliases: ['ciencia de dados', 'cientista de dados'], kind: 'area' },
  { key: 'engenharia de software', label: 'Engenharia de software', aliases: ['engenharia de software', 'engenheiro de software', 'desenvolvedor de software'], kind: 'area' },
  { key: 'arquitetura de soluções', label: 'Arquitetura de soluções', aliases: ['arquitetura de solucoes', 'arquiteto de solucoes'], kind: 'area' },
  { key: 'devops', label: 'DevOps', aliases: ['devops'], kind: 'area' },
  { key: 'bi', label: 'BI', aliases: ['analista de bi'], kind: 'area' },
  { key: 'ferramentas de análise', label: 'Ferramentas de análise', aliases: ['ferramentas'], kind: 'skill' },
  { key: 'resultados mensuráveis', label: 'Resultados mensuráveis', aliases: ['resultados mensuraveis', 'resultado mensuravel', 'metricas'], kind: 'skill' },
  { key: 'apoio à decisão', label: 'Apoio à decisão', aliases: ['apoio a decisao', 'tomada de decisao'], kind: 'skill' },
  { key: 'experiência em produção', label: 'Experiência em produção', aliases: ['producao', 'ambientes de producao'], kind: 'skill' },
  { key: 'experiência recente', label: 'Experiência recente', aliases: ['experiencia recente', 'recente'], kind: 'skill' },
  { key: 'experiência comprovada', label: 'Experiência comprovada', aliases: ['experiencia comprovada', 'anos de experiencia'], kind: 'skill' },
  { key: 'grande porte', label: 'Grande porte', aliases: ['grande porte'], kind: 'skill' },
  { key: 'formação acadêmica', label: 'Formação acadêmica', aliases: ['formacao', 'graduacao'], kind: 'education' },
  { key: 'pmp', label: 'PMP', aliases: ['pmp'], kind: 'certification' },
  { key: 'inglês', label: 'Inglês', aliases: ['ingles'], kind: 'language' },
  { key: 'espanhol', label: 'Espanhol', aliases: ['espanhol'], kind: 'language' },
  { key: 'times internacionais', label: 'Atuação com times internacionais', aliases: ['times internacionais', 'reunioes internacionais'], kind: 'skill' },
  { key: 'perfil proativo', label: 'Perfil proativo', aliases: ['proativo', 'proativa', 'proatividade'], kind: 'soft' },
  { key: 'comunicação', label: 'Comunicação', aliases: ['comunicacao'], kind: 'soft' },
  { key: 'atendimento ao cliente', label: 'Atendimento ao cliente', aliases: ['atendimento ao cliente', 'atendimento a clientes'], kind: 'soft' },
  { key: 'vendas', label: 'Vendas', aliases: ['vendas', 'venda'], kind: 'skill' },
  { key: 'suporte técnico', label: 'Suporte técnico', aliases: ['suporte tecnico'], kind: 'skill' },
];

const LEXICON_BY_KEY = new Map(LEXICON.map((entry) => [entry.key, entry]));

const FILLER_KEYS = {
  analiseDados: 'análise de dados',
  relatorios: 'relatórios',
  indicadores: 'indicadores',
  automacao: 'automação',
  formacao: 'formação acadêmica',
  ingles: 'inglês',
  experiencia: 'experiência comprovada',
  times: 'times internacionais',
  proativo: 'perfil proativo',
  comunicacao: 'comunicação',
  engenhariaDados: 'engenharia de dados',
  cienciaDados: 'ciência de dados',
  engenhariaSoftware: 'engenharia de software',
  gestaoProjetos: 'gestão de projetos',
  coordenacaoProjetos: 'coordenação de projetos',
  analiseProjetos: 'análise de projetos',
  financeiro: 'financeiro',
  bi: 'bi',
  devops: 'devops',
  cloud: 'cloud',
  ia: 'ia',
} as const;

const ROLE_FILLERS: { test: RegExp; key: string }[] = [
  { test: /engenheir[oa] de dados/, key: FILLER_KEYS.engenhariaDados },
  { test: /cientista de dados/, key: FILLER_KEYS.cienciaDados },
  { test: /engenheir[oa] de software|desenvolvedor/, key: FILLER_KEYS.engenhariaSoftware },
  { test: /gerente de projetos/, key: FILLER_KEYS.gestaoProjetos },
  { test: /coordenador de projetos/, key: FILLER_KEYS.coordenacaoProjetos },
  { test: /analista de projetos/, key: FILLER_KEYS.analiseProjetos },
  { test: /analista financeiro/, key: FILLER_KEYS.financeiro },
  { test: /analista de bi/, key: FILLER_KEYS.bi },
  { test: /engenheiro devops|devops/, key: FILLER_KEYS.devops },
  { test: /engenheiro de cloud/, key: FILLER_KEYS.cloud },
  { test: /especialista em ia/, key: FILLER_KEYS.ia },
  { test: /analista de dados/, key: FILLER_KEYS.analiseDados },
];

const GENERIC_FILLERS: { test: RegExp; key: string }[] = [
  { test: /relatorios?/, key: FILLER_KEYS.relatorios },
  { test: /indicadores?/, key: FILLER_KEYS.indicadores },
  { test: /automacao|automatizar/, key: FILLER_KEYS.automacao },
  { test: /formacao/, key: FILLER_KEYS.formacao },
  { test: /ingles/, key: FILLER_KEYS.ingles },
  { test: /experiencia/, key: FILLER_KEYS.experiencia },
  { test: /dados/, key: FILLER_KEYS.analiseDados },
  { test: /times internacionais|reunioes internacionais/, key: FILLER_KEYS.times },
  { test: /proativo|proatividade/, key: FILLER_KEYS.proativo },
  { test: /comunicacao/, key: FILLER_KEYS.comunicacao },
];

// Termos que so entram como preenchimento, nunca como requisito fixo.
const FILLER_ONLY: LexiconEntry[] = [
  { key: 'projetos', label: 'Projetos', aliases: ['projetos', 'projeto'], kind: 'deliverable' },
  { key: 'trabalho com dados', label: 'Trabalho com dados', aliases: ['trabalhei com dados', 'trabalho com dados', 'atuacao com dados'], kind: 'skill' },
  { key: 'nível avançado', label: 'Nível avançado', aliases: ['avancado', 'avancada'], kind: 'skill' },
];

const FILLER_ONLY_BY_KEY = new Map(FILLER_ONLY.map((entry) => [entry.key, entry]));

// ---------------------------------------------------------------------------
// Leitura da vaga
// ---------------------------------------------------------------------------

interface JobClause {
  text: string;
  desired: boolean;
  index: number;
}

const desiredMarker = /(desej[aá]ve(?:l|is)|diferencia(?:l|is)|nice to have|opcional|plus)/i;
const sentenceSplit = /(?<=[.!?;])\s+|\n+/;

function splitJob(rawJob: string): JobClause[] {
  const clauses: JobClause[] = [];
  let rest = rawJob;
  let desired = false;
  let index = 0;

  while (rest.length > 0) {
    const marker = desiredMarker.exec(rest);
    const head = marker ? rest.slice(0, marker.index) : rest;
    const tail = marker ? rest.slice(marker.index + marker[0].length) : '';

    for (const piece of head.split(sentenceSplit)) {
      const text = piece.trim();
      if (!text) continue;
      clauses.push({ text, desired, index });
      index += 1;
    }

    if (!marker) break;
    desired = true;
    rest = tail;
  }

  return clauses;
}

function clauseImportance(clause: JobClause): RequirementImportance {
  if (clause.desired) return 'Diferencial';
  const text = lower(clause.text);
  if (/obrigat|inegociavel|imprescindivel|eliminatori|exige|requisito/.test(text)) {
    return 'Inegociável';
  }
  return 'Importante';
}

function clauseQualifier(text: string): string | undefined {
  return /avancad|senior|solido|profund|dominio/.test(lower(text)) ? 'avancado' : undefined;
}

function clauseMinYears(text: string): number | undefined {
  const match = /(\d+)\s*anos?/.exec(lower(text));
  return match ? Number(match[1]) : undefined;
}

function isTitleClause(text: string): boolean {
  const normalized = matchable(text);
  return /\bvaga para\b|\bprocuramos\b|^vaga\b|^posicao\b|^role\b|^empresa\b/.test(normalized);
}

function extractJobRequirements(rawJob: string): RequirementSpec[] {
  const clauses = splitJob(rawJob);
  const found = new Map<string, RequirementSpec>();
  let explicitRequirements = 0;

  for (const entry of LEXICON) {
    const matches = clauses.filter((candidate) =>
      entry.aliases.some((alias) => containsAlias(matchable(candidate.text), alias)),
    );
    if (matches.length === 0) continue;

    const explicit = matches.find((candidate) => !isTitleClause(candidate.text));
    const clause = explicit ?? matches[0];
    if (explicit) explicitRequirements += 1;

    found.set(entry.key, {
      ...entry,
      importance: clauseImportance(clause),
      position: clause.index,
      qualifier: clauseQualifier(clause.text),
      minYears: clauseMinYears(clause.text),
      fromTitle: !explicit,
    });
  }

  // Requisitos derivados apenas do titulo do cargo nao contam como TOP 20
  // quando a vaga ja lista tres ou mais requisitos explicitos.
  if (explicitRequirements >= 3) {
    for (const [key, spec] of found) {
      if (spec.fromTitle && spec.kind === 'area') found.delete(key);
    }
  }

  const addFiller = (entry: LexiconEntry | undefined): void => {
    if (!entry || found.has(entry.key)) return;
    found.set(entry.key, { ...entry, importance: 'Importante', position: 900 + found.size });
  };

  const jobMatchable = matchable(rawJob);

  for (const filler of ROLE_FILLERS) {
    if (found.size >= 3) break;
    if (filler.test.test(jobMatchable)) addFiller(LEXICON_BY_KEY.get(filler.key));
  }

  for (const filler of GENERIC_FILLERS) {
    if (found.size >= 3) break;
    if (filler.test.test(jobMatchable)) addFiller(LEXICON_BY_KEY.get(filler.key));
  }

  if (found.size < 3 && /projetos?/.test(jobMatchable)) {
    addFiller(FILLER_ONLY_BY_KEY.get('projetos'));
  }
  if (found.size < 3 && /dados/.test(jobMatchable)) {
    addFiller(FILLER_ONLY_BY_KEY.get('trabalho com dados'));
  }
  if (found.size < 3 && /avancad/.test(jobMatchable)) {
    addFiller(FILLER_ONLY_BY_KEY.get('nível avançado'));
  }

  return [...found.values()]
    .sort((a, b) =>
      IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance] || a.position - b.position,
    )
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Leitura do curriculo
// ---------------------------------------------------------------------------

const ACTION_VERBS = [
  'usei', 'utilizei', 'criei', 'construi', 'desenvolvi', 'configurei', 'implementei',
  'analisei', 'participei', 'atuei', 'trabalhei', 'realizei', 'ajudei', 'mantive',
  'otimizei', 'integrei', 'estruturei', 'consolidei', 'entreguei', 'reduzi', 'aumentei',
  'automatizei', 'liderei', 'coordenei', 'gerenciei', 'organizei', 'acompanhei',
  'modelei', 'montei', 'implantei', 'migrei', 'revisei', 'validei', 'documentei',
  'suportei', 'administrei', 'preparei', 'conduzi', 'apoiei', 'planejei',
];

const EXPERIENCE_MARKERS = [
  'experiencia comprovada', 'experiencia profissional', 'experiencia em', 'experiencia com',
  'atuo como', 'atuando como', 'atuando com', 'atuacao em', 'atuacao com',
  'trabalho com', 'trabalhei com', 'conhecimento em', 'conhecimentos em',
];

const NEGATION_VERBS = new Set([
  'utilizei', 'usei', 'trabalhei', 'atuei', 'tive', 'tenho', 'possuo', 'conheco',
  'domino', 'estudei', 'pratiquei', 'desenvolvi',
]);
const NEGATION_NOUNS = new Set([
  'experiencia', 'conhecimento', 'pratica', 'contato', 'atuacao', 'uso',
]);
const STUDY_RE = /\b(curso|estudo|estudos|estudando|conclui|formacao|graduacao|faculdade|academico|certificacao)\b/;
const RECENCY_RE = /\bha \d+ anos\b|\bdesde entao\b|\bdesatualizad/;

interface OccurrenceStates {
  positive: boolean;
  negative: boolean;
}

function isNegatedAt(words: string[], index: number): boolean {
  for (let cursor = Math.max(0, index - 5); cursor < index; cursor += 1) {
    const word = words[cursor];
    if (word === 'nem') return true;
    if ((word === 'nao' || word === 'nunca') && cursor + 1 < index && NEGATION_VERBS.has(words[cursor + 1])) {
      return true;
    }
    if (word === 'sem') {
      if (cursor === index - 1) return true;
      if (cursor + 1 < index && NEGATION_NOUNS.has(words[cursor + 1])) return true;
    }
  }
  return false;
}

/**
 * Verifica cada ocorrencia do termo dentro da frase. Uma negacao explicita
 * ("nao utilizei X", "sem experiencia com X") nunca conta como evidencia.
 */
function occurrenceStates(segment: string, alias: string): OccurrenceStates {
  const words = matchable(segment).split(' ');
  const needle = matchable(alias).split(' ');
  const states: OccurrenceStates = { positive: false, negative: false };
  if (needle.length === 0 || needle[0] === '') return states;

  for (let index = 0; index <= words.length - needle.length; index += 1) {
    let matches = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (words[index + offset] !== needle[offset]) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;
    if (isNegatedAt(words, index)) states.negative = true;
    else states.positive = true;
  }

  return states;
}

function isListSegment(segment: string): boolean {
  const text = matchable(segment);
  if (!text) return true;
  const words = text.split(' ');
  const hasAction = ACTION_VERBS.some((verb) => containsAlias(text, verb));
  if (/^(habilidades|competencias|conhecimentos|skills|tecnologias|ferramentas|stack|linguagens|certificacoes|idiomas)\b/.test(text) && !hasAction) {
    return true;
  }
  if (words.length <= 3 && !hasAction) return true;
  const separators = (segment.match(/[,;]/g) ?? []).length;
  return separators >= 3 && words.length >= 6 && !hasAction;
}

function isContextual(segment: string): boolean {
  const text = matchable(segment);
  if (!text) return false;
  if (ACTION_VERBS.some((verb) => containsAlias(text, verb))) return true;
  return EXPERIENCE_MARKERS.some((marker) => text.includes(marker));
}

function isTitleOnly(segment: string): boolean {
  const text = matchable(segment);
  if (!text) return false;
  const words = text.split(' ');
  if (words.length > 8) return false;
  if (ACTION_VERBS.some((verb) => containsAlias(text, verb))) return false;
  return /^(especialista|senior|sr|lead|gerente|coordenador|desenvolvedor|analista|engenheiro|arquiteto|consultor)\b/.test(text);
}

function resumeSegments(rawResume: string): string[] {
  return rawResume
    .split(/\n+|(?<=[.!?;])\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function resumeYears(rawResume: string): number {
  const matches = [...lower(rawResume).matchAll(/(\d+)\s*anos?/g)];
  return matches.reduce((max, match) => Math.max(max, Number(match[1])), 0);
}

function cleanEvidence(segment: string): string {
  const cleaned = segment
    .replace(/^[-•*\s]+/, '')
    .replace(/^(experiencia|habilidades|competencias|conhecimentos|resumo|skills)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 240) return cleaned;
  return `${cleaned.slice(0, 240).replace(/\s+\S*$/, '')}.`;
}

function evaluateRequirement(spec: RequirementSpec, resume: ResumeSignals): EvaluatedRequirement {
  let contextual: string | null = null;
  let weak: string | null = null;
  let study: string | null = null;
  let listOnly = false;
  let titleOnly = false;
  let negated = false;
  let recency = false;
  let contradiction = false;

  for (const segment of resume.segments) {
    let positiveOccurrence = false;
    let negativeOccurrence = false;
    for (const alias of spec.aliases) {
      const states = occurrenceStates(segment, alias);
      if (states.positive) positiveOccurrence = true;
      if (states.negative) negativeOccurrence = true;
    }
    if (!positiveOccurrence && !negativeOccurrence) continue;

    if (negativeOccurrence) negated = true;
    if (!positiveOccurrence) continue;

    const normalized = lower(segment);
    if (RECENCY_RE.test(normalized)) recency = true;
    if (STUDY_RE.test(normalized)) study = study ?? segment;

    if (isContextual(segment)) {
      contextual = contextual ?? segment;
      if (spec.qualifier && /\b(basico|basica|basicos|iniciante|intermediario|pouco)\b/.test(normalized)) {
        contradiction = true;
      }
    } else if (isTitleOnly(segment)) {
      titleOnly = true;
    } else if (isListSegment(segment)) {
      listOnly = true;
    } else {
      weak = weak ?? segment;
    }
  }

  const yearsBelow = Boolean(spec.minYears && spec.minYears > 0 && resume.years < spec.minYears);
  let status: MatchStatus;
  let value: number;

  if (negated && !contextual) {
    status = 'NAO_ATENDE';
    value = 0;
  } else if (negated && contextual) {
    status = 'PARCIAL';
    value = 0.5;
  } else if (contextual) {
    const downgraded = recency || yearsBelow || contradiction;
    status = downgraded ? 'PARCIAL' : 'ATENDE';
    value = downgraded ? 0.5 : 1;
  } else if (study || listOnly || titleOnly || weak) {
    status = 'PARCIAL';
    value = 0.5;
  } else {
    status = 'NAO_ATENDE';
    value = 0;
  }

  const evidenceSource = contextual ?? study ?? weak;
  return {
    ...spec,
    status,
    value,
    evidence: status === 'NAO_ATENDE' ? '' : cleanEvidence(evidenceSource ?? ''),
    contextual: Boolean(contextual),
  };
}

// ---------------------------------------------------------------------------
// Deteccoes de risco (linguagem, stuffing, copia, formatacao)
// ---------------------------------------------------------------------------

const BUZZ_PATTERNS: { label: string; test: RegExp }[] = [
  { label: 'orquestrou', test: /\borquestrou\b/ },
  { label: 'alavancou', test: /\balavancou\b/ },
  { label: 'alavancando', test: /\balavancando\b/ },
  { label: 'revolucionou', test: /\brevolucionou\b/ },
  { label: 'sinergia', test: /\bsinergi/ },
  { label: 'transformacional', test: /\btransformacional\b/ },
  { label: 'result-driven', test: /\bresult driven\b/ },
  { label: 'go-getter', test: /\bgo getter\b/ },
  { label: 'hands-on', test: /\bhands on\b/ },
  { label: 'soluções end-to-end', test: /\bsolucoes end to end\b/ },
  { label: 'perfil analítico', test: /\bperfil analitico\b/ },
];

const HOLLOW_PATTERNS: { label: string; test: RegExp }[] = [
  { label: 'apaixonado por', test: /\bapaixonad[oa] por\b/ },
  { label: 'altamente qualificado', test: /\baltamente qualificad[oa]\b/ },
  { label: 'visão 360', test: /\bvisao 360\b/ },
  { label: 'holística', test: /\bholistic[oa]\b/ },
  { label: 'dinâmico e proativo', test: /\bdinamic[oa] e proativ[oa]\b/ },
  { label: 'profissional dinâmico', test: /\bprofissional dinamic[oa]\b/ },
  { label: 'orientado a resultados', test: /\borientad[oa] a resultados\b/ },
];

const PASSIVE_PATTERNS: { label: string; test: RegExp }[] = [
  { label: 'foi desenvolvido', test: /\bfoi desenvolvida?\b/ },
  { label: 'foram criados', test: /\bforam criadas?\b/ },
  { label: 'foi implementado', test: /\bfoi implementada?\b/ },
  { label: 'visando a melhoria', test: /\bvisando a melhoria\b/ },
  { label: 'responsável por', test: /\bresponsavel por\b/ },
  { label: 'atuou com o intuito', test: /\batuou com o intuito\b/ },
  { label: 'de forma a garantir', test: /\bde forma a garantir\b/ },
  { label: 'sob a égide', test: /\bsob a egide\b/ },
];

const TRANSITION_PATTERNS: { label: string; test: RegExp }[] = [
  { label: 'além disso', test: /\balem disso\b/ },
  { label: 'nesse sentido', test: /\bnesse sentido\b/ },
  { label: 'com vistas a', test: /\bcom vistas a\b/ },
  { label: 'sob a égide', test: /\bsob a egide\b/ },
];

const VAGUE_PATTERNS: { label: string; test: RegExp }[] = [
  { label: 'diversas atividades', test: /\bdiversas atividades\b/ },
  { label: 'atividades variadas', test: /\batividades variadas\b/ },
  { label: 'várias atividades', test: /\bvárias atividades\b|\bvarias atividades\b/ },
  { label: 'funções diversas', test: /\bfuncoes diversas\b/ },
];

interface DetectedRisk {
  text: string;
}

interface RiskReport {
  risks: DetectedRisk[];
  stuffing: boolean;
  copied: boolean;
  manipulation: boolean;
  formatting: boolean;
  recency: boolean;
  inflation: boolean;
  punctuation: boolean;
  longSentence: boolean;
  vague: boolean;
  buzz: string[];
  hollow: string[];
  passive: string[];
  transitions: string[];
}

function detectRisks(rawResume: string, rawJob: string, requirements: EvaluatedRequirement[]): RiskReport {
  const normalized = lower(rawResume);
  const segments = resumeSegments(rawResume);
  const risks: DetectedRisk[] = [];

  const buzz = BUZZ_PATTERNS.filter((pattern) => pattern.test.test(normalized)).map((pattern) => pattern.label);
  const hollow = HOLLOW_PATTERNS.filter((pattern) => pattern.test.test(normalized)).map((pattern) => pattern.label);
  const passive = PASSIVE_PATTERNS.filter((pattern) => pattern.test.test(normalized)).map((pattern) => pattern.label);
  const transitions = TRANSITION_PATTERNS.filter((pattern) => pattern.test.test(normalized)).map((pattern) => pattern.label);
  const vagueMatches = VAGUE_PATTERNS.filter((pattern) => pattern.test.test(normalized)).map((pattern) => pattern.label);

  const punctuation = /[\u2014\u2013]/.test(rawResume);
  if (punctuation) {
    risks.push({ text: 'Travessão usado como pontuação: troque por vírgula ou ponto final.' });
  }

  const longSentence = segments.some((segment) => {
    const words = matchable(segment).split(' ').filter(Boolean).length;
    const separators = (segment.match(/[,;]/g) ?? []).length;
    return words >= 30 || (words >= 18 && separators >= 2);
  });
  if (longSentence) {
    risks.push({ text: 'Frase longa: período com muitas orações em sequência; quebre a frase em itens objetivos.' });
  }

  const manipulation = /texto branco|fonte (tamanho|oculta)|termos escondidos|fora do corpo visivel|white text|hidden text/.test(normalized);
  if (manipulation) {
    risks.push({ text: 'Texto branco ou fonte oculta detectado: conteúdo invisível é lido como manipulação.' });
  }

  const formatting = /duas colunas|multicoluna|colunas|imagens|graficos|layout|tabelas/.test(normalized);
  if (formatting) {
    risks.push({ text: 'Risco de formatação e parsing: colunas, imagens ou texto dentro de gráficos podem ser lidos fora de ordem.' });
  }

  const recency = RECENCY_RE.test(normalized);
  if (recency) {
    risks.push({ text: 'Experiência desatualizada: o uso foi citado há muitos anos e a vaga pede prática atual.' });
  }

  const inflation = /especialista em|dominio avancado|especialista altamente/.test(normalized);
  if (inflation) {
    risks.push({ text: 'Inflação de título: autodeclaração de especialidade sem entrega comprovada no texto.' });
  }

  if (vagueMatches.length > 0) {
    risks.push({ text: `Vagueza: expressões como ${vagueMatches.join(', ')} não descrevem entrega concreta.` });
  }

  if (buzz.length > 0) {
    risks.push({ text: `Jargão inflado: ${buzz.join(', ')}. Troque por verbos concretos.` });
  }
  if (passive.length > 0) {
    risks.push({ text: `Construção passiva ou sem autoria: ${passive.join(', ')}.` });
  }
  if (hollow.length > 0) {
    risks.push({ text: `Adjetivação vazia: ${hollow.join(', ')}.` });
  }
  if (transitions.length > 0) {
    risks.push({ text: `Conectivo artificial: ${transitions.join(', ')}.` });
  }

  // Keyword stuffing: repeticao de termo, frase repetida ou lista sem uso.
  const resumeMatch = matchable(rawResume);
  const repeatedTerm = LEXICON.some((entry) => entry.aliases.some((alias) => countAlias(resumeMatch, alias) >= 5));

  const wordList = resumeMatch.split(' ').filter(Boolean);
  const phraseCounts = new Map<string, number>();
  for (let i = 0; i + 2 < wordList.length; i += 1) {
    const phrase = `${wordList[i]} ${wordList[i + 1]} ${wordList[i + 2]}`;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
  }
  const repeatedPhrase = [...phraseCounts.values()].some((count) => count >= 3);

  const listOnlyTerms = LEXICON.filter((entry) => {
    const occurrences = segments.filter((segment) =>
      entry.aliases.some((alias) => containsAlias(matchable(segment), alias)),
    );
    return occurrences.length > 0 && occurrences.every((segment) => isListSegment(segment));
  }).length;
  const listCluster = listOnlyTerms >= 5;

  const stuffing = repeatedTerm || repeatedPhrase || listCluster;
  if (stuffing) {
    risks.push({ text: 'Keyword stuffing: repetição excessiva de termos ou lista de tecnologias sem uso comprovado.' });
  }

  // Copia literal da vaga: frase do curriculo com alta sobreposicao de palavras.
  const jobSentences = rawJob.split(sentenceSplit).map((sentence) => matchable(sentence)).filter(Boolean);
  const copied = segments.some((segment) => {
    const segmentWords = matchable(segment).split(' ').filter((word) => word.length >= 3);
    if (segmentWords.length < 6) return false;
    return jobSentences.some((jobSentence) => {
      const jobWords = new Set(jobSentence.split(' ').filter((word) => word.length >= 3));
      if (jobWords.size === 0) return false;
      const overlap = segmentWords.filter((word) => jobWords.has(word)).length;
      return overlap / segmentWords.length >= 0.8;
    });
  });
  if (copied) {
    risks.push({ text: 'Cópia literal da vaga: trechos idênticos à descrição reduzem a credibilidade.' });
  }

  for (const requirement of requirements) {
    if (requirement.status === 'NAO_ATENDE') {
      risks.push({ text: `${requirement.label} sem evidência no currículo.` });
    }
  }

  return {
    risks,
    stuffing,
    copied,
    manipulation,
    formatting,
    recency,
    inflation,
    punctuation,
    longSentence,
    vague: vagueMatches.length > 0,
    buzz,
    hollow,
    passive,
    transitions,
  };
}

// ---------------------------------------------------------------------------
// Score, contrato e recomendacoes
// ---------------------------------------------------------------------------

function weightedPercentage(items: EvaluatedRequirement[]): number {
  const total = items.reduce((sum, item) => sum + WEIGHTS[item.importance], 0);
  if (total === 0) return 0;
  const earned = items.reduce((sum, item) => sum + WEIGHTS[item.importance] * item.value, 0);
  return Math.round((earned / total) * 100);
}

function buildScore(requirements: EvaluatedRequirement[], report: RiskReport): number {
  const weighted = weightedPercentage(requirements);
  let score = requirements.length > 0 ? Math.round(weighted * 0.8 + 20) : 0;

  if (report.stuffing) score = Math.min(score, 70);
  if (report.copied) score = Math.min(score, 70);
  if (report.manipulation) score = Math.min(score, 40);

  return Math.max(0, Math.min(100, score));
}

function fitFromScore(score: number): FitLevel {
  if (score >= 76) return 'Forte';
  if (score >= 45) return 'Moderado';
  return 'Baixo';
}

function detectLevel(text: string): string {
  const normalized = lower(text);
  if (/\bestagiario\b|\bestagio\b/.test(normalized)) return 'Estágio';
  if (/\bjunior\b/.test(normalized)) return 'Júnior';
  if (/\bpleno\b|\bmid level\b/.test(normalized)) return 'Pleno';
  if (/\bsenior\b|\btech lead\b|\blead\b/.test(normalized)) return 'Sênior';
  if (/\bespecialista\b/.test(normalized)) return 'Especialista';
  return 'Não informado';
}

function buildSeniority(rawJob: string, rawResume: string): SeniorityAnalysis {
  const jobLevel = detectLevel(rawJob);
  const resumeLevel = detectLevel(rawResume);
  const known = jobLevel !== 'Não informado' && resumeLevel !== 'Não informado';
  const isAligned = known && jobLevel === resumeLevel;

  let summary: string;
  if (!known) {
    summary = 'Nível de senioridade não declarado nos textos; a comparação usa apenas a evidência das entregas.';
  } else if (isAligned) {
    summary = 'O nível declarado no currículo está alinhado ao nível exigido pela vaga.';
  } else {
    summary = 'O nível declarado no currículo difere do nível exigido pela vaga; comprove autonomia e escopo antes de se posicionar.';
  }

  return { jobLevel, resumeLevel, summary, isAligned };
}

const UNSAFE_CLAIM = new RegExp(
  [
    '[\\u2014\\u2013]',
    '\\bespecialista\\b',
    '\\bavancad[oa]\\b',
    '\\bfluente\\b',
    'orquestr',
    'alavanc',
    'sinergi',
    'transformacional',
    'apaixonad[oa] por',
    'altamente qualificad',
    'visao 360',
    'holistic',
    'orientad[oa] a resultados',
    'dinamic[oa] e proativ',
    'result driven',
    'go getter',
    'hands on',
    'solucoes end to end',
    'perfil analitico',
    'texto branco',
    'fonte oculta',
    'mencione',
    'inclua',
    'adicione',
    'destaque',
    'insira',
    'documente',
    '\\bcite\\b',
    'coloque',
  ].join('|'),
  'i',
);

function isSafeClaim(text: string): boolean {
  return text.trim().length > 0 && !UNSAFE_CLAIM.test(text);
}

const PLACEHOLDER_BULLET =
  '[verbo no passado] [entrega real que você fez], usando [ferramenta que você realmente utilizou], com [resultado que você consegue comprovar].';

function buildSections(
  requirements: EvaluatedRequirement[],
  resume: ResumeSignals,
  report: RiskReport,
): SectionRecommendation[] {
  const safeEvidence = requirements
    .filter((item) => item.status === 'ATENDE' && item.evidence.length > 0)
    .map((item) => item.evidence)
    .filter((evidence) => isSafeClaim(evidence));

  const experienceBullet = safeEvidence[0] ?? PLACEHOLDER_BULLET;
  const skillsBullet = safeEvidence[1] ?? PLACEHOLDER_BULLET;

  const passiveNote = report.passive.length > 0
    ? 'Há construções sem autoria explícita, como as detectadas na auditoria de tom.'
    : 'As entregas podem estar descritas sem deixar claro o que você fez, com qual ferramenta e qual foi o resultado.';

  return [
    {
      sectionName: 'Resumo profissional',
      currentIssue: 'O resumo precisa ligar o histórico real aos requisitos centrais da vaga, sem autodeclaração sem prova.',
      suggestedAction: 'Reescreva a abertura na fórmula: Ação no passado em primeira pessoa + contexto real + resultado comprovável.',
      metricOpportunity: 'Troque os campos entre colchetes por um número real que você consiga comprovar.',
      targetActionVerb: 'Usei',
      readyBulletTemplate: resume.segments.length > 0
        ? 'Profissional com [tempo de atuação] em [área em que você atuou], com entregas em [contexto real] e foco em [competência comprovada].'
        : PLACEHOLDER_BULLET,
    },
    {
      sectionName: 'Experiências profissionais',
      currentIssue: passiveNote,
      suggestedAction: 'Reescreva cada tópico na fórmula: Ação no passado em primeira pessoa + ferramenta exata + impacto real.',
      metricOpportunity: 'Descreva o resultado com um número que você consiga comprovar (tempo, volume ou custo).',
      targetActionVerb: 'Construí',
      readyBulletTemplate: experienceBullet,
    },
    {
      sectionName: 'Competências e projetos',
      currentIssue: 'Listas de ferramentas sem contexto não sustentam um requisito; o ATS precisa de uso demonstrado.',
      suggestedAction: 'Reescreva a competência dentro de um projeto real: Ação no passado + ferramenta + resultado.',
      metricOpportunity: 'Aponte o escopo real do projeto e o resultado que você consegue comprovar.',
      targetActionVerb: 'Implementei',
      readyBulletTemplate: skillsBullet,
    },
  ];
}

function buildGaps(requirements: EvaluatedRequirement[]): GapAnalysisItem[] {
  return requirements
    .filter((item) => item.status !== 'ATENDE')
    .sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance])
    .slice(0, 5)
    .map((item) => {
      let severity: GapSeverity = 'Moderado';
      if (item.importance === 'Inegociável' && item.status === 'NAO_ATENDE') severity = 'Crítico';
      else if (item.importance === 'Diferencial') severity = 'Pequeno';
      else if (item.importance === 'Baixa Prioridade') severity = 'Pequeno';

      const detail = item.status === 'PARCIAL'
        ? 'há apenas menção sem uso demonstrado'
        : 'não há evidência no currículo';

      return {
        gap: `${item.label}: ${detail}.`,
        severity,
        impact: 'A triagem pode descartar o currículo antes da leitura humana quando o requisito é obrigatório.',
        mitigationStrategy:
          'Registre apenas o que foi realizado de fato. Se ainda não houver prática, trate como lacuna e foque em um projeto real que você consiga comprovar.',
      };
    });
}

function buildQuestions(requirements: EvaluatedRequirement[]): string[] {
  const pending = requirements.filter((item) => item.status !== 'ATENDE').slice(0, 3);
  const questions = pending.map(
    (item) => `Você já aplicou ${item.label} em algum projeto real? Se sim, qual foi o contexto e o resultado? Se não, o que já estudou sobre o tema?`,
  );
  questions.push('Quais resultados reais (tempo, volume, custo) você consegue comprovar nas suas duas últimas experiências?');
  return questions;
}

function buildAiTone(report: RiskReport): AiToneAudit {
  let score = 5;
  if (report.buzz.length > 0) score += 25;
  if (report.passive.length > 0) score += 15;
  if (report.hollow.length > 0) score += 20;
  if (report.transitions.length > 0) score += 10;
  if (report.vague) score += 15;
  score = Math.max(0, Math.min(100, score));

  const verdict = score < 30
    ? 'Humano e Direto'
    : score < 65
      ? 'Sinais Leves de IA'
      : 'Altamente Artificial / Clichê de IA';

  const vertentes: AiToneVertente[] = [
    {
      dimensionKey: 'BUZZWORDS_FLUFF',
      dimensionName: 'Jargões Inflados & Verbos Genéricos',
      severity: report.buzz.length > 0 ? 'Atenção' : 'Limpo',
      detectedSnippets: report.buzz,
      humanAlternative: 'Use verbos de ação diretos em primeira pessoa: "Configurei", "Construí", "Analisei", "Criei", "Usei".',
      recommendation: report.buzz.length > 0
        ? `Substitua jargões como ${report.buzz.join(', ')} por verbos concretos e objetivos.`
        : 'Vocabulário profissional limpo, sem termos inflados detectados.',
    },
    {
      dimensionKey: 'PASSIVE_AUTHORLESS',
      dimensionName: 'Construções Passivas & Autoria Oculta',
      severity: report.passive.length > 0 ? 'Atenção' : 'Limpo',
      detectedSnippets: report.passive,
      humanAlternative: 'Assuma a responsabilidade direta: "Construí a API e configurei o cluster" em vez de "Foi desenvolvido".',
      recommendation: report.passive.length > 0
        ? 'Transforme sentenças passivas em ações diretas em primeira pessoa.'
        : 'Autoria e responsabilidade pessoal bem estruturadas nas descrições.',
    },
    {
      dimensionKey: 'HOLLOW_ADJECTIVES',
      dimensionName: 'Adjetivação Excessiva & Falta de Evidência',
      severity: report.hollow.length > 0 ? 'Atenção' : 'Limpo',
      detectedSnippets: report.hollow,
      humanAlternative: 'Em vez de autoelogio, mostre o resultado: "Otimizei a latência em 35% e criei a arquitetura escalável".',
      recommendation: report.hollow.length > 0
        ? 'Substitua adjetivos de autoelogio por fatos técnicos mensuráveis.'
        : 'Sem adjetivação vazia ou autoelogios não comprovados.',
    },
    {
      dimensionKey: 'ROBOTIC_SYMMETRY',
      dimensionName: 'Simetria Sintática & Uniformidade de LLM',
      severity: report.longSentence ? 'Atenção' : 'Limpo',
      detectedSnippets: report.longSentence ? ['períodos longos e uniformes'] : [],
      humanAlternative: 'Varie o tamanho dos tópicos e a profundidade conforme a relevância do projeto.',
      recommendation: 'Mantenha cadência textual equilibrada, com variações naturais de estrutura.',
    },
    {
      dimensionKey: 'AI_TRANSITIONS',
      dimensionName: 'Conectivos Artificiais de Transição',
      severity: report.transitions.length > 0 ? 'Atenção' : 'Limpo',
      detectedSnippets: report.transitions,
      humanAlternative: 'Corte conectivos formais desnecessários e abra o tópico diretamente com o verbo de ação.',
      recommendation: report.transitions.length > 0
        ? `Elimine conectivos como ${report.transitions.join(', ')}.`
        : 'Transições textuais limpas e objetivas.',
    },
    {
      dimensionKey: 'VAGUE_ABSTRACTION',
      dimensionName: 'Falta de Especificidade de Domínio',
      severity: report.vague ? 'Atenção' : 'Limpo',
      detectedSnippets: report.vague ? ['expressões genéricas sem entrega concreta'] : [],
      humanAlternative: 'Cite a ferramenta exata e o contexto real da entrega.',
      recommendation: report.vague
        ? 'Troque expressões genéricas por uma entrega concreta com ferramenta e resultado.'
        : 'As descrições indicam escopo e ferramentas concretas.',
    },
  ];

  return {
    aiLingoScore: score,
    verdict,
    vertentes,
    generalAdvice: 'Priorize verbos de ação no passado em primeira pessoa, ferramenta exata e resultado que você consiga comprovar.',
  };
}

// ---------------------------------------------------------------------------
// Motor publico
// ---------------------------------------------------------------------------

export function runEvidenceEngine(jobDescription: string, resumeText: string): AtsAnalysisResult {
  const safeJob = jobDescription.slice(0, MAX_JOB_CHARS).trim();
  const safeResume = resumeText.slice(0, MAX_RESUME_CHARS).trim();

  const resume: ResumeSignals = {
    raw: safeResume,
    segments: resumeSegments(safeResume),
    years: resumeYears(safeResume),
  };

  const specs = extractJobRequirements(safeJob);
  const requirements = specs.map((spec) => evaluateRequirement(spec, resume));
  const report = detectRisks(safeResume, safeJob, requirements);

  const score = buildScore(requirements, report);
  const fitGeneral = fitFromScore(score);

  const atende = requirements.filter((item) => item.status === 'ATENDE').length;
  const parcial = requirements.filter((item) => item.status === 'PARCIAL').length;
  const semEvidencia = requirements.filter((item) => item.status === 'NAO_ATENDE').length;

  const summaryHeadline = requirements.length === 0
    ? 'Não foi possível extrair requisitos objetivos da vaga. Descreva ao menos três competências exigidas para uma análise confiável.'
    : `Diagnóstico de aderência: ${score} de 100, com ${atende} requisito(s) comprovado(s), ${parcial} parcial(is) e ${semEvidencia} sem evidência.`;

  const top20Requirements: Top20Requirement[] = requirements.map((item) => ({
    id: item.key,
    requirement: item.label,
    importance: item.importance,
    status: item.status,
    evidenceInResume: item.evidence,
    actionNeeded: item.status === 'ATENDE'
      ? 'Descreva o contexto real de uso e o resultado obtido para sustentar este requisito.'
      : 'Registre apenas o que foi realizado de fato; sem prática comprovada, trate como lacuna.',
    weightScore: Math.round(item.value * 100),
  }));

  const matched = requirements
    .filter((item) => literalPresent(safeResume, item.key))
    .map((item) => item.key);
  const missing = requirements
    .filter((item) => item.status === 'NAO_ATENDE')
    .map((item) => item.key);
  const adjacent = LEXICON
    .filter((entry) => !requirements.some((item) => item.key === entry.key))
    .filter((entry) => literalPresent(safeResume, entry.key))
    .slice(0, 3)
    .map((entry) => entry.key);

  const keywords: KeywordsAnalysis = {
    matched,
    missing,
    partialOrAdjacent: adjacent,
    keywordDensityComment:
      'Palavras-chave só sustentam a triagem quando aparecem em frases de uso real. Listas soltas não substituem contexto.',
  };

  const gapsAnalysis = buildGaps(requirements);
  const sectionRecommendations = buildSections(requirements, resume, report);
  const strategicQuestions = buildQuestions(requirements);
  const aiToneAudit = buildAiTone(report);
  const seniorityAnalysis = buildSeniority(safeJob, safeResume);

  const mandatories = requirements.filter((item) => item.importance === 'Inegociável');
  const differentiators = requirements.filter((item) => item.importance === 'Diferencial');
  const scoreDetalhado = {
    obrigatorios: weightedPercentage(mandatories),
    desejaveis: weightedPercentage(differentiators),
    evidencia: requirements.length > 0
      ? Math.round((requirements.filter((item) => item.contextual).length / requirements.length) * 100)
      : 0,
    riscos: Math.max(0, 100 - report.risks.length * 10),
  };

  const contractRequirements: ContractRequirement[] = requirements.map((item) => ({
    requisito: item.label,
    importancia: item.importance,
    status: item.status,
    evidencia: item.evidence,
  }));

  const criticalGaps = gapsAnalysis
    .filter((gap) => gap.severity === 'Crítico')
    .map((gap) => gap.gap);

  const changes: ContractChange[] = sectionRecommendations.map((section) => ({
    onde: section.sectionName,
    o_que: section.currentIssue,
    como: section.suggestedAction,
  }));

  const veredito = fitGeneral === 'Forte'
    ? 'Compatível com a vaga'
    : fitGeneral === 'Moderado'
      ? 'Compatibilidade parcial'
      : 'Baixa compatibilidade';

  const checklistFinal = [
    'Cada requisito marcado como comprovado tem uma frase de contexto real no currículo.',
    'Nenhum termo foi inserido sem uso demonstrado.',
    'Os números citados são reais e verificáveis.',
    'As listas de ferramentas foram substituídas por entregas com contexto.',
  ];

  return {
    atsScore: score,
    fitGeneral,
    summaryHeadline,
    seniorityAnalysis,
    top20Requirements,
    keywords,
    gapsAnalysis,
    sectionRecommendations,
    aiToneAudit,
    strategicQuestions,
    timestamp: new Date().toISOString(),

    score_geral: score,
    veredito,
    score_detalhado: scoreDetalhado,
    requisitos: contractRequirements,
    termos_chave: { encontrados: matched, ausentes: missing },
    riscos: report.risks.map((risk) => risk.text),
    mudancas_sugeridas: changes,
    lacunas_criticas: criticalGaps,
    perguntas_para_esclarecer: strategicQuestions,
    checklist_final: checklistFinal,
  };
}
