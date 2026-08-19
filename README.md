# Match de Currículo ATS (Pareto 20/80 & Anti-AI Slop Engine)

Sistema moderno e neutro de triagem técnica preditiva, auditoria de compatibilidade com **Applicant Tracking Systems (ATS)** e diagnóstico de tom de escrita humana vs. clichês de inteligência artificial (Motor das 6 Vertentes), com suporte bilíngue (**Português 🇧🇷 / Inglês 🇺🇸**).

---

## 👨‍💻 Autor & Conexões

* **Criado por:** Lucas Mello
* **GitHub:** [https://github.com/mello-lucas26Ds](https://github.com/mello-lucas26Ds)
* **LinkedIn:** [https://www.linkedin.com/in/mello-lucas26/](https://www.linkedin.com/in/mello-lucas26/)
* **Repositório Oficial:** [https://github.com/mello-lucas26Ds/match-curriculo-ats](https://github.com/mello-lucas26Ds/match-curriculo-ats)

---

## 💡 Visão Geral & Filosofia

O sistema **não reescreve o currículo inventando experiências ou métricas fictícias**. Seu objetivo é atuar como um auditor sênior que:
1. **Identifica os 20% da vaga (Pareto)** que concentram 80% do peso da triagem dos recrutadores.
2. **Audita o currículo em busca de evidências factuais**, apontando lacunas reais e oportunidades de quantificação com números que o próprio candidato alcançou.
3. **Purga o linguajar artificial de IA** usando as 6 vertentes anti-slop, orientando o uso de verbos ativos no passado em 1ª pessoa:
   * **Português (PT-BR):** *Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei, Implementei, Otimizei*.
   * **Inglês (EN-US):** *Built, Configured, Architected, Implemented, Analyzed, Created, Transformed, Loaded, Engineered, Optimized*.
4. **Gerador e Adaptador de Bullets Bilíngue (Mad Libs):** Permite converter e estruturar sentenças de impacto tanto em Português quanto em Inglês para aplicações no Brasil ou no exterior.
5. **Protege a privacidade do usuário** com processamento 100% em memória volátil de sessão, sem banco de dados ou retenção de dados pessoais (Conformidade total com a LGPD).

---

## 🏛️ Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ARQUITETURA DO SISTEMA                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   [ CLIENTE / FRONTEND ANGULAR 21 ]          [ SERVIDOR EXPRESS / SERVERLESS ]
   • Formulário Dual-Pane (Vaga vs CV)        • Headers de Segurança (CSP, HSTS)
   • Toggle de Idioma (PT-BR / EN-US)         • Rate Limiter em Memória (Anti-DoS)
   • Limitador de Caracteres (15k / 20k)      • Sanitização e Validação de Payload
   • Cooldown Anti-Flood (6s)                 • Motor de Matching ATS (TOP 20%)
   • Dashboard Reativo (Signals & Tailwind)   • Auditoria de 6 Vertentes Anti-Slop
   • Scaffold Interativo (Mad Libs Bilíngue)  • Suíte de 8 Testes Automatizados
   • Modal de Termos LGPD e Privacidade       • Fallback Heurístico Instantâneo
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      ▼
                        [ LLM / MOTOR HEURÍSTICO ]
                        • Schema JSON Determinístico
                        • Fallback Instantâneo Offline
```

---

## 🛡️ Segurança & Conformidade LGPD

* **Zero Retenção de Dados:** Nenhum dado pessoal, currículo ou texto de vaga é persistido em banco de dados ou disco.
* **Segurança de Cabeçalhos (Helmet Pattern):** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`.
* **Rate Limiting:** Proteção de taxa por IP nas rotas de API para impedir ataques de negação de serviço.
* **Limites Rígidos de Caracteres:** Máximo de 15.000 caracteres para a vaga e 20.000 para o currículo.
* **LGPD (Lei 13.709/2018):** Atendimento estrito aos princípios da finalidade, minimização e transparência (Art. 18).

---

## 📋 Pré-requisitos

* **Node.js**: Versão `>= 20.x`
* **NPM**: Versão `>= 10.x`
* **Chave de API Gemini (Opcional):** Pode ser obtida gratuitamente em [Google AI Studio](https://aistudio.google.com/app/apikey). Se não for fornecida, o sistema opera automaticamente com o **motor heurístico de contingência**.

---

## 🚀 Instalação e Execução Local

### 1. Clonar o Repositório
```bash
git clone https://github.com/mello-lucas26Ds/match-curriculo-ats.git
cd match-curriculo-ats
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e preencha conforme necessário:
```bash
cp .env.example .env
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação em: `http://localhost:3000`

### 5. Executar Linter e Testes
```bash
npm run lint
npm run build
```

---

## ☁️ Deploy na Vercel

### Método 1: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Método 2: Deploy via Painel da Vercel (GitHub Integration)
1. Conecte o repositório `mello-lucas26Ds/match-curriculo-ats` na Vercel.
2. Em **Environment Variables**, adicione `GEMINI_API_KEY` (opcional) e `NODE_ENV=production`.
3. Clique em **Deploy**.

---

## 📄 Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).
Criado por [Lucas Mello](https://www.linkedin.com/in/mello-lucas26/).
