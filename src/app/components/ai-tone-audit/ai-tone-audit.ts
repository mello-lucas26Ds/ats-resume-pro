import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AiToneAudit } from '../../types/ats.types';

@Component({
  selector: 'app-ai-tone-audit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (audit(); as a) {
      <section class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              <mat-icon class="text-base">auto_awesome</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-zinc-900 tracking-tight">Auditoria de Tom & Purga de Linguajar de IA</h3>
                <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Motor 6 Vertentes
                </span>
              </div>
              <p class="text-xs text-zinc-500">Detecção de clichês de LLM, voz passiva e jargões inflados para manter tom humano e técnico</p>
            </div>
          </div>

          <!-- Lingo Score & Verdict Badge -->
          <div class="flex items-center gap-3 self-start sm:self-auto">
            <div class="text-right">
              <span class="text-xs text-zinc-500 block font-mono">Índice de IA</span>
              <span class="text-sm font-bold font-mono text-zinc-900">{{ a.aiLingoScore }}%</span>
            </div>
            <span
              [class]="getVerdictBadgeClass(a.verdict)"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 shadow-2xs">
              <mat-icon class="text-xs">{{ a.aiLingoScore < 30 ? 'face' : (a.aiLingoScore < 65 ? 'help_outline' : 'smart_toy') }}</mat-icon>
              <span>{{ a.verdict }}</span>
            </span>
          </div>
        </div>

        <!-- 6 Vertentes Breakdown Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (v of a.vertentes; track v.dimensionKey) {
            <div
              [class]="v.severity === 'Crítico' ? 'border-red-200 bg-red-50/20' : (v.severity === 'Atenção' ? 'border-amber-200 bg-amber-50/20' : 'border-zinc-200 bg-zinc-50/30')"
              class="border rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all">
              
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-semibold text-zinc-900 leading-tight">{{ v.dimensionName }}</h4>
                  <span
                    [class]="getSeverityBadgeClass(v.severity)"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded border uppercase font-mono shrink-0">
                    {{ v.severity }}
                  </span>
                </div>

                <!-- Detected Snippets if any -->
                @if (v.detectedSnippets.length > 0) {
                  <div class="space-y-1">
                    <span class="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">Trechos Alvo:</span>
                    <div class="flex flex-wrap gap-1">
                      @for (snip of v.detectedSnippets; track $index) {
                        <span class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-red-100/80 text-red-900 border border-red-200 line-through">
                          "{{ snip }}"
                        </span>
                      }
                    </div>
                  </div>
                }

                <!-- Recommendation & Alternative -->
                <p class="text-xs text-zinc-600 leading-relaxed">{{ v.recommendation }}</p>
              </div>

              <!-- Human Alternative Suggestion -->
              <div class="bg-white border border-zinc-200/80 rounded-lg p-2.5 text-xs text-zinc-700 space-y-0.5 pt-2">
                <span class="text-[10px] font-semibold uppercase font-mono text-zinc-500 flex items-center gap-1">
                  <mat-icon class="text-xs text-emerald-600">done_all</mat-icon>
                  <span>Padrão Humano / Sênior:</span>
                </span>
                <p class="text-[11px] text-zinc-800 font-mono leading-relaxed">{{ v.humanAlternative }}</p>
              </div>

            </div>
          }
        </div>

        <!-- General Advice Banner -->
        <div class="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-700">
          <mat-icon class="text-zinc-500 text-base mt-0.5 shrink-0">lightbulb</mat-icon>
          <div class="space-y-1">
            <strong class="text-zinc-900">Princípio Antigravidade / Anti-Slop:</strong>
            <p class="leading-relaxed">{{ a.generalAdvice }}</p>
          </div>
        </div>

      </section>
    }
  `,
})
export class AiToneAuditComponent {
  audit = input<AiToneAudit | null>(null);

  getVerdictBadgeClass(verdict: string): string {
    if (verdict === 'Humano e Direto') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (verdict === 'Sinais Leves de IA') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-800 border-red-200';
  }

  getSeverityBadgeClass(severity: string): string {
    if (severity === 'Limpo') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (severity === 'Atenção') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  }
}
