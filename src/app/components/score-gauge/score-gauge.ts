import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AtsAnalysisResult } from '../../types/ats.types';

@Component({
  selector: 'app-score-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (result(); as res) {
      <div class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <!-- Left: Circular Score Gauge -->
          <div class="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-zinc-100">
            <div class="relative w-36 h-36 flex items-center justify-center">
              
              <!-- SVG Ring -->
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  class="stroke-zinc-100"
                  stroke-width="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  [class]="getScoreStrokeClass(res.atsScore)"
                  stroke-width="8"
                  fill="transparent"
                  stroke-linecap="round"
                  [style.strokeDasharray]="251.2"
                  [style.strokeDashoffset]="251.2 - (251.2 * res.atsScore) / 100"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>

              <!-- Center Text -->
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-3xl font-black tracking-tight text-zinc-900 font-mono">{{ res.atsScore }}%</span>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Score ATS</span>
              </div>
            </div>

            <!-- Fit Level Pill -->
            <div class="mt-3">
              <span
                [class]="getFitBadgeClass(res.fitGeneral)"
                class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1">
                <mat-icon class="text-xs">{{ res.fitGeneral === 'Forte' ? 'check_circle' : (res.fitGeneral === 'Moderado' ? 'help_outline' : 'warning') }}</mat-icon>
                <span>Aderência: {{ res.fitGeneral }}</span>
              </span>
            </div>
          </div>

          <!-- Right: Summary & Seniority Comparison -->
          <div class="md:col-span-8 space-y-4">
            
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono uppercase tracking-widest text-zinc-600 font-semibold">Diagnóstico Geral</span>
              </div>
              <h3 class="text-base sm:text-lg font-semibold text-zinc-900 leading-snug">
                {{ res.summaryHeadline }}
              </h3>
            </div>

            <!-- Seniority Match Box -->
            <div class="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2 font-medium text-zinc-700">
                  <mat-icon class="text-zinc-500 text-sm">badge</mat-icon>
                  <span>Senioridade Exigida: <strong class="text-zinc-900">{{ res.seniorityAnalysis.jobLevel }}</strong></span>
                </div>
                <div class="flex items-center gap-2 font-medium text-zinc-700">
                  <span>Demonstrada no CV: <strong class="text-zinc-900">{{ res.seniorityAnalysis.resumeLevel }}</strong></span>
                </div>
                <span
                  [class]="res.seniorityAnalysis.isAligned ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                  class="text-[11px] font-semibold px-2 py-0.5 rounded-md border">
                  {{ res.seniorityAnalysis.isAligned ? 'Níveis Alinhados' : 'Gap de Senioridade' }}
                </span>
              </div>
              <p class="text-xs text-zinc-600 leading-relaxed">
                {{ res.seniorityAnalysis.summary }}
              </p>
            </div>

          </div>

        </div>

      </div>
    }
  `,
})
export class ScoreGaugeComponent {
  result = input<AtsAnalysisResult | null>(null);

  getScoreStrokeClass(score: number): string {
    if (score >= 80) return 'stroke-emerald-600';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  }

  getFitBadgeClass(fit: string): string {
    if (fit === 'Forte') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (fit === 'Moderado') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-red-100 text-red-800 border border-red-200';
  }
}
