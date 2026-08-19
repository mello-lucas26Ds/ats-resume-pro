# Match de Currículo ATS (Pareto 20/80 & Anti-AI Slop Engine)

[![Visitantes](https://api.visitorbadge.io/api/visitors?path=mello-lucas26Ds%2Fats-resume-pro&label=TOTAL%20DE%20VISITAS&countColor=%2310b981&style=flat-square)](https://github.com/mello-lucas26Ds/ats-resume-pro)
[![Visualizações](https://komarev.com/ghpvc/?username=mello-lucas26Ds&repo=ats-resume-pro&color=10b981&style=flat-square&label=ACESSOS+AO+VIVO)](https://github.com/mello-lucas26Ds/ats-resume-pro)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-21.0-dd0031.svg?logo=angular)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.1-000000.svg?logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Flash-8e75ff.svg?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🌐 **[English Version](README.md)** | **Português (Brasil)**

Sistema moderno e neutro de triagem técnica preditiva, auditoria de compatibilidade com **Applicant Tracking Systems (ATS)** e diagnóstico de tom de escrita humana versus clichês de inteligência artificial (**Motor das 6 Vertentes Anti-Slop**), com suporte bilíngue (**Português 🇧🇷 / Inglês 🇺🇸**).

---

## 👨‍💻 Autor & Conexões

* **Criador & Engenheiro:** Lucas Mello
* **GitHub:** [https://github.com/mello-lucas26Ds](https://github.com/mello-lucas26Ds)
* **LinkedIn:** [https://www.linkedin.com/in/mello-lucas26/](https://www.linkedin.com/in/mello-lucas26/)
* **Repositório do Projeto:** [https://github.com/mello-lucas26Ds/match-curriculo-ats](https://github.com/mello-lucas26Ds/match-curriculo-ats)

---

## 💡 Filosofia & Proposta de Valor

O sistema **não reescreve o currículo inventando experiências ou métricas fictícias**. Seu objetivo é atuar como um auditor técnico sênior que:

1. **Identifica os 20% da vaga (Pareto)** que concentram 80% do peso da triagem dos recrutadores e algoritmos ATS.
2. **Audita o currículo em busca de evidências factuais**, apontando lacunas reais (*gaps*) e oportunidades de quantificação com números que o próprio candidato alcançou.
3. **Purga o linguajar artificial de IA** usando as 6 vertentes anti-slop, orientando o uso de verbos ativos no passado em 1ª pessoa:
   * **Português (PT-BR):** *Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei, Implementei, Otimizei, Estruturei*.
   * **Inglês (EN-US):** *Built, Configured, Architected, Implemented, Analyzed, Created, Transformed, Loaded, Engineered, Optimized, Structured*.
4. **Gerador e Adaptador de Bullets Bilíngue (Scaffold Anti-Alucinação):** Permite converter e estruturar sentenças de impacto tanto em Português quanto em Inglês para aplicações no Brasil ou no exterior.
5. **Protege a privacidade do usuário** com processamento 100% em memória volátil de sessão, sem banco de dados ou retenção de dados pessoais (**Conformidade total com a LGPD**).

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
* **Rate Limiting:** Proteção de taxa por IP nas rotas de API para impedir abusos e ataques de negação de serviço.
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
```bash
cp .env.example .env
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação em: `http://localhost:3000`

### 5. Executar Linter e Build
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

Este projeto está sob licença [MIT](LICENSE). Desenvolvido com excelência por [Lucas Mello](https://www.linkedin.com/in/mello-lucas26/).
