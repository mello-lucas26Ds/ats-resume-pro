# Guia de Contribuição - Match de Currículo ATS

Agradecemos o interesse em contribuir com o projeto! Este documento estabelece as diretrizes para manter o código limpo, seguro e em conformidade com as regras de integridade do sistema.

---

## 🛠️ Ambiente de Desenvolvimento Local

1. **Pré-requisitos**: Node.js `>= 20.x` e NPM `>= 10.x`.
2. **Instalação**:
   ```bash
   git clone https://github.com/SEU_USUARIO/match-curriculo-ats.git
   cd match-curriculo-ats
   npm install
   cp .env.example .env
   ```
3. **Execução**:
   ```bash
   npm run dev
   ```

---

## 📜 Padrões de Código & Qualidade

Antes de abrir qualquer Pull Request, você **deve** executar:

1. **Linter**: `npm run lint` (0 warnings, 0 errors).
2. **Compilação**: `npm run build` (garantir que não há erros de tipagem estrita).
3. **Regras de Veracidade**: O motor **nunca** deve incentivar a geração de dados fictícios ou alucinações.
4. **Regra Linguística**: Sugestões de redação de currículo devem sempre utilizar **verbos ativos no passado em 1ª pessoa** (*Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei, Implementei, Otimizei*).

---

## 📝 Mensagens de Commit (Conventional Commits)

Utilizamos o padrão de commits convencionais:

* `feat:` para novas funcionalidades (ex: `feat: adicionar suporte a exportação em PDF`)
* `fix:` para correção de bugs (ex: `fix: ajustar calculo de densidade de palavras-chave`)
* `docs:` para alterações em documentação (ex: `docs: atualizar README com guia da Vercel`)
* `refactor:` para refatorações de código sem alteração de comportamento
* `security:` para ajustes de segurança, headers e conformidade LGPD

---

## 🔒 Segurança e Dados Sensíveis

* **Nunca** comite arquivos `.env`, chaves de API ou segredos.
* Todas as variáveis novas devem ser documentadas no `.env.example`.
