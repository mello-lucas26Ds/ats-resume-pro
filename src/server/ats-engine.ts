import { AtsAnalysisResult } from '../app/types/ats.types';
import { runEvidenceEngine } from '../app/utils/evidence-engine';

export type AtsEngineAnalysis = AtsAnalysisResult;

// Limites rígidos de entrada (memória / payload).
const MAX_SERVER_JOB_CHARS = 15000;
const MAX_SERVER_RESUME_CHARS = 20000;

/**
 * Motor único de avaliação: determinístico e baseado em evidência.
 *
 * A pontuação, os requisitos, as lacunas e as sugestões vêm apenas do que
 * aparece na vaga e no currículo. Não há geração de experiência, métrica ou
 * requisito que não esteja ancorado nos textos de entrada.
 */
export async function runAtsAnalysis(
  jobDescription: string,
  resumeText: string,
): Promise<AtsEngineAnalysis> {
  const safeJob = jobDescription.slice(0, MAX_SERVER_JOB_CHARS).trim();
  const safeResume = resumeText.slice(0, MAX_SERVER_RESUME_CHARS).trim();
  return runEvidenceEngine(safeJob, safeResume);
}

export function runHeuristicFallback(jobDescription: string, resumeText: string): AtsAnalysisResult {
  return runEvidenceEngine(jobDescription, resumeText);
}
