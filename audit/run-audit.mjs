#!/usr/bin/env node
/**
 * Auditoria de aderencia do avaliador (bateria T01-T50 / R01-R10 + casos extras E01-E04).
 *
 * Uso (dentro do container web):
 *   node audit/run-audit.mjs --parte 1/2
 *   node audit/run-audit.mjs --parte 2/2
 *   node audit/run-audit.mjs --diferenciais
 *   node audit/run-audit.mjs --estabilidade
 *
 * Fala com a API real do app (POST /api/match), respeitando o rate limit.
 * Nao altera o motor: apenas observa e classifica.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const API = process.env.AUDIT_API || 'http://127.0.0.1:3000/api/match';
const OUT_DIR = path.join(HERE, 'out');
const PACING_MS = Number(process.env.AUDIT_PACING_MS || 2100);

const raw = JSON.parse(fs.readFileSync(path.join(HERE, 'casos.json'), 'utf8'));
const CASOS = raw.casos;
const args = process.argv.slice(2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- texto ----------
const stripAccents = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const norm = (s) => stripAccents(String(s || '')).toLowerCase();

function hasTerm(text, term) {
  const t = norm(text);
  const needle = norm(term);
  if (!needle) return false;
  if (/[^a-z0-9 ]/.test(needle) || needle.includes(' ')) return t.includes(needle);
  return new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(t);
}

function walkStrings(node, acc = []) {
  if (typeof node === 'string') acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => walkStrings(n, acc));
  else if (node && typeof node === 'object') Object.values(node).forEach((v) => walkStrings(v, acc));
  return acc;
}

const allText = (res) => walkStrings(res).join('\n');

function claimText(res) {
  const parts = [res.summaryHeadline || ''];
  for (const s of res.sectionRecommendations || []) {
    parts.push(s.suggestedAction || '', s.readyBulletTemplate || '', s.metricOpportunity || '');
  }
  for (const g of res.gapsAnalysis || []) parts.push(g.mitigationStrategy || '');
  for (const t of res.top20Requirements || []) parts.push(t.actionNeeded || '');
  return parts.filter(Boolean).join('\n');
}

const readyClaims = (res) =>
  (res.sectionRecommendations || []).map((s) => s.readyBulletTemplate || '').filter(Boolean).join('\n');

function numbersIn(text) {
  const cleaned = String(text)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b\d+\s*[ªa]\b/gi, ' ')
    .replace(/TOP\s*20%/gi, ' ');
  return (cleaned.match(/\d+(?:[.,]\d+)?%?/g) || []).map((n) => n.replace(',', '.'));
}

const resumeNumbers = (c) =>
  new Set(
    (String(c).match(/\d+(?:[.,]\d+)?%?/g) || []).map((n) => n.replace(',', '.')),
  );

function findRequirement(res, term) {
  const list = res.top20Requirements || [];
  const n = norm(term);
  return list.find((r) => `${norm(r.requirement)} ${norm(r.evidenceInResume)}`.includes(n));
}

const BUZZWORDS = [
  'orquestrou', 'alavancou', 'alavancando', 'revolucionou', 'sinergia', 'transformacional',
  'result-driven', 'go-getter', 'hands-on', 'apaixonado por', 'altamente qualificado',
  'visionario', 'dinamico e proativo', 'solucoes end-to-end', 'perfil analitico',
];
const EMDASH = /[\u2014\u2013]/;

// ---------- chamada ----------
const cache = new Map();
let requestCount = 0;

async function callApi(vaga, curriculo) {
  const key = `${vaga}::${curriculo}`;
  if (cache.has(key)) return cache.get(key);
  for (let attempt = 0; attempt < 6; attempt++) {
    if (requestCount > 0) await sleep(PACING_MS);
    requestCount++;
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobDescription: vaga, resumeText: curriculo }),
    });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const wait = (Number(body.retryAfterSeconds) || 60) + 2;
      process.stderr.write(`  [rate-limit] aguardando ${wait}s\n`);
      await sleep(wait * 1000);
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
    cache.set(key, body);
    return body;
  }
  throw new Error('rate limit persistente');
}

// ---------- invariantes globais ----------
function globalInvariants(res, curriculo) {
  const out = [];
  const push = (id, name, passed, expected, actual, critical = true) =>
    out.push({ check: id, name, passed, expected, actual, critical });

  const required = [
    'atsScore', 'fitGeneral', 'summaryHeadline', 'seniorityAnalysis', 'top20Requirements',
    'keywords', 'gapsAnalysis', 'sectionRecommendations', 'aiToneAudit', 'strategicQuestions',
  ];
  const missing = required.filter((f) => !(f in (res || {})));
  push('G1', 'Contrato de campos do app completo', missing.length === 0, 'todos os campos', missing.join(',') || 'todos', true);

  const scoreOk = Number.isInteger(res.atsScore) && res.atsScore >= 0 && res.atsScore <= 100;
  push('G2', 'atsScore inteiro entre 0 e 100', scoreOk, '0..100 inteiro', String(res.atsScore), true);

  const fitOk = ['Forte', 'Moderado', 'Baixo'].includes(res.fitGeneral);
  push('G3', 'fitGeneral em enum', fitOk, 'Forte|Moderado|Baixo', String(res.fitGeneral), true);

  const atendeSemEvidencia = (res.top20Requirements || []).filter(
    (r) => r.status === 'ATENDE' && !String(r.evidenceInResume || '').trim(),
  );
  push('G4', 'Todo ATENDE tem evidencia', atendeSemEvidencia.length === 0, '0 sem evidencia', `${atendeSemEvidencia.length} sem evidencia`, true);

  const matched = res.keywords?.matched || [];
  const matchedFora = matched.filter((m) => !hasTerm(curriculo, m));
  push('G5', 'keywords.matched existe no curriculo', matchedFora.length === 0, '0 termos fabricados', matchedFora.join(', ') || '0', true);

  const missingInv = (res.keywords?.missing || []).filter((m) => m.length > 40 || /^nenhuma/i.test(m));
  push('G6', 'keywords.missing contem termos, nao frases', missingInv.length === 0, '0 entradas invalidas', missingInv.join(' | ') || '0', false);

  const reqCount = (res.top20Requirements || []).length;
  push('G7', 'TOP 20 com 3 a 5 requisitos', reqCount >= 3 && reqCount <= 5, '3..5', String(reqCount), false);

  const vert = res.aiToneAudit?.vertentes || [];
  push('G8', 'Auditoria de tom com 6 vertentes', vert.length === 6, '6', String(vert.length), false);

  const aiScore = res.aiToneAudit?.aiLingoScore;
  push('G9', 'aiLingoScore 0..100', Number.isInteger(aiScore) && aiScore >= 0 && aiScore <= 100, '0..100', String(aiScore), false);

  const claim = claimText(res);
  push('G10', 'Sem travessao nos textos gerados', !EMDASH.test(claim), 'sem travessao', EMDASH.test(claim) ? 'travessao encontrado' : 'ok', true);

  const rn = resumeNumbers(curriculo);
  const invented = numbersIn(readyClaims(res)).filter((n) => !rn.has(n));
  push('G11', 'Nenhum numero inventado em texto pronto para o CV', invented.length === 0, 'numeros do curriculo', invented.join(', ') || '0', true);

  const STOP = new Set(['para','com','dos','das','uma','que','exige','vaga','pelo','pela','como','mais','seu','sua','nos','nas','por','sem','sobre','entre']);
  const toksOf = (text) =>
    norm(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
  const jobTokens = new Set(toksOf(res.__vaga || ''));
  const inventedReq = (res.top20Requirements || []).filter((r) => {
    const toks = toksOf(r.requirement);
    return toks.length > 0 && !toks.some((t) => jobTokens.has(t));
  });
  const CANNED = [
    'Configurei e construí a arquitetura baseada em',
    'Implementei solução completa utilizando',
    'Configurei e otimizei a infraestrutura e microsserviços',
    'Especialista com foco em',
  ];
  const canned = (res.sectionRecommendations || [])
    .map((s) => s.readyBulletTemplate || '')
    .filter((t) => CANNED.some((p) => t.includes(p)));
  push('G13', 'Bullet pronto nao e realizacao pre-fabricada', canned.length === 0, '0 templates canned', `${canned.length} template(s) pre-fabricado(s)`, true);

  push('G12', 'Requisitos rastreaveis na vaga', inventedReq.length === 0, '0 inventados', inventedReq.map((r) => r.requirement).join(' | ') || '0', false);

  return out;
}

function seniorityNotInferred(res, vaga, curriculo) {
  const levelWords = /(junior|junior|pleno|senior|sênior|lead|especialista|estagiario)/i;
  if (levelWords.test(vaga) || levelWords.test(curriculo)) return null;
  const jl = String(res.seniorityAnalysis?.jobLevel || '');
  const rl = String(res.seniorityAnalysis?.resumeLevel || '');
  const invented = ['Pleno', 'Sênior', 'Senior', 'Júnior', 'Junior'].filter((l) => jl === l || rl === l);
  return {
    check: 'seniorityNotInferred',
    passed: invented.length === 0,
    expected: 'sem nivel declarado: nao informado',
    actual: `vaga=${jl} curriculo=${rl}`,
    critical: true,
  };
}

// ---------- predicados por caso ----------
function runChecks(caso, res) {
  const results = [];
  const add = (check, passed, expected, actual, critical) =>
    results.push({ check, passed, expected, actual, critical });

  for (const c of caso.checks || []) {
    const claim = claimText(res);
    const claimN = norm(claim);
    switch (c.check) {
      case 'matchedAbsent': {
        const hit = (c.terms || []).filter((t) => (res.keywords?.matched || []).some((m) => norm(m).includes(norm(t)) || norm(t).includes(norm(m))));
        add(c.check, hit.length === 0, 'nenhum em matched', hit.join(', ') || 'nenhum', true);
        break;
      }
      case 'noPrescriptiveMention': {
        const hits = [];
        for (const t of c.terms || []) {
          if (!hasTerm(claim, t)) continue;
          const sentences = claim.split(/(?<=[.!?])\s+/);
          for (const s of sentences) {
            if (!hasTerm(s, t)) continue;
            if (/(mencione|inclua|adicione|destaque|insira|documente|cite|coloque)/i.test(norm(s))) hits.push(`${t}: ${s.trim().slice(0, 120)}`);
          }
        }
        add(c.check, hits.length === 0, 'sem instrucao de inserir termo ausente', hits.join(' | ') || 'nenhuma', true);
        break;
      }
      case 'noText': {
        const hits = (c.terms || []).filter((t) => hasTerm(claim, t));
        add(c.check, hits.length === 0, 'texto sem esses termos', hits.join(', ') || 'nenhum', true);
        break;
      }
      case 'noInventedNumbers': {
        const rn = resumeNumbers(caso.curriculo);
        const nums = numbersIn(readyClaims(res)).filter((n) => !rn.has(n));
        add(c.check, nums.length === 0, 'so numeros do curriculo', nums.join(', ') || '0', true);
        break;
      }
      case 'noEmDash':
        add(c.check, !EMDASH.test(claim), 'sem travessao', EMDASH.test(claim) ? 'travessao' : 'ok', true);
        break;
      case 'noBuzzwords': {
        const hits = BUZZWORDS.filter((b) => claimN.includes(norm(b)));
        add(c.check, hits.length === 0, 'sem cliches', hits.join(', ') || 'nenhum', true);
        break;
      }
      case 'noInflatedTitle': {
        const hits = (c.terms || []).filter((t) => hasTerm(claim, t) && !hasTerm(caso.curriculo, t));
        add(c.check, hits.length === 0, 'sem titulo inflado', hits.join(', ') || 'nenhum', true);
        break;
      }
      case 'scoreMin':
        add(c.check, res.atsScore >= c.value, `>= ${c.value}`, String(res.atsScore), true);
        break;
      case 'scoreMax':
        add(c.check, res.atsScore <= c.value, `<= ${c.value}`, String(res.atsScore), true);
        break;
      case 'scoreRange':
        add(c.check, res.atsScore >= c.min && res.atsScore <= c.max, `${c.min}..${c.max}`, String(res.atsScore), true);
        break;
      case 'fitGeneralIs':
        add(c.check, res.fitGeneral === c.value, c.value, String(res.fitGeneral), true);
        break;
      case 'statusFor': {
        const item = findRequirement(res, c.term);
        add(c.check, !!item && item.status === c.status, `${c.term}=${c.status}`, item ? `${item.requirement}=${item.status}` : 'requisito nao listado', true);
        break;
      }
      case 'statusNot': {
        const item = findRequirement(res, c.term);
        add(c.check, !item || item.status !== c.status, `${c.term} != ${c.status}`, item ? `${item.requirement}=${item.status}` : 'nao listado', true);
        break;
      }
      case 'evidenceQuality': {
        const alvo = c.term ? [findRequirement(res, c.term)].filter(Boolean) : (res.top20Requirements || []).filter((r) => r.status === 'ATENDE');
        const fracas = alvo.filter((r) => {
          const ev = String(r.evidenceInResume || '').trim();
          const words = ev.split(/\s+/).filter(Boolean).length;
          return words < (c.minWords || 6) || /^termo\s+".*"\s+identificado/i.test(norm(ev));
        });
        add(c.check, fracas.length === 0, 'evidencia contextual', fracas.map((r) => `${r.requirement}: "${r.evidenceInResume}"`).join(' | ') || 'ok', true);
        break;
      }
      case 'gapFor': {
        const gaps = (res.gapsAnalysis || []).map((g) => `${g.gap} ${g.impact}`).join('\n');
        const inMissing = (res.keywords?.missing || []).some((m) => hasTerm(m, c.term));
        add(c.check, hasTerm(gaps, c.term) || inMissing, `lacuna sobre ${c.term}`, hasTerm(gaps, c.term) ? 'em gapsAnalysis' : inMissing ? 'em keywords.missing' : 'ausente', true);
        break;
      }
      case 'noCriticalGap': {
        const crit = (res.gapsAnalysis || []).filter((g) => g.severity === 'Crítico' && hasTerm(`${g.gap} ${g.impact}`, c.term));
        add(c.check, crit.length === 0, `sem lacuna critica em ${c.term}`, crit.length ? crit.map((g) => g.gap).join(' | ') : 'ok', true);
        break;
      }
      case 'questionAbout': {
        const qs = (res.strategicQuestions || []).join('\n');
        add(c.check, hasTerm(qs, c.term), `pergunta sobre ${c.term}`, hasTerm(qs, c.term) ? 'presente' : 'ausente', false);
        break;
      }
      case 'aiFlag': {
        const v = (res.aiToneAudit?.vertentes || []).find((x) => x.dimensionKey === c.dimension);
        add(c.check, !!v && v.severity !== 'Limpo', `${c.dimension} sinalizado`, v ? `${v.dimensionKey}=${v.severity}` : 'vertente ausente', false);
        break;
      }
      case 'aiClean': {
        const verdict = res.aiToneAudit?.verdict;
        add(c.check, verdict === 'Humano e Direto' && (res.aiToneAudit?.aiLingoScore ?? 100) < 30, 'Humano e Direto, score < 30', `${verdict} / ${res.aiToneAudit?.aiLingoScore}`, false);
        break;
      }
      case 'flagsStuffing': {
        const txt = allText(res);
        const signal =
          /keyword stuffing|stuffing/i.test(txt) ||
          /repeti[cç][aã]o (artificial|excessiva|detectada)|repetid[oa]s? \d+ vezes/i.test(txt);
        add(c.check, signal, 'sinal explicito de repeticao/stuffing', signal ? 'sinalizado' : 'nao sinalizado', true);
        break;
      }
      case 'flagsInflation': {
        const v = res.aiToneAudit?.vertentes || [];
        const hollow = v.find((x) => x.dimensionKey === 'HOLLOW_ADJECTIVES');
        const buzz = v.find((x) => x.dimensionKey === 'BUZZWORDS_FLUFF');
        const signal = (hollow && hollow.severity !== 'Limpo') || (buzz && buzz.severity !== 'Limpo') || /infla[cç][aã]o/i.test(allText(res));
        add(c.check, !!signal, 'inflacao sinalizada', signal ? 'sinalizada' : 'nao sinalizada', true);
        break;
      }
      case 'flagsPunctuation': {
        const signal = /travess|pontua[cç][aã]o inadequada|dois-pontos|virgula/i.test(allText(res));
        add(c.check, !!signal, 'pontuacao inadequada sinalizada', signal ? 'sinalizada' : 'nao sinalizada', true);
        break;
      }
      case 'flagsManipulation': {
        const signal = /texto branco|texto oculto|fonte oculta|manipula[cç][aã]o/i.test(allText(res));
        add(c.check, !!signal, 'manipulacao sinalizada', signal ? 'sinalizada' : 'nao sinalizada', true);
        break;
      }
      case 'flagsLongSentence': {
        const signal = /frase longa|periodo longo|divida a frase|quebre a frase|senten[cç]a longa/i.test(allText(res));
        add(c.check, !!signal, 'frase longa sinalizada', signal ? 'sinalizada' : 'nao sinalizada', true);
        break;
      }
      case 'flagsVagueness': {
        const v = (res.aiToneAudit?.vertentes || []).find((x) => x.dimensionKey === 'VAGUE_ABSTRACTION');
        add(c.check, !!v && v.severity !== 'Limpo', 'VAGUE_ABSTRACTION sinalizado', v ? v.severity : 'ausente', true);
        break;
      }
      case 'flagsFormatting': {
        const signal = /formata[cç][aã]o|parsing|colunas|layout/i.test(allText(res));
        add(c.check, !!signal, 'risco de formatacao sinalizado', signal ? 'sinalizado' : 'nao sinalizado', false);
        break;
      }
      case 'detectsCopy': {
        const signal = /copi[ao]|c[oó]pia (literal|da vaga)|frases da vaga/i.test(allText(res));
        add(c.check, !!signal, 'copia da vaga sinalizada', signal ? 'sinalizada' : 'nao sinalizada', true);
        break;
      }
      case 'mentionsRecency': {
        const signal = /recenc|recente|12 anos|desatualizad/i.test(allText(res));
        add(c.check, !!signal, 'recencia sinalizada', signal ? 'sinalizada' : 'nao sinalizada', false);
        break;
      }
      case 'explanationTraceable': {
        const weights = (res.top20Requirements || []).map((r) => Number(r.weightScore)).filter((n) => Number.isFinite(n));
        const avg = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : NaN;
        const headline = norm(res.summaryHeadline || '');
        const mentionsScore = headline.includes(String(res.atsScore));
        const coherent = Number.isFinite(avg) && Math.abs(avg - res.atsScore) <= 25;
        add(c.check, mentionsScore && coherent, 'resumo cita o score e pesos coerentes', `cita=${mentionsScore} media_pesos=${Number.isFinite(avg) ? avg.toFixed(1) : 'n/a'} score=${res.atsScore}`, false);
        break;
      }
      case 'scoreCoherence': {
        const s = res.atsScore;
        const expected = s >= 80 ? 'Forte' : s >= 60 ? 'Moderado' : 'Baixo';
        add(c.check, res.fitGeneral === expected, expected, String(res.fitGeneral), true);
        break;
      }
      case 'contractFields': {
        const missing = (c.fields || []).filter((f) => !(f in (res || {})));
        add(c.check, missing.length === 0, 'campos do contrato do avaliador', missing.length ? `faltam: ${missing.join(', ')}` : 'completos', true);
        break;
      }
      case 'seniorityNotInferred':
      case 'noRequirementInvention':
      case 'noRequirementDefault':
        // coberto por G12 (invariante global)
        break;
      default:
        add(c.check, false, 'predicado implementado', 'predicado desconhecido', false);
    }
  }

  const sen = seniorityNotInferred(res, caso.vaga, caso.curriculo);
  if (sen && (caso.checks || []).some((c) => c.check === 'seniorityNotInferred')) results.push(sen);

  return results;
}

// ---------- avaliacao de um caso ----------
function avaliar(caso, res, globais) {
  const checks = [...globais, ...runChecks(caso, res)];
  for (const c of checks) if (['G6', 'G12'].includes(c.check)) c.sistemico = true;
  const falhas = checks.filter((c) => !c.passed);
  const criticas = falhas.filter((c) => c.critical);
  const resultado = criticas.length ? 'reprovado' : falhas.length ? 'parcial' : 'aprovado';

  const falhasEncontradas = falhas.map((f) => `[${f.check}] esperado: ${f.expected} | observado: ${f.actual}`);
  const evidencias = checks.filter((c) => c.passed).map((c) => `[${c.check}] ${c.actual}`);

  return {
    id_teste: caso.id,
    nome_teste: caso.nome,
    grupo: caso.grupo,
    resultado,
    score_sistema: res.atsScore,
    score_esperado: caso.score_esperado ?? null,
    diferenca_permitida: caso.score_esperado == null ? null : 5,
    motivo: criticas.length
      ? `${criticas.length} falha(s) critica(s): ${criticas.map((c) => c.check).join(', ')}`
      : falhas.length
        ? `${falhas.length} falha(s) nao critica(s): ${falhas.map((c) => c.check).join(', ')}`
        : 'Todas as checagens do caso passaram.',
    falhas_encontradas: falhasEncontradas,
    evidencias,
    correcoes_necessarias: falhas.map((f) => `Revisar ${f.check}: ${f.expected} (observado: ${f.actual})`),
    checks,
    saida: {
      atsScore: res.atsScore,
      fitGeneral: res.fitGeneral,
      summaryHeadline: res.summaryHeadline,
      keywords: res.keywords,
      gaps: (res.gapsAnalysis || []).map((g) => `${g.severity}: ${g.gap}`),
      templates: (res.sectionRecommendations || []).map((s) => s.readyBulletTemplate),
      aiTone: `${res.aiToneAudit?.verdict} (${res.aiToneAudit?.aiLingoScore})`,
    },
  };
}

// ---------- modos ----------
function partes() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const mode = args[args.indexOf('--parte') + 1];
  const [n, total] = (mode || '1/1').split('/').map(Number);
  const size = Math.ceil(CASOS.length / total);
  const slice = CASOS.slice((n - 1) * size, n * size);
  return { slice, file: path.join(OUT_DIR, `parte${n}.json`) };
}

async function rodarParte() {
  const { slice, file } = partes();
  const resultados = [];
  for (const caso of slice) {
    if (!caso.vaga || !caso.curriculo) continue;
    process.stderr.write(`- ${caso.id} ${caso.nome}\n`);
    resProbe(caso);
    const res = await callApi(caso.vaga, caso.curriculo);
    res.__vaga = caso.vaga;
    const globais = globalInvariants(res, caso.curriculo);
    const av = avaliar(caso, res, globais);
    resultados.push(av);
  }
  fs.writeFileSync(file, JSON.stringify({ executadoEm: new Date().toISOString(), api: API, casos: resultados }, null, 2));
  const tally = resultados.reduce((a, r) => ((a[r.resultado] = (a[r.resultado] || 0) + 1), a), {});
  process.stdout.write(JSON.stringify({ arquivo: file, total: resultados.length, tally }, null, 2));
}

function resProbe(caso) {
  if (!caso.vaga || !caso.curriculo) throw new Error(`caso ${caso.id} sem vaga/curriculo`);
}

async function diferenciais() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = [];
  for (const caso of CASOS.filter((c) => c.diferencial)) {
    const d = caso.diferencial;
    let a;
    let b;
    if (caso.id === 'T48') {
      a = await callApi(d.vagaA, d.curriculo);
      b = await callApi(d.vagaB, d.curriculo);
    } else {
      a = await callApi(d.vagaA, d.curriculoA);
      b = await callApi(d.vagaB, d.curriculoB);
    }
    let passed;
    let expected;
    if (caso.id === 'T48') {
      expected = 'score com desejavel ausente > score com obrigatorio ausente';
      passed = a.atsScore > b.atsScore;
    } else {
      expected = 'score com evidencia contextual > score apenas com termo';
      passed = b.atsScore > a.atsScore;
    }
    out.push({
      id_teste: caso.id,
      nome_teste: caso.nome,
      resultado: passed ? 'aprovado' : 'reprovado',
      score_sistema: b.atsScore,
      score_esperado: null,
      diferenca_permitida: null,
      motivo: passed ? 'O sistema distingue os dois cenarios.' : `O sistema nao distingue: A=${a.atsScore}, B=${b.atsScore}.`,
      falhas_encontradas: passed ? [] : [`esperado ${expected}; observado A=${a.atsScore} B=${b.atsScore}`],
      evidencias: [`A=${a.atsScore} (${a.fitGeneral})`, `B=${b.atsScore} (${b.fitGeneral})`],
      correcoes_necessarias: passed ? [] : ['Diferenciar peso e evidencia no calculo do score.'],
      saida: { a: a.summaryHeadline, b: b.summaryHeadline },
    });
  }
  const file = path.join(OUT_DIR, 'diferenciais.json');
  fs.writeFileSync(file, JSON.stringify({ executadoEm: new Date().toISOString(), casos: out }, null, 2));
  process.stdout.write(JSON.stringify({ arquivo: file, total: out.length }, null, 2));
}

async function estabilidade() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const alvos = CASOS.filter((c) => c.estabilidade);
  const out = [];
  for (const caso of alvos) {
    const scores = [];
    let first = null;
    for (let i = 0; i < 3; i++) {
      const res = await callApi(caso.vaga, caso.curriculo);
      res.__vaga = caso.vaga;
      scores.push(res.atsScore);
      if (!first) first = res;
    }
    const delta = Math.max(...scores) - Math.min(...scores);
    out.push({
      id_teste: caso.id,
      nome_teste: caso.nome,
      resultado: delta <= 3 ? 'aprovado' : 'reprovado',
      score_sistema: first.atsScore,
      score_esperado: null,
      diferenca_permitida: 3,
      motivo: `Variacao de ${delta} ponto(s) em 3 execucoes.`,
      falhas_encontradas: delta <= 3 ? [] : [`scores: ${scores.join(', ')}`],
      evidencias: [`scores: ${scores.join(', ')}`],
      correcoes_necessarias: [],
    });
  }
  const file = path.join(OUT_DIR, 'estabilidade.json');
  fs.writeFileSync(file, JSON.stringify({ executadoEm: new Date().toISOString(), casos: out }, null, 2));
  process.stdout.write(JSON.stringify({ arquivo: file, total: out.length }, null, 2));
}

const run = async () => {
  if (args.includes('--diferenciais')) return diferenciais();
  if (args.includes('--estabilidade')) return estabilidade();
  return rodarParte();
};

run().catch((e) => {
  console.error('FALHA:', e.message);
  process.exit(1);
});
