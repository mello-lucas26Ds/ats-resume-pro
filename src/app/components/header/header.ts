import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AtsService } from '../../services/ats.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <header class="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[3.75rem] sm:h-16 py-2 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        <!-- Brand & Title -->
        <div class="flex items-center justify-between w-full sm:w-auto gap-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <mat-icon class="text-base sm:text-lg">tune</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                <span class="font-semibold tracking-tight text-zinc-900 text-sm sm:text-base leading-tight">Match ATS</span>
                <span class="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono">
                  Pareto 20/80
                </span>

                <!-- Live Realtime Telemetry Counter Pill -->
                <div class="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-100/90 border border-zinc-200 text-[11px] font-mono text-zinc-700 shadow-2xs">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span title="Total de análises executadas">
                    <strong class="text-zinc-900 font-bold">{{ atsService.totalAudits() }}</strong> {{ atsService.uiLanguage() === 'pt' ? 'análises' : 'audits' }}
                  </span>
                  <span class="text-zinc-300">•</span>
                  <span title="Total de acessos à plataforma">
                    <strong class="text-zinc-900 font-bold">{{ atsService.totalVisits() }}</strong> {{ atsService.uiLanguage() === 'pt' ? 'visitas' : 'visits' }}
                  </span>
                </div>
              </div>
              <p class="text-[11px] text-zinc-500 hidden sm:block">
                {{ atsService.uiLanguage() === 'pt' ? 'Auditoria algorítmica, veracidade e diagnóstico de triagem' : 'ATS algorithm audit, factual veracity & triage scoring' }}
              </p>
            </div>
          </div>

          <!-- Top-right Mobile controls (Global UI Language Toggle + LGPD) -->
          <div class="flex items-center gap-1.5 sm:hidden">
            <!-- Global UI Toggle on Mobile -->
            <div class="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-mono font-semibold">
              <button
                type="button"
                (click)="atsService.setUiLanguage('pt')"
                [class]="atsService.uiLanguage() === 'pt'
                  ? 'bg-white text-zinc-900 shadow-2xs px-2 py-1 rounded transition-all'
                  : 'text-zinc-500 px-2 py-1 rounded transition-all'">
                🇧🇷 PT
              </button>
              <button
                type="button"
                (click)="atsService.setUiLanguage('en')"
                [class]="atsService.uiLanguage() === 'en'
                  ? 'bg-white text-zinc-900 shadow-2xs px-2 py-1 rounded transition-all'
                  : 'text-zinc-500 px-2 py-1 rounded transition-all'">
                🇺🇸 EN
              </button>
            </div>

            <!-- Mobile LGPD Privacy Icon button -->
            <button
              type="button"
              (click)="openLgpd.emit()"
              title="Termos LGPD"
              class="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center min-w-[32px] min-h-[32px]">
              <mat-icon class="text-sm">lock</mat-icon>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs, Global UI Language Selector & Desktop Privacy Button -->
        <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2.5">
          
          <!-- TOGGLE 1: Global UI Language Toggle on Desktop -->
          <div class="hidden sm:flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-mono font-semibold">
            <button
              id="header-lang-pt-btn"
              type="button"
              (click)="atsService.setUiLanguage('pt')"
              [class]="atsService.uiLanguage() === 'pt'
                ? 'bg-white text-zinc-900 shadow-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1'">
              <span>🇧🇷</span>
              <span>PT-BR</span>
            </button>
            <button
              id="header-lang-en-btn"
              type="button"
              (click)="atsService.setUiLanguage('en')"
              [class]="atsService.uiLanguage() === 'en'
                ? 'bg-white text-zinc-900 shadow-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1'">
              <span>🇺🇸</span>
              <span>EN-US</span>
            </button>
          </div>

          <!-- Navigation Tabs (Matcher vs Test-Suite) -->
          <div class="grid grid-cols-2 sm:flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-medium w-full sm:w-auto">
            <button
              id="tab-matcher-btn"
              type="button"
              (click)="atsService.setTab('matcher')"
              [class]="atsService.activeTab() === 'matcher'
                ? 'bg-white text-zinc-900 shadow-xs px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all font-semibold min-h-[38px] sm:min-h-0'
                : 'text-zinc-600 hover:text-zinc-900 px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[38px] sm:min-h-0'">
              <mat-icon class="text-sm">compare_arrows</mat-icon>
              <span>{{ atsService.uiLanguage() === 'pt' ? 'Análise' : 'Matcher' }}</span>
            </button>
            
            <button
              id="tab-test-suite-btn"
              type="button"
              (click)="atsService.setTab('test-suite')"
              [class]="atsService.activeTab() === 'test-suite'
                ? 'bg-white text-zinc-900 shadow-xs px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all font-semibold min-h-[38px] sm:min-h-0'
                : 'text-zinc-600 hover:text-zinc-900 px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[38px] sm:min-h-0'">
              <mat-icon class="text-sm">verified</mat-icon>
              <span>{{ atsService.uiLanguage() === 'pt' ? 'Testes (8)' : 'Tests (8)' }}</span>
            </button>
          </div>

          <!-- Mobile Live Telemetry Pill -->
          <div class="flex sm:hidden items-center justify-center gap-2 py-1 px-2.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-700 w-full">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span><strong>{{ atsService.totalAudits() }}</strong> {{ atsService.uiLanguage() === 'pt' ? 'análises' : 'audits' }}</span>
            <span class="text-zinc-300">•</span>
            <span><strong>{{ atsService.totalVisits() }}</strong> {{ atsService.uiLanguage() === 'pt' ? 'visitas' : 'visits' }}</span>
          </div>

          <!-- Desktop LGPD button -->
          <button
            id="open-lgpd-modal-header-btn"
            type="button"
            (click)="openLgpd.emit()"
            title="Conformidade LGPD & Privacidade"
            class="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 font-medium transition-colors shrink-0">
            <mat-icon class="text-xs text-emerald-700">lock</mat-icon>
            <span>LGPD / Privacidade</span>
          </button>
        </div>

      </div>
    </header>
  `,
})
export class HeaderComponent {
  atsService = inject(AtsService);
  openLgpd = output<void>();
}
