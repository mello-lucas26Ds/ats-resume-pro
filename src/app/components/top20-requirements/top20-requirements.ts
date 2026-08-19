import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Top20Requirement } from '../../types/ats.types';

@Component({
  selector: 'app-top20-requirements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-5">
      
      <!-- Section Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
            20%
          </div>
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 tracking-tight">Requisitos TOP 20% da Vaga (Regra de Pareto)</h3>
            <p class="text-xs text-zinc-500">Os 3 a 5 critérios centrais que decidem 80% da triagem por ATS e recrutadores</p>
          </div>
        </div>
        <span class="text-xs font-mono text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200/80 self-start sm:self-auto">
          {{ requirements().length }} itens avaliados
        </span>
      </div>

      <!-- Requirements Grid -->
      <div class="space-y-3.5">
        @for (req of requirements(); track $index) {
          <div class="border border-zinc-200 rounded-xl p-4 transition-all hover:border-zinc-300 space-y-3">
            
            <!-- Item Header & Badges -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span [class]="getImportanceBadgeClass(req.importance)" class="text-[11px] font-semibold px-2 py-0.5 rounded-md border">
                  {{ req.importance }}
                </span>
                <h4 class="text-xs sm:text-sm font-semibold text-zinc-900">{{ req.requirement }}</h4>
              </div>

              <span [class]="getStatusBadgeClass(req.status)" class="text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 self-start sm:self-auto">
                <mat-icon class="text-xs">{{ req.status === 'ATENDE' ? 'check_circle' : (req.status === 'PARCIAL' ? 'timelapse' : 'cancel') }}</mat-icon>
                <span>{{ req.status === 'ATENDE' ? 'Atende' : (req.status === 'PARCIAL' ? 'Atende Parcial' : 'Não Atende') }}</span>
              </span>
            </div>

            <!-- Factual Evidence in Resume -->
            @if (req.evidenceInResume) {
              <div class="bg-zinc-50 border border-zinc-200/70 rounded-lg p-3 text-xs text-zinc-700 space-y-1">
                <div class="flex items-center gap-1.5 text-zinc-500 font-medium text-[11px]">
                  <mat-icon class="text-xs text-emerald-600">article</mat-icon>
                  <span>Evidência factual localizada no currículo:</span>
                </div>
                <p class="font-mono text-[11px] text-zinc-800 italic bg-white p-2 rounded border border-zinc-200/50">
                  "{{ req.evidenceInResume }}"
                </p>
              </div>
            } @else {
              <div class="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-800 flex items-center gap-2">
                <mat-icon class="text-xs text-amber-600">info</mat-icon>
                <span>Nenhuma menção explícita ou comprovação localizada no texto do currículo.</span>
              </div>
            }

            <!-- Action Needed -->
            <div class="text-xs text-zinc-600 flex items-start gap-2 pt-1">
              <mat-icon class="text-xs text-zinc-400 mt-0.5 shrink-0">arrow_right_alt</mat-icon>
              <span><strong>Orientação de Ação:</strong> {{ req.actionNeeded }}</span>
            </div>

          </div>
        }
      </div>

    </section>
  `,
})
export class Top20RequirementsComponent {
  requirements = input<Top20Requirement[]>([]);

  getImportanceBadgeClass(importance: string): string {
    if (importance === 'Inegociável') return 'bg-red-50 text-red-700 border-red-200';
    if (importance === 'Importante') return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    if (importance === 'Diferencial') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-zinc-50 text-zinc-600 border-zinc-200';
  }

  getStatusBadgeClass(status: string): string {
    if (status === 'ATENDE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'PARCIAL') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-zinc-100 text-zinc-700 border-zinc-300';
  }
}
