import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AtsService } from '../../services/ats.service';

@Component({
  selector: 'app-guided-scaffold',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <section id="scaffold-section" class="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
      
      <!-- Header with Language Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-zinc-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <mat-icon class="text-sm">construction</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight">
                {{ lang() === 'pt' ? 'Gerador de Bullets Humanos (Scaffold Anti-Alucinação)' : 'Human Action Bullet Generator (Anti-Slop Scaffold)' }}
              </h3>
            </div>
            <p class="text-[11px] sm:text-xs text-zinc-500">
              {{ lang() === 'pt' ? 'Construa sentenças de alto impacto em 1ª pessoa com seus dados reais' : 'Craft high-impact first-person active sentences with your verifiable achievements' }}
            </p>
          </div>
        </div>

        <!-- Language Toggle Selector (PT-BR vs EN-US) -->
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <div class="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-mono font-semibold">
            <button
              id="scaffold-lang-pt-btn"
              type="button"
              (click)="setLanguage('pt')"
              [class]="lang() === 'pt'
                ? 'bg-white text-zinc-900 shadow-2xs px-2.5 py-1 rounded-lg transition-all font-bold'
                : 'text-zinc-500 hover:text-zinc-900 px-2.5 py-1 rounded-lg transition-all'">
              🇧🇷 PT-BR
            </button>
            <button
              id="scaffold-lang-en-btn"
              type="button"
              (click)="setLanguage('en')"
              [class]="lang() === 'en'
                ? 'bg-white text-zinc-900 shadow-2xs px-2.5 py-1 rounded-lg transition-all font-bold'
                : 'text-zinc-500 hover:text-zinc-900 px-2.5 py-1 rounded-lg transition-all'">
              🇺🇸 EN-US
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Template Swap Helper -->
      <div class="flex items-center justify-between bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80 text-xs">
        <div class="flex items-center gap-1.5 text-zinc-700">
          <mat-icon class="text-zinc-500 text-xs">translate</mat-icon>
          <span class="font-medium font-mono text-[11px]">
            {{ lang() === 'pt' ? 'Fórmula ATS: [Ação 1ª pessoa + Stack + Métrica Real]' : 'ATS Formula: [Past Active Verb + Tech Scope + Quantified Impact]' }}
          </span>
        </div>

        <button
          type="button"
          (click)="switchExampleTemplate()"
          class="text-[11px] font-semibold text-zinc-800 hover:text-zinc-950 underline cursor-pointer">
          {{ lang() === 'pt' ? 'Preencher Exemplo em Inglês' : 'Fill Example in Portuguese' }}
        </button>
      </div>

      <!-- Scaffold Input Form -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        
        <!-- Step 1: Action Verb in 1st person -->
        <div class="space-y-1.5">
          <label for="verb-input" class="text-xs font-semibold text-zinc-800 flex items-center gap-1">
            <span class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-800 text-[10px] flex items-center justify-center font-bold">1</span>
            <span>{{ lang() === 'pt' ? 'Verbo Ativo (1ª Pessoa)' : 'Active Verb (1st Person)' }}</span>
          </label>
          <input
            id="verb-input"
            type="text"
            [formControl]="actionVerbControl"
            [placeholder]="lang() === 'pt' ? 'Ex: Configurei, Construí, Analisei' : 'Ex: Built, Configured, Architected'"
            class="w-full text-xs font-mono p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-all text-zinc-800"
          />
          <div class="flex flex-wrap gap-1.5 pt-1">
            @for (v of currentVerbs(); track v) {
              <button
                type="button"
                (click)="actionVerbControl.setValue(v)"
                class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-700 transition-colors min-h-[30px] flex items-center justify-center">
                {{ v }}
              </button>
            }
          </div>
        </div>

        <!-- Step 2: Technology / Context -->
        <div class="space-y-1.5">
          <label for="stack-input" class="text-xs font-semibold text-zinc-800 flex items-center gap-1">
            <span class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-800 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>{{ lang() === 'pt' ? 'Tecnologia & Escopo' : 'Technology & Scope' }}</span>
          </label>
          <input
            id="stack-input"
            type="text"
            [formControl]="stackContextControl"
            [placeholder]="lang() === 'pt' ? 'Ex: a nova plataforma em Angular e TypeScript' : 'Ex: the core payment gateway using Angular and TypeScript'"
            class="w-full text-xs font-mono p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-all text-zinc-800"
          />
          <span class="text-[10px] text-zinc-500 block pt-0.5">
            {{ lang() === 'pt' ? 'Mencione a ferramenta exata da vaga.' : 'Include the exact tool/framework from the job description.' }}
          </span>
        </div>

        <!-- Step 3: Real Metric / Impact -->
        <div class="space-y-1.5">
          <label for="metric-input" class="text-xs font-semibold text-zinc-800 flex items-center gap-1">
            <span class="w-4 h-4 rounded-full bg-zinc-200 text-zinc-800 text-[10px] flex items-center justify-center font-bold">3</span>
            <span>{{ lang() === 'pt' ? 'Métrica Real de Impacto' : 'Quantified Impact / Metric' }}</span>
          </label>
          <input
            id="metric-input"
            type="text"
            [formControl]="metricImpactControl"
            [placeholder]="lang() === 'pt' ? 'Ex: atendendo mais de 200k usuários com -35% de latência' : 'Ex: serving 200k+ daily users while reducing latency by 35%'"
            class="w-full text-xs font-mono p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-all text-zinc-800"
          />
          <span class="text-[10px] text-zinc-500 block pt-0.5">
            {{ lang() === 'pt' ? 'Apenas números que você realmente atingiu.' : 'Only verifiable metrics you personally achieved.' }}
          </span>
        </div>

      </div>

      <!-- Generated Sentence Preview & Copy Box -->
      <div class="bg-zinc-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div class="space-y-1 w-full sm:w-auto">
          <span class="text-[10px] uppercase font-mono text-zinc-400 font-semibold block">
            {{ lang() === 'pt' ? 'Bullet Point Pronto para seu CV (1ª Pessoa Ativa):' : 'ATS Ready Bullet Point for your Resume (Active Past Voice):' }}
          </span>
          <p class="text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed break-words">
            - {{ getGeneratedBullet() }}
          </p>
        </div>

        <button
          id="copy-scaffold-bullet-btn"
          type="button"
          (click)="copyBullet()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-medium transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs min-h-[40px]">
          <mat-icon class="text-xs">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
          <span>{{ copied() ? (lang() === 'pt' ? 'Copiado!' : 'Copied!') : (lang() === 'pt' ? 'Copiar Bullet' : 'Copy Bullet') }}</span>
        </button>
      </div>

    </section>
  `,
})
export class GuidedScaffoldComponent {
  atsService = inject(AtsService);

  lang = computed(() => this.atsService.uiLanguage());

  actionVerbControl = new FormControl<string>('Construí', { nonNullable: true });
  stackContextControl = new FormControl<string>('a nova plataforma de pagamentos em Angular 18 e TypeScript', { nonNullable: true });
  metricImpactControl = new FormControl<string>('atendendo 200.000 usuários diários e reduzindo o consumo de memória em 35%', { nonNullable: true });

  copied = signal<boolean>(false);

  // Portuguese active verbs
  verbsPt = [
    'Configurei',
    'Construí',
    'Analisei',
    'Criei',
    'Transformei',
    'Carreguei',
    'Usei',
    'Implementei',
    'Otimizei',
    'Estruturei',
  ];

  // English active verbs
  verbsEn = [
    'Built',
    'Configured',
    'Architected',
    'Implemented',
    'Analyzed',
    'Created',
    'Transformed',
    'Loaded',
    'Engineered',
    'Optimized',
    'Structured',
  ];

  currentVerbs = computed(() => (this.lang() === 'pt' ? this.verbsPt : this.verbsEn));

  constructor() {
    effect(() => {
      const prefill = this.atsService.scaffoldPrefillData();
      if (prefill) {
        if (prefill.verb) this.actionVerbControl.setValue(prefill.verb);
        if (prefill.stack) this.stackContextControl.setValue(prefill.stack);
        if (prefill.metric) this.metricImpactControl.setValue(prefill.metric);
      }
    });
  }

  setLanguage(language: 'pt' | 'en'): void {
    this.atsService.setUiLanguage(language);
    if (language === 'en') {
      this.actionVerbControl.setValue('Built');
      this.stackContextControl.setValue('the core payment platform using Angular 18 and TypeScript');
      this.metricImpactControl.setValue('serving 200,000+ daily active users and reducing memory consumption by 35%');
    } else {
      this.actionVerbControl.setValue('Construí');
      this.stackContextControl.setValue('a nova plataforma de pagamentos em Angular 18 e TypeScript');
      this.metricImpactControl.setValue('atendendo 200.000 usuários diários e reduzindo o consumo de memória em 35%');
    }
  }

  switchExampleTemplate(): void {
    const nextLang = this.lang() === 'pt' ? 'en' : 'pt';
    this.setLanguage(nextLang);
  }

  getGeneratedBullet(): string {
    const verb = this.actionVerbControl.value.trim() || (this.lang() === 'pt' ? 'Construí' : 'Built');
    const stack = this.stackContextControl.value.trim() || (this.lang() === 'pt' ? '[sua tecnologia/projeto]' : '[your technology/scope]');
    const metric = this.metricImpactControl.value.trim() || (this.lang() === 'pt' ? '[seu impacto/métrica real]' : '[your quantified metric]');
    return `${verb} ${stack}, ${metric}.`;
  }

  copyBullet(): void {
    navigator.clipboard.writeText(`- ${this.getGeneratedBullet()}`);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
