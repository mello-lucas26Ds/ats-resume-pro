import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GapAnalysisItem } from '../../types/ats.types';

@Component({
  selector: 'app-gaps-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Gaps Analysis Panel -->
      <section class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div class="flex items-center gap-2">
            <mat-icon class="text-zinc-900 text-base">rule</mat-icon>
            <h3 class="text-sm font-semibold text-zinc-900 tracking-tight">Análise de Lacunas & Mitigação Ética</h3>
          </div>
          <span class="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
            {{ gaps().length }} identificadas
          </span>
        </div>

        <div class="space-y-3">
          @for (g of gaps(); track $index) {
            <div class="border border-zinc-200 rounded-xl p-3.5 space-y-2 bg-zinc-50/50">
              <div class="flex items-center justify-between gap-2">
                <h4 class="text-xs font-semibold text-zinc-900">{{ g.gap }}</h4>
                <span [class]="getSeverityBadgeClass(g.severity)" class="text-[10px] font-semibold px-2 py-0.5 rounded border uppercase">
                  {{ g.severity }}
                </span>
              </div>
              <p class="text-xs text-zinc-600"><strong>Impacto ATS:</strong> {{ g.impact }}</p>
              <div class="bg-white border border-zinc-200/80 rounded-lg p-2.5 text-xs text-zinc-700 space-y-0.5">
                <span class="text-[11px] font-semibold text-zinc-900 block">Estratégia Legítima de Posicionamento:</span>
                <p class="text-zinc-600">{{ g.mitigationStrategy }}</p>
              </div>
            </div>
          }
          @if (gaps().length === 0) {
            <div class="p-6 text-center text-xs text-zinc-500">
              <mat-icon class="text-emerald-500 text-2xl mx-auto mb-1">verified</mat-icon>
              <p>Nenhuma lacuna crítica detectada entre a vaga e seu perfil.</p>
            </div>
          }
        </div>
      </section>

      <!-- Strategic Validation Questions -->
      <section class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div class="flex items-center gap-2">
            <mat-icon class="text-zinc-900 text-base">psychology_alt</mat-icon>
            <h3 class="text-sm font-semibold text-zinc-900 tracking-tight">Perguntas Estratégicas de Validação</h3>
          </div>
          <span class="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
            Checklist
          </span>
        </div>

        <p class="text-xs text-zinc-500 leading-relaxed">
          Reflita sobre os itens abaixo antes de submeter sua candidatura. Se você possui essas informações factuais, inclua-as no currículo:
        </p>

        <div class="space-y-2.5">
          @for (q of questions(); track $index) {
            <div class="p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 flex items-start gap-2.5 text-xs text-zinc-800">
              <span class="w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {{ $index + 1 }}
              </span>
              <p class="leading-relaxed">{{ q }}</p>
            </div>
          }
        </div>
      </section>

    </div>
  `,
})
export class GapsPanelComponent {
  gaps = input<GapAnalysisItem[]>([]);
  questions = input<string[]>([]);

  getSeverityBadgeClass(severity: string): string {
    if (severity === 'Crítico') return 'bg-red-50 text-red-700 border-red-200';
    if (severity === 'Moderado') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}
