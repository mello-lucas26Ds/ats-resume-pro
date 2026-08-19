export type RequirementImportance = 'Inegociável' | 'Importante' | 'Diferencial' | 'Baixa Prioridade';
export type MatchStatus = 'ATENDE' | 'PARCIAL' | 'NAO_ATENDE';
export type GapSeverity = 'Crítico' | 'Moderado' | 'Pequeno';
export type FitLevel = 'Forte' | 'Moderado' | 'Baixo';
export type AiToneVerdict =
  | 'Humano e Direto'
  | 'Sinais Leves de IA'
  | 'Altamente Artificial / Clichê de IA'
  | 'Human & Direct'
  | 'Mild AI Clichés'
  | 'Heavy AI Buzzwords';
export type AiVertenteSeverity = 'Limpo' | 'Atenção' | 'Crítico';

export interface Top20Requirement {
  id?: string;
  requirement: string;
  importance: RequirementImportance;
  status: MatchStatus;
  evidenceInResume: string;
  actionNeeded: string;
  weightScore?: number; // 0-100
}

export interface KeywordsAnalysis {
  matched: string[];
  missing: string[];
  partialOrAdjacent: string[];
  keywordDensityComment: string;
}

export interface GapAnalysisItem {
  gap: string;
  severity: GapSeverity;
  impact: string;
  mitigationStrategy: string;
}

export interface SectionRecommendation {
  sectionName: string;
  currentIssue: string;
  suggestedAction: string;
  metricOpportunity: string;
  readyBulletTemplate?: string; // Bullet point pronto em 1ª pessoa com placeholders claros [X%]
  targetActionVerb?: string; // Verbo de ação sugerido (Configurei, Construí, Criei, Usei, etc.)
}

export interface SeniorityAnalysis {
  jobLevel: string;
  resumeLevel: string;
  summary: string;
  isAligned: boolean;
}

/**
 * 6 Vertentes de Detecção e Purga de Linguajar de IA (Contexta.ai / ATS Anti-Slop Engine)
 */
export interface AiToneVertente {
  dimensionKey:
    | 'BUZZWORDS_FLUFF'
    | 'PASSIVE_AUTHORLESS'
    | 'HOLLOW_ADJECTIVES'
    | 'ROBOTIC_SYMMETRY'
    | 'AI_TRANSITIONS'
    | 'VAGUE_ABSTRACTION';
  dimensionName: string;
  severity: AiVertenteSeverity;
  detectedSnippets: string[];
  humanAlternative: string;
  recommendation: string;
}

export interface AiToneAudit {
  aiLingoScore: number; // 0 (100% humano) a 100 (100% IA robótica)
  verdict: AiToneVerdict;
  vertentes: AiToneVertente[];
  generalAdvice: string;
}

export interface AtsAnalysisResult {
  atsScore: number; // 0-100
  fitGeneral: FitLevel;
  summaryHeadline: string;
  seniorityAnalysis: SeniorityAnalysis;
  top20Requirements: Top20Requirement[];
  keywords: KeywordsAnalysis;
  gapsAnalysis: GapAnalysisItem[];
  sectionRecommendations: SectionRecommendation[];
  aiToneAudit: AiToneAudit;
  strategicQuestions: string[];
  timestamp: string;
}

export interface AnalyzePayload {
  jobDescription: string;
  resumeText: string;
}

// Test Runner Types
export interface TestCaseResult {
  id: string;
  name: string;
  ruleCategory:
    | 'TOP_20_PARETO'
    | 'VERACITY_TRUTH'
    | 'BULLET_AUDIT'
    | 'KEYWORD_MATRIX'
    | 'SENIORITY_EVALUATION'
    | 'AI_TONE_DETECTION'
    | 'ACTION_BULLETS'
    | 'AI_TONE_6_VERTENTES'
    | 'BILINGUAL_SUPPORT'
    | 'KEYWORD_DENSITY'
    | 'PRIVACY_COMPLIANCE';
  description: string;
  passed: boolean;
  executionTimeMs: number;
  assertions: {
    name: string;
    expected: string | number | boolean;
    actual: string | number | boolean;
    passed: boolean;
  }[];
  details?: string;
}

export interface TestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDurationMs: number;
  results: TestCaseResult[];
}
