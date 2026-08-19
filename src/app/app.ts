import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AtsService } from './services/ats.service';
import { HeaderComponent } from './components/header/header';
import { InputWorkspaceComponent } from './components/input-workspace/input-workspace';
import { ScoreGaugeComponent } from './components/score-gauge/score-gauge';
import { Top20RequirementsComponent } from './components/top20-requirements/top20-requirements';
import { KeywordMatrixComponent } from './components/keyword-matrix/keyword-matrix';
import { BulletAuditComponent } from './components/bullet-audit/bullet-audit';
import { GapsPanelComponent } from './components/gaps-panel/gaps-panel';
import { AiToneAuditComponent } from './components/ai-tone-audit/ai-tone-audit';
import { GuidedScaffoldComponent } from './components/guided-scaffold/guided-scaffold';
import { TestSuiteComponent } from './components/test-suite/test-suite';
import { LgpdModalComponent } from './components/lgpd-modal/lgpd-modal';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatIconModule,
    HeaderComponent,
    InputWorkspaceComponent,
    ScoreGaugeComponent,
    Top20RequirementsComponent,
    KeywordMatrixComponent,
    BulletAuditComponent,
    GapsPanelComponent,
    AiToneAuditComponent,
    GuidedScaffoldComponent,
    TestSuiteComponent,
    LgpdModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  atsService = inject(AtsService);
  copiedReport = signal<boolean>(false);
  lgpdModal = viewChild(LgpdModalComponent);

  openLgpdModal(): void {
    this.lgpdModal()?.openModal();
  }

  exportDiagnosticReport(): void {
    const res = this.atsService.analysisResult();
    if (!res) return;

    const report = `
# DIAGNÓSTICO DE MATCH ATS, TRIAGEM TÉCNICA & AUDITORIA DE TOM DE IA
Data: ${new Date(res.timestamp).toLocaleString()}

## 1. RESUMO GERAL
- Score ATS: ${res.atsScore}% (${res.fitGeneral})
- Tom de IA: ${res.aiToneAudit.aiLingoScore}% (${res.aiToneAudit.verdict})
- Síntese: ${res.summaryHeadline}
- Senioridade: Vaga (${res.seniorityAnalysis.jobLevel}) vs CV (${res.seniorityAnalysis.resumeLevel})
- Alinhamento: ${res.seniorityAnalysis.summary}

## 2. AUDITORIA DAS 6 VERTENTES DE LINGUAJAR DE IA (ANTI-SLOP)
${res.aiToneAudit.vertentes.map((v, i) => `${i + 1}. ${v.dimensionName} [${v.severity}]
   - Trechos detectados: ${v.detectedSnippets.join(', ') || 'Nenhum'}
   - Recomendação: ${v.recommendation}
   - Padrão Humano / Sênior: ${v.humanAlternative}`).join('\n\n')}

## 3. REQUISITOS TOP 20% (PARETO)
${res.top20Requirements.map((r, i) => `${i + 1}. [${r.importance}] ${r.requirement} -> Status: ${r.status}
   - Evidência no CV: "${r.evidenceInResume || 'Nenhuma'}"
   - Ação Recomendada: ${r.actionNeeded}`).join('\n\n')}

## 4. MATRIZ DE PALAVRAS-CHAVE ATS
- Presentes no CV: ${res.keywords.matched.join(', ') || 'Nenhuma'}
- Ausentes/Críticas: ${res.keywords.missing.join(', ') || 'Nenhuma'}
- Recomendação de Densidade: ${res.keywords.keywordDensityComment}

## 5. LACUNAS (GAPS) & MITIGAÇÃO ÉTICA
${res.gapsAnalysis.map((g, i) => `${i + 1}. ${g.gap} [${g.severity}]
   - Impacto: ${g.impact}
   - Estratégia de Mitigação: ${g.mitigationStrategy}`).join('\n\n')}

## 6. AUDITORIA DE REDAÇÃO (ONDE AJUSTAR NO CURRÍCULO)
${res.sectionRecommendations.map((s, i) => `${i + 1}. ${s.sectionName}
   - Ajuste necessário: ${s.currentIssue}
   - Fórmula sugerida: ${s.suggestedAction}
   - Onde quantificar: ${s.metricOpportunity}`).join('\n\n')}

## 7. PERGUNTAS ESTRATÉGICAS DE VALIDAÇÃO
${res.strategicQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(report);
    this.copiedReport.set(true);
    setTimeout(() => this.copiedReport.set(false), 2500);
  }
}
