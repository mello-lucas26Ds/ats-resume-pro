# ATS Resume Matcher (Pareto 20/80 & Anti-AI Slop Audit Engine)

[![Visitors](https://api.visitorbadge.io/api/visitors?path=mello-lucas26Ds%2Fats-resume-pro&label=TOTAL%20VISITORS&countColor=%2310b981&style=flat-square)](https://github.com/mello-lucas26Ds/ats-resume-pro)
[![Repo Views](https://komarev.com/ghpvc/?username=mello-lucas26Ds&repo=ats-resume-pro&color=10b981&style=flat-square&label=LIVE+VIEWS)](https://github.com/mello-lucas26Ds/ats-resume-pro)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-21.0-dd0031.svg?logo=angular)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.1-000000.svg?logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Flash-8e75ff.svg?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🇧🇷 **[Versão em Português](README.pt-BR.md)** | **English Version**

A production-grade, privacy-first technical screening system, **Applicant Tracking System (ATS)** compatibility auditor, and **6-Pillar Anti-AI Slop Engine** with native bilingual support (**English 🇺🇸 / Portuguese 🇧🇷**).

---

## 👨‍💻 Author & Engineering

* **Creator & Author:** Lucas Mello
* **GitHub:** [https://github.com/mello-lucas26Ds](https://github.com/mello-lucas26Ds)
* **LinkedIn:** [https://www.linkedin.com/in/mello-lucas26/](https://www.linkedin.com/in/mello-lucas26/)
* **Official Repository:** [https://github.com/mello-lucas26Ds/match-curriculo-ats](https://github.com/mello-lucas26Ds/match-curriculo-ats)

---

## 💡 Core Philosophy & Value Proposition

The platform **never hallucinates or fabricates fake experiences or metrics**. It operates as a senior technical hiring auditor:

1. **Pareto 20/80 Principle:** Isolates the top 20% must-have job requirements that account for 80% of recruiter & ATS filtering weight.
2. **Factual Evidence Audit:** Audits the resume against real-world evidence, pinpointing critical technical gaps and highlighting where the candidate should insert their verified numbers.
3. **6-Pillar Anti-Slop Audit:** Detects and eliminates robotic AI clichés, enforcing active past-tense first-person action verbs:
   * **English (EN-US):** *Built, Configured, Architected, Implemented, Analyzed, Created, Transformed, Loaded, Engineered, Optimized, Structured*.
   * **Portuguese (PT-BR):** *Configurei, Construí, Analisei, Criei, Transformei, Carreguei, Usei, Implementei, Otimizei, Estruturei*.
4. **Actionable Bullet Point Templates:** Provides ready-to-copy 1st-person active sentences with explicit metric placeholders (`[+X% / Y users / Z ms]`) to immediately paste into the resume.
5. **Interactive Anti-Slop Scaffold:** A customizable Mad-Libs style generator to construct bullet points following the formula: `[1st Person Active Verb + Exact Technology + Quantifiable Impact]`.
6. **Privacy by Design (LGPD/GDPR):** 100% ephemeral volatile session memory processing. Zero database persistence, zero personal data retention.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SYSTEM ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   [ CLIENT / ANGULAR 21 FRONTEND ]           [ SERVER / EXPRESS & SERVERLESS ]
   • Dual-Pane Form (Job vs Resume)           • Security Headers (CSP, HSTS)
   • Language Switcher (PT-BR / EN-US)        • In-Memory IP Rate Limiter
   • Strict Character Enforcer (15k / 20k)    • Payload Sanitization & Validation
   • Anti-Flood Cooldown Timer (6s)           • ATS Matching Engine (TOP 20%)
   • Reactive Signals & Tailwind UI           • 6-Pillar Anti-Slop Tone Engine
   • Interactive Bullet Scaffold              • Automated 8-Test Suite Runner
   • Privacy Terms & LGPD Modal               • Deterministic Offline Fallback
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      ▼
                        [ LLM / HEURISTIC ENGINE ]
                        • Structured JSON Schema
                        • Zero-Latency Offline Fallback
```

---

## 🛡️ Security & Privacy Compliance

* **Zero Data Retention:** No candidate resume text or job description is persisted to disk or external databases.
* **Hardened Security Headers:** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`.
* **In-Memory Rate Limiting:** IP-based rate limiting on all API routes to prevent DoS attacks.
* **Strict Payload Caps:** Max 15,000 characters for job descriptions and 20,000 characters for resumes.
* **LGPD / GDPR Compliance:** Strictly adheres to purpose limitation, data minimization, and transparency principles.

---

## 📋 Prerequisites

* **Node.js**: Version `>= 20.x`
* **NPM**: Version `>= 10.x`
* **Gemini API Key (Optional):** Available from [Google AI Studio](https://aistudio.google.com/app/apikey). If not provided, the engine runs seamlessly on the built-in deterministic heuristic engine.

---

## 🚀 Local Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mello-lucas26Ds/match-curriculo-ats.git
cd match-curriculo-ats
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at: `http://localhost:3000`

### 5. Run Linter & Production Build
```bash
npm run lint
npm run build
```

---

## ☁️ Deployment on Vercel

### Method 1: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Method 2: Vercel Web Dashboard (GitHub Integration)
1. Import repository `mello-lucas26Ds/match-curriculo-ats` into Vercel.
2. In **Environment Variables**, add `GEMINI_API_KEY` (optional) and `NODE_ENV=production`.
3. Click **Deploy**.

---

## 📄 License

Distributed under the [MIT](LICENSE) License. Crafted with precision by [Lucas Mello](https://www.linkedin.com/in/mello-lucas26/).
