import { AtsAnalysisResult } from '../types/ats.types';
import { runEvidenceEngine } from './evidence-engine';

const MAX_JOB_CHARS = 15000;
const MAX_RESUME_CHARS = 20000;

/**
 * Fallback usado apenas quando a API não responde.
 * Reaproveita o mesmo motor determinístico do servidor para que a nota e as
 * sugestões não mudem de acordo com o caminho de execução.
 */
export function runHeuristicFallback(
  jobDescription: string,
  resumeText: string,
  isEnglish = false,
): AtsAnalysisResult {
  void isEnglish;
  return runEvidenceEngine(
    jobDescription.slice(0, MAX_JOB_CHARS),
    resumeText.slice(0, MAX_RESUME_CHARS),
  );
}
