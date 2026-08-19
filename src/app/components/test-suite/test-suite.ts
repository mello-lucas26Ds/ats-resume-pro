import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TestSuiteService } from '../../services/test-suite.service';
import { AtsService } from '../../services/ats.service';

@Component({
  selector: 'app-test-suite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="space-y-6">
      
      <!-- Project Architecture & Craftsmanship Showcase Card -->
      <div class="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-md space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-semibold border border-emerald-500/30">
                PROJETO DE ENGENHARIA
              </span>
              <span class="text-xs font-mono text-zinc-400">v1.2.0</span>
            </div>
            <h1 class="text-lg sm:text-xl font-bold text-white tracking-tight">
              {{ isUiEn() ? 'Match ATS: Engineering Architecture & Automated Tests' : 'Match ATS: Arquitetura de Software & Validação Contínua' }}
            </h1>
            <p class="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              {{ isUiEn()
                ? 'Deterministic audit engine for ATS algorithms, Pareto 20/80 triage, 6-dimension AI-tone detector, and Privacy by Design (LGPD zero-retention).'
                : 'Motor determinístico de auditoria ATS, triagem por Pareto 20/80, detector de tom de IA em 6 vertentes e conformidade com LGPD (zero retenção em disco).' }}
            </p>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <a
              [href]="atsService.githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/10">
              <mat-icon class="text-xs">code</mat-icon>
              <span>GitHub</span>
            </a>
            <a
              [href]="atsService.linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm">
              <mat-icon class="text-xs">person</mat-icon>
              <span>Lucas Mello</span>
            </a>
          </div>
        </div>

        <!-- Architectural Pillars Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div class="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-1">
            <div class="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <mat-icon class="text-sm">security</mat-icon>
              <span>{{ isUiEn() ? 'Security & Privacy' : 'Segurança & LGPD' }}</span>
            </div>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
              {{ isUiEn() ? 'Ephemeral volatile session memory. Zero disk/database persistence.' : 'Memória volátil em sessão. Zero persistência em banco de dados ou disco.' }}
            </p>
          </div>

          <div class="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-1">
            <div class="flex items-center gap-1.5 text-amber-400 font-semibold">
              <mat-icon class="text-sm">pie_chart</mat-icon>
              <span>{{ isUiEn() ? 'Pareto 20/80 Principle' : 'Princípio de Pareto (20/80)' }}</span>
            </div>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
              {{ isUiEn() ? 'Focuses on the 20% high-leverage keywords that dictate 80% of ATS screening.' : 'Foco nos 20% de requisitos essenciais que decidem 80% do filtro dos recrutadores.' }}
            </p>
          </div>

          <div class="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-1">
            <div class="flex items-center gap-1.5 text-purple-400 font-semibold">
              <mat-icon class="text-sm">psychology</mat-icon>
              <span>{{ isUiEn() ? 'Anti-AI Slop Guard' : 'Filtro Anti-Clichês de IA' }}</span>
            </div>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
              {{ isUiEn() ? 'Identifies robotic generic phrasing and transforms them into active past-tense bullets.' : 'Detecta jargões vazios e sugere reescrita com verbos ativos em 1ª pessoa.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Test Suite Header Banner -->
      <div class="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <mat-icon class="text-sm">flaky</mat-icon>
              </span>
              <h2 class="text-sm sm:text-base font-semibold text-zinc-900 tracking-tight">
                {{ isUiEn() ? 'Automated Test Suite & Engine Validation' : 'Suíte de Validação & Testes Automáticos do Motor' }}
              </h2>
            </div>
            <p class="text-xs text-zinc-500">
              {{ isUiEn()
                ? 'Real-time deterministic assertions validating core ATS heuristics, veracity guarantee, and keyword density.'
                : 'Execução de asserções em tempo real para validar as 5 regras de ouro (Pareto 20/80, Veracidade, Bullets, Keywords e Senioridade).' }}
            </p>
          </div>

          <button
            id="run-all-tests-btn"
            type="button"
            (click)="runTests()"
            [disabled]="testService.isRunningTests()"
            class="px-5 py-3 sm:py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-tight transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shrink-0 min-h-[44px] sm:min-h-0">
            @if (testService.isRunningTests()) {
              <span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isUiEn() ? 'Running Test Suite...' : 'Executando Testes...' }}</span>
            } @else {
              <mat-icon class="text-sm">play_arrow</mat-icon>
              <span>{{ isUiEn() ? 'Run Test Battery' : 'Executar Bateria de Testes' }}</span>
            }
          </button>
        </div>

        <!-- Metrics Overview Grid -->
        @if (testService.testReport(); as rep) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100">
            
            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
              <span class="text-[11px] font-mono uppercase text-zinc-500 block">
                {{ isUiEn() ? 'Total Tests' : 'Total de Testes' }}
              </span>
              <span class="text-lg font-bold text-zinc-900 font-mono">{{ rep.totalTests }}</span>
            </div>

            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-center">
              <span class="text-[11px] font-mono uppercase text-emerald-700 block">
                {{ isUiEn() ? 'Passed' : 'Aprovados' }}
              </span>
              <span class="text-lg font-bold text-emerald-800 font-mono">{{ rep.passedTests }}</span>
            </div>

            <div class="p-3 bg-red-50 rounded-xl border border-red-200/80 text-center">
              <span class="text-[11px] font-mono uppercase text-red-700 block">
                {{ isUiEn() ? 'Failed' : 'Falhas' }}
              </span>
              <span class="text-lg font-bold text-red-800 font-mono">{{ rep.failedTests }}</span>
            </div>

            <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
              <span class="text-[11px] font-mono uppercase text-zinc-500 block">
                {{ isUiEn() ? 'Execution Time' : 'Tempo Total' }}
              </span>
              <span class="text-lg font-bold text-zinc-900 font-mono">{{ rep.totalDurationMs }}ms</span>
            </div>

          </div>
        }
      </div>

      <!-- Test Cases Detailed List -->
      @if (testService.testReport(); as rep) {
        <div class="space-y-4">
          @for (test of rep.results; track test.id) {
            <div
              [class]="test.passed ? 'border-zinc-200 bg-white' : 'border-red-200 bg-red-50/20'"
              class="border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all">
              
              <!-- Header -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span
                    [class]="test.passed ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'"
                    class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase font-mono border inline-flex items-center gap-1">
                    <mat-icon class="text-xs">{{ test.passed ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>{{ test.passed ? 'PASSED' : 'FAILED' }}</span>
                  </span>
                  <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {{ test.ruleCategory }}
                  </span>
                  <h3 class="text-xs sm:text-sm font-semibold text-zinc-900">{{ test.name }}</h3>
                </div>

                <span class="text-[11px] font-mono text-zinc-500 self-start sm:self-auto">
                  {{ test.executionTimeMs }}ms
                </span>
              </div>

              <!-- Description -->
              <p class="text-xs text-zinc-600 leading-relaxed">{{ test.description }}</p>

              <!-- Assertions List -->
              <div class="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-2">
                <span class="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
                  {{ isUiEn() ? 'Verified Assertions:' : 'Asserções Validadas:' }}
                </span>
                <div class="space-y-1.5">
                  @for (assertion of test.assertions; track $index) {
                    <div class="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white border border-zinc-200/60 font-mono">
                      <div class="flex items-center gap-2">
                        <mat-icon [class]="assertion.passed ? 'text-emerald-600' : 'text-red-600'" class="text-xs">
                          {{ assertion.passed ? 'check' : 'close' }}
                        </mat-icon>
                        <span class="text-zinc-800">{{ assertion.name }}</span>
                      </div>
                      <span [class]="assertion.passed ? 'text-emerald-700' : 'text-red-700'" class="text-[11px] font-semibold">
                        {{ assertion.passed ? (isUiEn() ? 'OK' : 'OK') : (isUiEn() ? 'FAIL' : 'FALHA') }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- Logs / Details -->
              @if (test.details) {
                <div class="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-zinc-400">terminal</mat-icon>
                  <span>{{ isUiEn() ? 'Result:' : 'Resultado:' }} {{ test.details }}</span>
                </div>
              }

            </div>
          }
        </div>
      } @else {
        <!-- Empty State Before Running -->
        <div class="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700">
            <mat-icon class="text-2xl">science</mat-icon>
          </div>
          <h3 class="text-sm font-semibold text-zinc-900">
            {{ isUiEn() ? 'No tests executed in this session' : 'Nenhum teste executado nesta sessão' }}
          </h3>
          <p class="text-xs text-zinc-500 max-w-md mx-auto">
            {{ isUiEn() ? 'Click the button above to run the automated test suite.' : 'Clique no botão acima para rodar a suíte completa de testes automáticos e validar a conformidade das regras ATS.' }}
          </p>
        </div>
      }

    </section>
  `,
})
export class TestSuiteComponent implements OnInit {
  testService = inject(TestSuiteService);
  atsService = inject(AtsService);

  isUiEn(): boolean {
    return this.atsService.uiLanguage() === 'en';
  }

  ngOnInit(): void {
    if (!this.testService.testReport()) {
      this.testService.runTests();
    }
  }

  runTests(): void {
    this.testService.runTests();
  }
}
