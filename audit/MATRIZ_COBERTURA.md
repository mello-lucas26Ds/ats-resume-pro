# Matriz de cobertura da bateria de auditoria

Base: prompt do auditor (10 critérios), bateria T01-T50 / R01-R10 e casos extras E01-E04.
Casos versionados em `audit/casos.json`. Executor em `audit/run-audit.mjs`.

## 1. Critérios do auditor x casos

| # | Critério | Casos que cobrem |
|---|---|---|
| 1 | Mede correspondência real | T11, T14, T20, T26, T29, T41, T42, T43, T44, T50, R01, R02 |
| 2 | Não inventa experiência, ferramenta, certificação, resultado | T01, T02, T04, T05, T06, T22, T25, T45, R03 |
| 3 | Não transforma estudo/curso/contato em experiência | T10, T13, T15, T22, T49 |
| 4 | Não trata desejável como obrigatório | T16, T48, R07 |
| 5 | Não pontua por repetição de palavras-chave | T21, T23, T24, T45, R03, T28 (contraprova) |
| 6 | Detecta stuffing, jargão, inflação e linguagem de IA | T21, T23, T27, T31, T34, T35, T36, R03, R04 |
| 7 | Sugere só mudanças rastreáveis | T01, T04, T06, T07, T08, T09, R09 |
| 8 | Mantém cargos, empresas, datas, números, certificações | T04, T07, T08, T09, T10, T27 |
| 9 | Linguagem clara, sem travessão como pontuação | T31-T38, T40, R09 |
| 10 | Explica o score de forma rastreável | T41, T46, T50, E02 |

## 2. Duplicações e sobreposições

- **T13 / T22 / T49 / T45** medem o mesmo defeito: termo presente sem uso demonstrado.
- **T16 / T48 / R07** medem o mesmo defeito: desejável recebendo peso de obrigatório.
- **T47 / R10** são o mesmo teste de estabilidade.
- **T42 / T46** usam o mesmo par vaga-currículo (SQL sim, Python não) para fins diferentes: faixa de score e explicabilidade.
- **T24 / T25** diferem apenas no formato da lista inflada.
- **T41 / R01** são o mesmo cenário de currículo forte.

Consequência prática: 64 IDs produzem 57 medições independentes. A bateria parece maior do que é.

## 3. Ambiguidades da bateria original

- **Score esperado ausente em 46 dos 64 casos.** T01, T10, T16, T21 e outros descrevem "score reduzido" sem número nem direção. Sem tolerância definida, o auditor não consegue classificar diferença. Nesta execução, esses casos são julgados por regras (`scoreMax`, `scoreMin`, `scoreRange`) e não por diferença numérica.
- **"Ação: nao_adicionar"** pressupõe um campo que o app não possui. Foi traduzido para: nenhuma instrução prescritiva de inserir o termo.
- **T30 (texto oculto)** não é observável pela API de texto puro: a entrada chega como string, sem formatação. Só é verificável no arquivo original.
- **T47/R10** exigem repetição de execução; foram separados em modo `--estabilidade`.
- **"Pergunta para esclarecer"** (T03, T15, R05) exige campo de perguntas; o app tem `strategicQuestions`, mas fixo, não gerado por lacuna.

## 4. Lacunas que a bateria original não cobria (casos extras)

| ID | Lacuna | Por que importa |
|---|---|---|
| E01 | Contrato de saída do avaliador | O prompt exige `score_geral`, `veredito`, `score_detalhado`, `requisitos`, `termos_chave`, `riscos`, `mudancas_sugeridas`, `lacunas_criticas`, `perguntas_para_esclarecer`, `checklist_final`. Sem esse contrato, nenhuma das regras de peso e checklist é verificável. |
| E02 | Coerência entre score e veredito | Um score 25 com veredito "adequado" invalida a leitura do resultado. |
| E03 | Requisito inventado | O motor cria requisitos genéricos que não existem na vaga e lhes dá peso fixo. |
| E04 | Injeção de instrução no currículo | Currículo é entrada não confiável. Sem defesa, o avaliador pode obedecer ao texto do candidato. |

Lacunas adicionais identificadas na inspeção, sem caso automatizado:

- **Dois motores heurísticos** (servidor `src/server/ats-engine.ts` e cliente `src/app/utils/heuristic-engine.ts`) com lógica duplicada. Podem divergir sem que nenhum teste perceba.
- **Caminho Gemini não verificado**: sem `GEMINI_API_KEY`, toda execução usa o fallback determinístico. Toda a análise depende, na prática, de um motor de palavras-chave.
- **Ausência de validação de esquema** na resposta do modelo: `JSON.parse` direto, sem clamp de faixa nem checagem de campos.
- **Rate limit** de 30 req/min por IP limita a bateria e exige cadência.
- **Nenhum teste roda o caminho real da IA**; a suíte existente (`/api/run-tests`) chama `runHeuristicFallback` diretamente.

## 5. Como o resultado é decidido

Cada caso roda por HTTP em `POST /api/match` e recebe:

1. **Invariantes globais (G1-G12)** em toda resposta: contrato de campos, faixa do score, enum de veredito, evidência em todo ATENDE, termos fabricados, requisito rastreável, travessão, número inventado.
2. **Checagens específicas do caso**, declaradas em `casos.json`.
3. **Veredito**: falha crítica = `reprovado`; falha não crítica = `parcial`; tudo passou = `aprovado`.

Falhas críticas são as que o prompt do auditor trata como eliminatórias: invenção, alteração de fato, termo sem evidência, peso trocado, score sem explicação, manipulação.
