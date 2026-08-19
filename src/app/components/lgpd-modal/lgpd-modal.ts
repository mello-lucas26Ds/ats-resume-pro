import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lgpd-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (isOpen()) {
      <div
        id="lgpd-modal-backdrop"
        class="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgpd-modal-title">
        
        <div class="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-scale-up">
          
          <!-- Header -->
          <div class="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                <mat-icon class="text-sm">verified_user</mat-icon>
              </div>
              <div>
                <h3 id="lgpd-modal-title" class="text-sm font-semibold text-zinc-900">Política de Privacidade & Termos LGPD</h3>
                <p class="text-xs text-zinc-500">Conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
              </div>
            </div>

            <button
              id="close-lgpd-modal-btn"
              type="button"
              (click)="closeModal()"
              class="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>

          <!-- Body with Legal Text -->
          <div class="p-6 overflow-y-auto space-y-5 text-xs text-zinc-600 leading-relaxed font-sans">
            
            <section class="space-y-1.5">
              <h4 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">1. Princípio da Minimização & Não Retenção</h4>
              <p>
                O <strong>Match de Currículo ATS</strong> foi concebido sob a arquitetura de <em>Privacidade por Design (Privacy by Design)</em>.
                Nenhum dado pessoal, histórico profissional, dados de contato ou textos de vagas são armazenados em banco de dados permanente, cookies de rastreamento ou arquivos em disco.
              </p>
            </section>

            <section class="space-y-1.5">
              <h4 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">2. Processamento em Memória Volátil (Sessão Efêmera)</h4>
              <p>
                O processamento dos textos ocorre exclusivamente em memória RAM durante o ciclo de vida da requisição ativa. Ao fechar a aba ou recarregar a página, todos os dados são instantaneamente descartados.
              </p>
            </section>

            <section class="space-y-1.5">
              <h4 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">3. Finalidade Estrita do Tratamento</h4>
              <p>
                O tratamento das informações limita-se unicamente à finalidade de <strong>comparação algorítmica de competências e triagem ATS</strong> solicitada ativamente pelo titular.
                Os dados nunca serão comercializados, compartilhados com terceiros ou utilizados para treinamento de modelos públicos.
              </p>
            </section>

            <section class="space-y-1.5">
              <h4 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">4. Direitos do Titular (Art. 18 da LGPD)</h4>
              <p>
                Por não realizarmos o armazenamento persistente de dados pessoais, não mantemos perfis cadastrais vinculados ao seu IP ou identidade. O usuário possui total autonomia para limpar seus dados a qualquer momento pelo botão <em>"Limpar"</em>.
              </p>
            </section>

            <section class="space-y-1.5">
              <h4 class="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">5. Segurança da Informação</h4>
              <p>
                Todas as comunicações com o servidor utilizam criptografia de ponta a ponta via HTTPS/TLS 1.3, com cabeçalhos rigorosos de Content Security Policy (CSP) e proteção contra ataques comuns da web.
              </p>
            </section>

          </div>

          <!-- Footer Action -->
          <div class="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
            <span class="text-[11px] text-zinc-500 font-mono">Última atualização: Agosto de 2026</span>
            <button
              id="accept-lgpd-modal-btn"
              type="button"
              (click)="closeModal()"
              class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium text-xs transition-colors shadow-2xs">
              Entendido e Ciente
            </button>
          </div>

        </div>

      </div>
    }
  `,
})
export class LgpdModalComponent {
  isOpen = signal<boolean>(false);

  openModal(): void {
    this.isOpen.set(true);
  }

  closeModal(): void {
    this.isOpen.set(false);
  }
}
