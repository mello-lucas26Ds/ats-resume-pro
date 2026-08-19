import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AtsService, PRESET_SCENARIOS } from '../../services/ats.service';

@Component({
  selector: 'app-input-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="space-y-5 sm:space-y-6">
      
      <!-- Top Preset & Global UI Language Info -->
      <div class="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
            <mat-icon class="text-zinc-500 text-sm">flash_on</mat-icon>
            <span>
              {{ isUiEn() ? 'Quick Test Scenarios (Bilingual Presets):' : 'Cenários de Teste Rápidos (Presets Bilingues):' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Clear button -->
            <button
              id="clear-all-inputs-btn"
              type="button"
              (click)="clearAll()"
              title="Limpar campos"
              class="px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-600 text-zinc-600 text-xs font-medium transition-colors flex items-center gap-1 shrink-0">
              <mat-icon class="text-xs">delete_outline</mat-icon>
              <span>{{ isUiEn() ? 'Clear' : 'Limpar' }}</span>
            </button>
          </div>
        </div>
        
        <!-- Horizontally scrollable presets on mobile -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          @for (preset of presets; track preset.id) {
            <button
              [id]="'preset-' + preset.id"
              type="button"
              (click)="loadPreset(preset.id)"
              class="px-3 py-2 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-medium text-zinc-800 transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 whitespace-nowrap">
              <span>{{ isUiEn() ? preset.nameEn : preset.namePt }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-mono">
                {{ isUiEn() ? preset.badgeEn : preset.badgePt }}
              </span>
            </button>
          }
        </div>
      </div>

      <!-- Privacy & Ephemeral Session Notice -->
      <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs text-emerald-950">
        <div class="flex items-start sm:items-center gap-2">
          <mat-icon class="text-emerald-700 text-sm mt-0.5 sm:mt-0 shrink-0">lock</mat-icon>
          <span class="leading-relaxed">
            @if (isUiEn()) {
              <strong>Session Privacy:</strong> Your data resides exclusively in volatile in-memory session. Zero resume retention or permanent storage.
            } @else {
              <strong>Privacidade em Sessão:</strong> Seus dados residem exclusivamente na memória volátil da sessão. Nenhum texto é armazenado em banco de dados ou disco.
            }
          </span>
        </div>
        <span class="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold shrink-0 self-end sm:self-auto">
          {{ isUiEn() ? 'Zero Retention' : 'Zero Retenção' }}
        </span>
      </div>

      <!-- Two-Column Text Input Area -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        <!-- Left: Job Description -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">1</span>
              <h2 class="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight">
                {{ isUiEn() ? 'Job Description' : 'Descrição da Vaga' }}
              </h2>
            </div>
            <span
              [class]="jobControl.value.length > atsService.maxJobChars * 0.9 ? 'text-red-600 font-bold' : 'text-zinc-500'"
              class="text-[10px] sm:text-[11px] font-mono">
              {{ jobControl.value.length | number }} / {{ atsService.maxJobChars | number }} {{ isUiEn() ? 'chars' : 'carac.' }}
            </span>
          </div>

          <p class="text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
            {{ isUiEn() ? 'Requirements and responsibilities (min. 50 characters).' : 'Requisitos e responsabilidades (mín. 50 caracteres).' }}
          </p>

          <textarea
            id="job-description-textarea"
            [formControl]="jobControl"
            [maxlength]="atsService.maxJobChars"
            rows="10"
            [placeholder]="isUiEn() ? 'Paste here the job requirements (tech stack, must-haves, nice-to-haves)...' : 'Cole aqui os requisitos da vaga (stack tecnológica, inegociáveis, diferenciais)...'"
            class="w-full text-xs font-mono p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-all resize-y text-zinc-800 placeholder-zinc-400 leading-relaxed min-h-[160px] sm:min-h-[220px]"
          ></textarea>
        </div>

        <!-- Right: Candidate Resume (WITH INDEPENDENT TOGGLE 2) -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-100">
            
            <!-- Title -->
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">2</span>
              <h2 class="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight">
                {{ isUiEn() ? 'Current Resume (Text)' : 'Currículo Atual (Texto)' }}
              </h2>
            </div>

            <!-- TOGGLE 2: INDEPENDENT RESUME REWRITE & ADAPTATION TOGGLE -->
            <div class="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <span class="text-[10px] font-mono text-zinc-500 uppercase px-1 font-semibold hidden sm:inline">
                {{ isUiEn() ? 'CV Lang:' : 'Idioma do CV:' }}
              </span>
              
              <button
                id="resume-lang-pt-btn"
                type="button"
                (click)="atsService.setResumeLanguage('pt')"
                title="Adaptar / Reescrever Currículo em Português"
                [class]="atsService.resumeLanguage() === 'pt'
                  ? 'bg-white text-zinc-900 shadow-2xs px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg text-xs font-mono transition-all'">
                🇧🇷 PT-BR
              </button>

              <button
                id="resume-lang-en-btn"
                type="button"
                (click)="atsService.setResumeLanguage('en')"
                title="Adaptar / Reescrever Currículo em Inglês (EN-US)"
                [class]="atsService.resumeLanguage() === 'en'
                  ? 'bg-white text-zinc-900 shadow-2xs px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg text-xs font-mono transition-all'">
                🇺🇸 EN-US
              </button>
            </div>

          </div>

          <div class="flex items-center justify-between">
            <p class="text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
              {{ isUiEn() ? 'Work history, skills & achievements (min. 50 characters).' : 'Experiências e histórico (mín. 50 caracteres).' }}
            </p>
            <span
              [class]="resumeControl.value.length > atsService.maxResumeChars * 0.9 ? 'text-red-600 font-bold' : 'text-zinc-500'"
              class="text-[10px] sm:text-[11px] font-mono">
              {{ resumeControl.value.length | number }} / {{ atsService.maxResumeChars | number }} {{ isUiEn() ? 'chars' : 'carac.' }}
            </span>
          </div>

          <textarea
            id="resume-text-textarea"
            [formControl]="resumeControl"
            [maxlength]="atsService.maxResumeChars"
            rows="10"
            [placeholder]="atsService.resumeLanguage() === 'en' ? 'Paste here your resume in English (experience, stack, quantifiable metrics and education)...' : 'Cole aqui o texto do seu currículo em Português (experiências, stack, resultados e formação)...'"
            class="w-full text-xs font-mono p-3 bg-zinc-50/60 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-all resize-y text-zinc-800 placeholder-zinc-400 leading-relaxed min-h-[160px] sm:min-h-[220px]"
          ></textarea>
        </div>

      </div>

      <!-- Action & Anti-Flood Cooldown Banner -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-2xl bg-zinc-900 text-white shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
            <mat-icon class="text-base">verified_user</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-semibold text-white">
              {{ isUiEn() ? 'Veracity Guarantee & Anti-Hallucination Safe Execution' : 'Garantia de Veracidade & Execução Protegida' }}
            </h4>
            <p class="text-[11px] text-zinc-400">
              {{ isUiEn() ? 'Past active voice (Built, Configured, Implemented). Zero hallucinated metrics.' : 'Verbos de ação em 1ª pessoa (Configurei, Construí, Analisei). Sem alucinações.' }}
            </p>
          </div>
        </div>

        <button
          id="run-analysis-main-btn"
          type="button"
          (click)="triggerAnalysis()"
          [disabled]="isButtonDisabled()"
          class="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-xs tracking-tight transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 min-h-[44px]">
          @if (atsService.isAnalyzing()) {
            <span class="inline-block w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isUiEn() ? 'Auditing ATS Algorithms...' : 'Auditando Algoritmo ATS...' }}</span>
          } @else if (atsService.cooldownTimer() > 0) {
            <mat-icon class="text-sm text-zinc-500">hourglass_top</mat-icon>
            <span>{{ isUiEn() ? 'Please wait' : 'Aguarde' }} {{ atsService.cooldownTimer() }}s</span>
          } @else {
            <mat-icon class="text-sm">query_stats</mat-icon>
            <span>{{ isUiEn() ? 'Run ATS Match & Diagnostic' : 'Executar Match & Diagnóstico' }}</span>
          }
        </button>
      </div>

      @if (atsService.errorMessage()) {
        <div class="p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <mat-icon class="text-sm text-red-500 shrink-0">error_outline</mat-icon>
          <span>{{ atsService.errorMessage() }}</span>
        </div>
      }

    </section>
  `,
})
export class InputWorkspaceComponent {
  atsService = inject(AtsService);
  presets = PRESET_SCENARIOS;

  jobControl = new FormControl<string>(this.atsService.jobDescription(), { nonNullable: true });
  resumeControl = new FormControl<string>(this.atsService.resumeText(), { nonNullable: true });

  isUiEn(): boolean {
    return this.atsService.uiLanguage() === 'en';
  }

  constructor() {
    effect(() => {
      const currentJob = this.atsService.jobDescription();
      if (this.jobControl.value !== currentJob) {
        this.jobControl.setValue(currentJob);
      }
    });

    effect(() => {
      const currentResume = this.atsService.resumeText();
      if (this.resumeControl.value !== currentResume) {
        this.resumeControl.setValue(currentResume);
      }
    });

    this.jobControl.valueChanges.subscribe((val) => {
      this.atsService.jobDescription.set(val);
    });

    this.resumeControl.valueChanges.subscribe((val) => {
      this.atsService.resumeText.set(val);
    });
  }

  isButtonDisabled(): boolean {
    const jobLen = this.jobControl.value.trim().length;
    const resumeLen = this.resumeControl.value.trim().length;
    return (
      this.atsService.isAnalyzing() ||
      this.atsService.cooldownTimer() > 0 ||
      jobLen < this.atsService.minTextChars ||
      resumeLen < this.atsService.minTextChars
    );
  }

  loadPreset(presetId: string): void {
    this.atsService.loadPreset(presetId);
  }

  clearAll(): void {
    this.jobControl.setValue('');
    this.resumeControl.setValue('');
    this.atsService.clearInputs();
  }

  triggerAnalysis(): void {
    this.atsService.analyze();
  }
}
