import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { KeywordsAnalysis } from '../../types/ats.types';

@Component({
  selector: 'app-keyword-matrix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (keywords(); as kw) {
      <section class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-5">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              <mat-icon class="text-sm">view_comfy</mat-icon>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-900 tracking-tight">Matriz de Palavras-Chave ATS</h3>
              <p class="text-xs text-zinc-500">Mapeamento de termos e tecnologias essenciais para algoritmos de triagem</p>
            </div>
          </div>

          <button
            type="button"
            (click)="copyMissingKeywords()"
            class="text-xs text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center gap-1">
            <mat-icon class="text-xs">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
            <span>{{ copied() ? 'Copiadas!' : 'Copiar Ausentes' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <!-- Matched Keywords (Presentes) -->
          <div class="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <mat-icon class="text-xs text-emerald-600">check_circle</mat-icon>
                <span>Identificadas no Currículo ({{ kw.matched.length }})</span>
              </div>
              <span class="text-[10px] text-emerald-700 font-mono">Presentes</span>
            </div>

            <div class="flex flex-wrap gap-1.5">
              @for (term of kw.matched; track $index) {
                <span class="px-2.5 py-1 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-medium font-mono">
                  {{ term }}
                </span>
              }
              @if (kw.matched.length === 0) {
                <span class="text-xs text-zinc-500 italic">Nenhuma palavra-chave correspondente identificada.</span>
              }
            </div>
          </div>

          <!-- Missing Keywords (Ausentes / Críticas) -->
          <div class="border border-red-200 bg-red-50/30 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                <mat-icon class="text-xs text-red-600">error_outline</mat-icon>
                <span>Ausentes / Não Encontradas ({{ kw.missing.length }})</span>
              </div>
              <span class="text-[10px] text-red-700 font-mono">Atenção</span>
            </div>

            <div class="flex flex-wrap gap-1.5">
              @for (term of kw.missing; track $index) {
                <span class="px-2.5 py-1 rounded-lg bg-red-100/70 border border-red-200 text-red-900 text-xs font-medium font-mono">
                  {{ term }}
                </span>
              }
              @if (kw.missing.length === 0) {
                <span class="text-xs text-emerald-700 font-medium">Todas as palavras-chave principais foram encontradas!</span>
              }
            </div>
          </div>

        </div>

        <!-- Keyword Natural Density Advice -->
        <div class="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-zinc-600">
          <mat-icon class="text-zinc-500 text-sm mt-0.5 shrink-0">info</mat-icon>
          <div class="space-y-1">
            <strong class="text-zinc-800">Regra de Legibilidade e Densidade Natural:</strong>
            <p>{{ kw.keywordDensityComment }}</p>
          </div>
        </div>

      </section>
    }
  `,
})
export class KeywordMatrixComponent {
  keywords = input<KeywordsAnalysis | null>(null);
  copied = signal<boolean>(false);

  copyMissingKeywords(): void {
    const list = this.keywords()?.missing;
    if (list && list.length > 0) {
      navigator.clipboard.writeText(list.join(', '));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
