# Auditoria da bateria de aderência

Bateria versionada que mede se o avaliador de currículo distingue evidência de ausência, mantém fatos e não inventa conteúdo.

## Conteúdo

- `casos.json` — 64 casos (T01–T50, R01–R10, E01–E04) com vaga, currículo e checagens declarativas.
- `run-audit.mjs` — executor: chama `POST /api/match` real e aplica os oráculos.
- `MATRIZ_COBERTURA.md` — critérios do auditor, duplicações e lacunas da bateria original.
- `RELATORIO.md` — resultado da execução registrada.
- `out/` — saídas por lote (`parte1.json`, `parte2.json`, `diferenciais.json`, `estabilidade.json`, `consolidado.json`).

## Como rodar

Dentro do container web (a API precisa estar de pé):

```sh
node audit/run-audit.mjs --parte 1/2
node audit/run-audit.mjs --parte 2/2
node audit/run-audit.mjs --diferenciais
node audit/run-audit.mjs --estabilidade
```

Opções por ambiente:

- `AUDIT_API` — URL do endpoint (padrão `http://127.0.0.1:3000/api/match`).
- `AUDIT_PACING_MS` — intervalo entre requisições (padrão 2100 ms, por causa do limite de 30 req/min).

## Como o veredito é formado

1. Invariantes globais em toda resposta: contrato de campos, faixa do score, evidência em todo `ATENDE`, termos fabricados, requisito rastreável na vaga, travessão, número inventado, bullet pré-fabricado.
2. Checagens específicas declaradas em `casos.json`.
3. Falha crítica = `reprovado`; falha não crítica = `parcial`; tudo passou = `aprovado`.

Os invariantes `G6` e `G12` são marcados como sistêmicos: entram no relatório, mas não decidem o veredito do caso, para não mascarar o critério que o caso mede.

## Limitação conhecida

Sem `GEMINI_API_KEY`, a execução usa o motor heurístico. Os resultados não descrevem o caminho da IA.
