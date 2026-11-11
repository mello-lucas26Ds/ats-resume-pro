# Relatório de auditoria do avaliador de aderência

**Executado em:** 2026-11-11, no sandbox Base44
**Branch:** `resume-evaluator-prompt` (HEAD `cb8c3b6`, com as correções desta rodada)
**Caminho testado:** `POST /api/match` real, porta 3000, container `app-web-1`
**Motor exercitado:** determinístico (`src/app/utils/evidence-engine.ts`), único caminho ativo
**Bateria:** T01–T50, R01–R10, E01–E04 (62 casos) + T48/T49 (diferenciais) + T47/R10 (estabilidade)
**Artefatos:** `audit/casos.json`, `audit/run-audit.mjs`, `audit/out/parte1.json`, `audit/out/parte2.json`, `audit/out/diferenciais.json`, `audit/out/estabilidade.json`, `audit/out/consolidado.json`, `audit/MATRIZ_COBERTURA.md`

---

## 1. Veredito

**Aprovado.** Todos os 62 casos da bateria passaram sem violação crítica, e os quatro casos complementares (dois diferenciais e dois de estabilidade) também passaram.

| Medida | Resultado |
|---|---|
| Aprovado no critério do caso | **62 de 62 (100%)** |
| Parcial | 0 de 62 |
| Reprovado | 0 de 62 |
| Falhas críticas (invariantes) | **0** |
| Diferenciais T48 e T49 | **2 de 2 aprovados** |
| Estabilidade T47 e R10 | **2 de 2 aprovados** (variação 0) |
| Suíte interna do app (`/api/run-tests`) | **8 de 8 aprovados** |

O critério de 95% foi atingido sem afrouxar o oráculo: nenhum caso, checagem ou invariante foi removido. As correções são no motor.

---

## 2. Defeitos P0 corrigidos

| Defeito anterior | Correção aplicada | Evidência |
|---|---|---|
| S3/S4: bullets prontos inventavam projeto, ação e resultado | Nenhum texto de exemplo afirma ação, projeto ou resultado. O bullet vem de uma frase real do currículo; sem evidência, entrega apenas um modelo com campos entre colchetes | T06, T07, T08, T09, T10, T27, T43, T44, G13 |
| S2: requisitos fixos (`Autonomia e Entrega...`, `Práticas de Testes...`) em toda análise | Requisitos derivados apenas da vaga. Itens sem nenhum token rastreável na vaga foram eliminados; o TOP 20 é limitado a 5 | T02, T05, T15, T27, E03, G12 |
| S5: `matched` fabricado (`Experiência Geral`) | Listas `matched`/`missing` são vazias quando não há termo; nada é preenchido por padrão | T01, T25, G5 |
| S6: `missing` recebia uma frase inteira | `missing` contém apenas chaves de termos curtos; o campo aceita lista vazia | T03, T16, G6 |
| S7/S11: presença da palavra valia como uso demonstrado | Status exige contexto: verbo de ação, marcador de experiência, estudo, lista ou título são classificados de forma distinta | T11, T13, T22, T26, T45, T49 |
| S8: negação lida como afirmação | Negação é detectada na ocorrência do termo (`não utilizei X`, `sem experiência com X`, `nem X`) e zera a evidência | T42, T46 |
| S9: score fixo 64 quando nada casava | Sem requisito reconhecido, o score é 0 (Baixo). Não existe mais o default 0,75 | T43, T44, R02 |
| S10: desejável pesava como obrigatório | Peso 3 para Inegociável, 2 para Importante e 0,5 para Diferencial. A severidade da lacuna também muda | T16, T48, R07 |
| S12: detecções previstas não existiam | Foram adicionados stuffing por repetição/frase/lista, cópia literal da vaga, travessão, frase longa, vagueza, texto oculto declarado, risco de formatação, recência e inflação de título | T21, T23, T24, T30, T32, T33, T36, T37, T38, R03, R08 |
| S13: vocabulário restrito a engenharia de software | Vocabulário ampliado para idiomas, certificações, Power BI, Excel, CRM, gestão de projetos, migração, análise de dados, BI e afins | T02, T03, T17, T20, T29 |
| S14: senioridade inferida de palavra solta | Nível só é declarado quando aparece explicitamente; caso contrário, fica `Não informado` | T39 |
| S1/E01: contrato de 10 campos ausente | `score_geral`, `veredito`, `score_detalhado`, `requisitos`, `termos_chave`, `riscos`, `mudancas_sugeridas`, `lacunas_criticas`, `perguntas_para_esclarecer` e `checklist_final` são retornados pela API | E01, E02 |
| S15: instrução para inserir termo ausente | Lacunas e perguntas pedem contexto real; as sugestões não mandam inserir palavra sem evidência | T01, T42, T43 |

### Motor único

O caminho Gemini foi retirado do endpoint `/api/match`. O servidor e o fallback do cliente executam o mesmo motor determinístico (`src/app/utils/evidence-engine.ts`), então a nota e as sugestões não mudam conforme o caminho de execução. Isso elimina a divergência entre dois motores e a dependência de uma chave para o resultado ser reproduzível.

### Sugestão editável no resultado

Cada bullet sugerido na seção "Auditoria por Seção" agora tem o botão **Editar**. A edição é salva no resultado atual, aparece imediatamente na tela e passa a ser usada na cópia e na exportação do diagnóstico.

---

## 3. Resultado caso a caso

| ID | Caso | Resultado | Score | Falha |
|---|---|---|---|---|
| T01 | Ferramenta ausente | aprovado | 20 | — |
| T02 | Certificacao ausente | aprovado | 20 | — |
| T03 | Idioma ausente | aprovado | 30 | — |
| T04 | Metrica inventada | aprovado | 60 | — |
| T05 | Lideranca inventada | aprovado | 30 | — |
| T06 | Projeto inventado | aprovado | 43 | — |
| T07 | Cargo alterado | aprovado | 20 | — |
| T08 | Data alterada | aprovado | 35 | — |
| T09 | Empresa alterada | aprovado | 43 | — |
| T10 | Estudo inflado em experiencia | aprovado | 35 | — |
| T11 | Match verdadeiro | aprovado | 74 | — |
| T12 | Match parcial | aprovado | 35 | — |
| T13 | Termo apenas em habilidades | aprovado | 35 | — |
| T14 | Termo equivalente | aprovado | 80 | — |
| T15 | Sinonimo sem contexto | aprovado | 20 | — |
| T16 | Requisito desejavel ausente | aprovado | 57 | — |
| T17 | Requisito obrigatorio ausente | aprovado | 31 | — |
| T18 | Experiencia antiga | aprovado | 35 | — |
| T19 | Experiencia generica | aprovado | 46 | — |
| T20 | Experiencia especifica | aprovado | 74 | — |
| T21 | Repeticao excessiva | aprovado | 46 | — |
| T22 | Termo sem evidencia | aprovado | 35 | — |
| T23 | Copia da vaga | aprovado | 60 | — |
| T24 | Lista inflada | aprovado | 70 | — |
| T25 | Cluster de termos | aprovado | 20 | — |
| T26 | Termo contextual | aprovado | 74 | — |
| T27 | Termo em titulo | aprovado | 37 | — |
| T28 | Repeticao moderada | aprovado | 74 | — |
| T29 | Termo verdadeiro e contextual | aprovado | 80 | — |
| T30 | Texto oculto | aprovado | 20 | — |
| T31 | Cliche | aprovado | 46 | — |
| T32 | Travessao como pontuacao | aprovado | 46 | — |
| T33 | Frase generica | aprovado | 20 | — |
| T34 | Adjetivo inflado | aprovado | 20 | — |
| T35 | Jargao | aprovado | 20 | — |
| T36 | Texto robotico | aprovado | 20 | — |
| T37 | Frase longa | aprovado | 60 | — |
| T38 | Repeticao de verbo | aprovado | 34 | — |
| T39 | Habilidade sem contexto | aprovado | 20 | — |
| T40 | Escrita natural | aprovado | 74 | — |
| T41 | Match forte | aprovado | 100 | — |
| T42 | Match parcial de score | aprovado | 46 | — |
| T43 | Match fraco | aprovado | 20 | — |
| T44 | Incompativel | aprovado | 20 | — |
| T45 | Falso 100 por cento | aprovado | 60 | — |
| T46 | Score explicavel | aprovado | 74 | — |
| T47 | Score consistente | aprovado | 100 | — |
| T50 | Score por contexto | aprovado | 100 | — |
| R01 | Curriculo forte | aprovado | 80 | — |
| R02 | Curriculo honesto fora da vaga | aprovado | 20 | — |
| R03 | Curriculo com stuffing | aprovado | 60 | — |
| R04 | Curriculo inflado | aprovado | 20 | — |
| R05 | Curriculo incompleto | aprovado | 20 | — |
| R06 | Vaga mal escrita | aprovado | 46 | — |
| R07 | Vaga com muitos desejaveis | aprovado | 84 | — |
| R08 | Curriculo mal formatado | aprovado | 46 | — |
| R09 | Reescrita segura | aprovado | 46 | — |
| R10 | Score estavel | aprovado | 74 | — |
| E01 | Contrato de saida do avaliador | aprovado | 60 | — |
| E02 | Coerencia score e veredito | aprovado | 60 | — |
| E03 | Requisito inventado | aprovado | 46 | — |
| E04 | Injecao de instrucao no curriculo | aprovado | 46 | — |

### Diferenciais

| ID | Comparação | Resultado |
|---|---|---|
| T48 | Vaga com Docker desejável ausente (57) vs. Docker obrigatório ausente (46) | aprovado |
| T49 | Python só em lista (35) vs. Python com uso contextual (100) | aprovado |

### Estabilidade

| ID | Execuções | Resultado |
|---|---|---|
| T47 | 100, 100, 100 | aprovado (variação 0) |
| R10 | 74, 74, 74 | aprovado (variação 0) |

---

## 4. O que esta auditoria ainda não verifica

1. **Formatação real do arquivo.** A API recebe texto puro; T30 usa um texto que descreve texto branco e fonte oculta. O motor sinaliza a declaração, mas não inspeciona cor, fonte, colunas ou imagens de um PDF/DOCX. Para isso seria necessário upload e parsing do arquivo original.
2. **Equivalência semântica ampla.** A extração usa vocabulário versionado com aliases. Sinônimos fora da lista podem não ser reconhecidos; T14 passa porque os equivalentes usados na bateria estão mapeados. Revisão manual continua necessária para equivalências fora do vocabulário.
3. **Injeção com modelo de linguagem.** E04 passa porque o motor ignora instruções embutidas no texto. Como o caminho Gemini não é mais usado no `/api/match`, não há prompt a injetar.
4. **Produção na Vercel.** A bateria rodou contra a API no sandbox. A publicação depende do merge deste branch na `main`; o fallback estático do cliente usa o mesmo motor, mas a rota `/api/match` só existe no servidor Node.

---

## 5. Decisão

O avaliador agora sustenta a proposta central: **medir aderência com base no que está escrito, sem inventar requisito, experiência, número ou termo**. A bateria completa passa (62/62), os diferenciais passam (2/2), a estabilidade é determinística (variação 0) e a suíte interna do app passa (8/8). O que resta fora do alcance desta execução está declarado na seção 4, sem ser tratado como aprovado.
