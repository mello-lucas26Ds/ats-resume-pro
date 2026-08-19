import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SectionRecommendation } from '../../types/ats.types';
import { AtsService } from '../../services/ats.service';

@Component({
  selector: 'app-bullet-audit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-zinc-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <mat-icon class="text-sm">analytics</mat-icon>
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight">
              {{ lang() === 'pt' ? 'Auditoria por Seção & Bullets Prontos para o CV' : 'Section Audit & Production-Ready CV Bullets' }}
            </h3>
            <p class="text-[11px] sm:text-xs text-zinc-500">
              {{ lang() === 'pt' ? 'Onde e o que ajustar no seu currículo com sentenças de alto impacto em 1ª pessoa ativa' : 'Targeted diagnosis and first-person active sentences ready to copy into your resume' }}
            </p>
          </div>
        </div>
        <span class="text-xs font-mono text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200 self-start sm:self-auto">
          {{ recommendations().length }} {{ lang() === 'pt' ? 'seções diagnosticadas' : 'sections mapped' }}
        </span>
      </div>

      <!-- Recommendation Cards List -->
      <div class="space-y-4">
        @for (item of recommendations(); track $index) {
          <div class="border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-3.5 bg-zinc-50/40 hover:border-zinc-300 transition-colors">
            
            <!-- Section Name Header & Where to Align -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-900">
                <mat-icon class="text-zinc-700 text-sm">folder_open</mat-icon>
                <span>{{ item.sectionName }}</span>
              </div>
              <span class="text-[10px] font-mono uppercase bg-zinc-200/80 text-zinc-800 font-semibold px-2 py-0.5 rounded">
                {{ lang() === 'pt' ? 'Onde Ajustar no CV' : 'Target Section' }}
              </span>
            </div>

            <!-- Problem / Current Issue (O que está desalinhado) -->
            <div class="bg-white border border-red-200/90 rounded-xl p-3 sm:p-3.5 text-xs space-y-1">
              <div class="flex items-center gap-1.5 text-red-700 font-bold text-[11px]">
                <mat-icon class="text-xs text-red-600">error_outline</mat-icon>
                <span>{{ lang() === 'pt' ? 'Diagnóstico do problema no texto original:' : 'Issue in current resume text:' }}</span>
              </div>
              <p class="text-zinc-700 leading-relaxed pl-5 text-[11px] sm:text-xs">{{ item.currentIssue }}</p>
            </div>

            <!-- Suggested Action Formula (Fórmula de Ação) -->
            <div class="bg-white border border-zinc-200 rounded-xl p-3 sm:p-3.5 text-xs space-y-1.5">
              <div class="flex items-center gap-1.5 text-zinc-800 font-bold text-[11px]">
                <mat-icon class="text-xs text-zinc-900">bolt</mat-icon>
                <span>{{ lang() === 'pt' ? 'Fórmula Recomendada: [Verbo Ativo 1ª Pessoa + Stack + Métrica Real]' : 'Recommended Formula: [1st Person Active Verb + Tech Scope + Metric]' }}</span>
              </div>
              <p class="text-zinc-700 leading-relaxed pl-5 text-[11px] sm:text-xs">
                {{ item.suggestedAction }}
              </p>
            </div>

            <!-- Metric Opportunity (Strict Truth - No fake numbers) -->
            <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 sm:p-3.5 text-xs space-y-1">
              <div class="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                <mat-icon class="text-xs text-emerald-700">query_stats</mat-icon>
                <span>{{ lang() === 'pt' ? 'Oportunidade de quantificação com seus números reais:' : 'Where to quantify with your real verifiable numbers:' }}</span>
              </div>
              <p class="text-emerald-950 leading-relaxed font-mono text-[11px] sm:text-xs pl-5">
                {{ item.metricOpportunity }}
              </p>
            </div>

            <!-- READY-TO-COPY BULLET POINT (1ª Pessoa Ativa) -->
            @if (item.readyBulletTemplate || item.suggestedAction) {
              <div class="bg-zinc-900 text-white rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-sm border border-zinc-800">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 text-zinc-400">
                    <mat-icon class="text-emerald-400 text-xs">check_circle</mat-icon>
                    <span class="text-[10px] uppercase font-mono font-bold tracking-wide text-zinc-300">
                      {{ lang() === 'pt' ? 'Bullet Point Pronto para seu CV (1ª Pessoa Ativa):' : 'Ready Bullet Point for your CV (1st Person Active):' }}
                    </span>
                  </div>
                  <span class="text-[10px] font-mono text-zinc-400 hidden sm:inline-block">
                    {{ lang() === 'pt' ? 'Preencha [+X%] com seus dados reais' : 'Fill [+X%] with your real data' }}
                  </span>
                </div>

                <p class="text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed break-words bg-black/30 p-2.5 rounded-lg border border-zinc-800/80">
                  - {{ getBulletText(item) }}
                </p>

                <!-- Actions: Copy & Load into Scaffold -->
                <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    (click)="loadIntoScaffold(item)"
                    class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer">
                    <mat-icon class="text-xs">tune</mat-icon>
                    <span>{{ lang() === 'pt' ? 'Ajustar no Gerador' : 'Edit in Generator' }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="copyBullet(getBulletText(item), $index)"
                    class="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <mat-icon class="text-xs">{{ copiedIndex() === $index ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copiedIndex() === $index ? (lang() === 'pt' ? 'Copiado!' : 'Copied!') : (lang() === 'pt' ? 'Copiar Bullet' : 'Copy Bullet') }}</span>
                  </button>
                </div>
              </div>
            }

          </div>
        }
      </div>

    </section>
  `,
})
export class BulletAuditComponent {
  private atsService = inject(AtsService);

  recommendations = input<SectionRecommendation[]>([]);
  lang = computed(() => this.atsService.uiLanguage());

  copiedIndex = signal<number | null>(null);

  getBulletText(item: SectionRecommendation): string {
    if (item.readyBulletTemplate && item.readyBulletTemplate.trim().length > 0) {
      return item.readyBulletTemplate.trim().replace(/^[-•*]\s*/, '');
    }
    // Fallback based on suggested action
    const verb = item.targetActionVerb || 'Configurei';
    return `${verb} e implementei soluções técnicas aplicando as diretrizes da vaga, otimizando processos em [+X%] e atendendo [+Y usuários].`;
  }

  copyBullet(text: string, index: number): void {
    navigator.clipboard.writeText(`- ${text}`);
    this.copiedIndex.set(index);
    setTimeout(() => {
      if (this.copiedIndex() === index) {
        this.copiedIndex.set(null);
      }
    }, 2000);
  }

  loadIntoScaffold(item: SectionRecommendation): void {
    const verb = item.targetActionVerb || 'Construí';
    const stack = item.sectionName || 'a arquitetura principal e microsserviços';
    const metric = item.metricOpportunity || 'reduzindo latência em 35% e atendendo alta escala';
    this.atsService.loadIntoScaffold(verb, stack, metric);

    // Smooth scroll to scaffold if present
    const scaffoldEl = document.getElementById('scaffold-section') || document.querySelector('app-guided-scaffold');
    if (scaffoldEl) {
      scaffoldEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
