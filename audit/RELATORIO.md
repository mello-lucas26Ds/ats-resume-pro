# Relatório de auditoria do avaliador de aderência

**Executado em:** 2026-11-11, no sandbox Base44
**Branch:** `resume-evaluator-prompt` (HEAD `4a939aec2c`, 83 dias atrás de `main`)
**Caminho testado:** `POST /api/match` real, porta 3000, container `app-web-1`
**Motor exercitado:** heurístico determinístico (não há `GEMINI_API_KEY` configurada)
**Bateria:** T01–T50, R01–R10, E01–E04 (64 IDs, todos cobertos)
**Artefatos:** `audit/casos.json`, `audit/run-audit.mjs`, `audit/out/*.json`, `audit/MATRIZ_COBERTURA.md`

---

## 1. Veredito

**Reprovado.** O sistema não atinge o critério de aprovação geral da própria bateria (95% dos testes sem violação crítica).

| Medida | Resultado |
|---|---|
| Aprovado no critério específico do caso | **29 de 62 (46.8%)** |
| Parcial no critério do caso | 5 de 62 (8.1%) |
| Reprovado no critério do caso | 28 de 62 (45.2%) |
| Aprovado considerando os invariantes críticos | **0 de 62** |
| Reprovado considerando os invariantes críticos | 52 de 62 |
| Parcial considerando os invariantes críticos | 10 de 62 |

A distância até 95% não é de ajuste fino: há defeitos que se repetem em **todas** as análises.

---

## 2. Defeitos sistêmicos

### S1. O contrato de saída especificado não existe (E01)

O prompt do avaliador exige `score_geral`, `veredito`, `score_detalhado`, `requisitos`, `termos_chave`, `riscos`, `mudancas_sugeridas`, `lacunas_criticas`, `perguntas_para_esclarecer` e `checklist_final`. A resposta real traz `atsScore`, `fitGeneral`, `summaryHeadline`, `seniorityAnalysis`, `top20Requirements`, `keywords`, `gapsAnalysis`, `sectionRecommendations`, `aiToneAudit` e `strategicQuestions`.

Faltam os 10 campos do contrato. Consequência direta: **as quatro dimensões ponderadas (0,35 / 0,25 / 0,20 / 0,20), as penalidades e o checklist final não existem no sistema**. Nenhum teste de peso, de explicação do score ou de checklist pode ser aprovado, porque o dado não é produzido.

### S2. Três requisitos são inventados em toda análise (G12: 62/62)

Toda saída inclui requisitos que não vêm da vaga, um deles marcado como `Inegociável` com peso fixo 80:

- `Autonomia e Entrega Orientada a Resultados` (peso 80, `Importante`)
- `Práticas de Testes e CI/CD`
- `Ferramentas de Arquitetura & Banco`

Quando a vaga não usa nenhum termo do vocabulário interno, aparece ainda `Competência Técnica Principal`. Isso viola "não inventar requisito" e contamina a nota com peso que a vaga não pediu.

### S3. Bullets prontos inventam experiência profissional (G13: 62/62)

Todos os 62 casos recebem um bullet "pronto para o CV" com realização que o currículo não contém. Exemplos reais coletados:

- Currículo: "Trabalhei com dados." → `Configurei e otimizei a infraestrutura e microsserviços principais, reduzindo o tempo de processamento em [+X%]`
- Currículo: "Usei SQL para consolidar dados de vendas" → `Implementei solução completa utilizando SQL, com testes automatizados e deploy contínuo`
- Currículo: "Concluí curso online de AWS" → `Especialista com foco em AWS e arquitetura escalável` + `Implementei solução completa utilizando AWS`

Isso é exatamente o que a regra 1 do avaliador proíbe: inventar projeto, escopo e resultado. O placeholder `[+X%]` não salva a frase, porque a *ação* já foi inventada.

### S4. Título inflado em toda análise (mesma origem de S3)

O template `Especialista com foco em <termo>` transforma qualquer candidato em especialista. Em T10 (estudo de AWS) e T22 (Kubernetes apenas citado) o texto entregue eleva o candidato a especialista na tecnologia.

### S5. `keywords.matched` é fabricado quando nada casa (G5: 40/62)

Sem correspondência, o motor devolve `["Experiência Geral", "Resolução de Problemas"]`. São termos que não estão no currículo. Viola "não inventar" e corrompe qualquer consumidor da lista.

### S6. `keywords.missing` recebe uma frase inteira (G6: 55/62)

No lugar de termos ausentes, a saída traz `"Nenhuma palavra crítica ausente identificada"`. Quebra o contrato do campo e impede distinguir "nada falta" de "termo encontrado por acidente".

### S7. Evidência é eco do termo, não contexto (T11, T10, T13, T22, T45)

`evidenceInResume` vale `Termo "sql" identificado no currículo.` para qualquer ATENDE. A regra "termo sem evidência não pontua" não é aplicada: presença da palavra basta. Consequência: T11 (match legítimo) e T13/T22 (termo solto) recebem a mesma classificação.

### S8. Negação é lida como afirmação (T42, T46)

- T46: currículo "Sem experiência com Python" → o sistema marca `python = ATENDE` e dá **85**.
- T42: "Não utilizei Python nem Power BI em projetos" → **85**, veredito `Forte`, e o bullet sugere `Especialista com foco em PYTHON`.

É o defeito mais grave encontrado: o sistema atribui ao candidato a competência que ele explicitamente negou.

### S9. Score 64 fixo quando nenhum termo do vocabulário aparece (T44, R02, T19, T07, T39)

Com `jobKeywords` vazio, o motor usa `matchRatio = 0,75` e devolve **64 / Moderado**:

- T44: 1 ano de atendimento ao cliente contra vaga de engenheiro de dados sênior → **64, Moderado** (esperado: baixo/incompatível)
- R02: atendimento em varejo contra engenheiro de dados → **64, Moderado**

O piso de 25 e o default de 0,75 fazem o sistema nunca reprovar ninguém de forma clara.

### S10. Desejável pesa como obrigatório (T48, T16, R07)

- T48: mesma vaga com Docker "desejável" e com Docker "obrigatório" → **43 e 43**, idênticos.
- T16: SQL e Excel presentes, Docker desejável ausente → **43**, faixa `Baixo`, com os dois requisitos obrigatórios atendidos.
- R07: os dois requisitos obrigatórios atendidos, cinco desejáveis ausentes → **25**.

### S11. Presença de palavra vale o mesmo que uso demonstrado (T49)

- "Habilidades: Python." → **85, Forte**
- "Usei Python para automatizar relatórios mensais." → **85, Forte**

Nenhuma diferença. É a violação central da lógica declarada pelo próprio prompt: "termo sem evidência não pontua; evidência sem contexto não pontua".

### S12. Detecções previstas não existem

| Detecção | Caso | Resultado |
|---|---|---|
| Keyword stuffing | T21, T24, R03, T45 | não sinalizado; score 85 em T21/T24/T45 e em R03 |
| Cópia literal da vaga | T23 | não sinalizada |
| Travessão como pontuação | T32 | não sinalizado (não há dimensão de pontuação) |
| Frase longa | T37 | não sinalizado |
| Vagueza ("Responsável por diversas atividades") | T33 | `VAGUE_ABSTRACTION = Limpo` |
| Texto oculto | T30 | não sinalizado |
| Formatação / parsing | R08 | não sinalizado |
| Inflação sem adjetivo da lista | T27 ("Especialista em IA") | não sinalizada |
| Robótico "orientada a resultados e inovação" | T36 | `HOLLOW_ADJECTIVES = Limpo` (lista tem "orientado a resultados", no masculino) |
| Passiva repetida | T38 | `PASSIVE_AUTHORLESS = Limpo` (o padrão interno é "responsável por" com acento; o texto sem acento não casa) |

A auditoria de tom depende de uma lista fechada de ~20 expressões. Fora dela, não detecta nada.

### S13. Idioma, certificação e Power BI não existem no vocabulário (T02, T03, T17, T20, T29)

O vocabulário cobre 33 termos, quase todos de engenharia de software. Não há `inglês`, `PMP`, `Power BI`, `Excel`, `Salesforce`, `gestão de projetos`, `migração`, `análise de dados`. Resultado:

- T02 (PMP): nenhuma lacuna apontada.
- T03/T17 (inglês): nenhuma lacuna, nenhuma pergunta.
- T20/T29 (Power BI): requisito não listado; score 64 por default, mesmo com dashboard no currículo.

### S14. Senioridade inferida de palavra solta (T39)

Currículo "Habilidades: liderança, comunicação, proatividade." → observado `vaga=Pleno`, `curriculo=Pleno`, sem nível declarado em nenhum dos dois. Nenhum dos textos traz senioridade: o valor é default. O código também usa a palavra "liderança" como gatilho de nível sênior no currículo.

### S15. Instrução de inserir termo ausente (T01, T43)

Para tecnologia ausente, a saída recomenda: *"Caso tenha estudo ou conhecimento em kubernetes, mencione na seção de competências"*. É a sugestão de adicionar palavra-chave sem evidência que a regra 11 proíbe, ainda que em condicional.

---

## 3. Estabilidade e consistência

| Teste | Resultado | Evidência |
|---|---|---|
| T47 consistência | **aprovado** | 85, 85, 85 (variação 0) |
| R10 estabilidade | **aprovado** | 64, 64, 64 (variação 0) |

O fallback é determinístico, então a estabilidade é estrutural. Isso **não** vale para o caminho Gemini, que ficou não verificado.

---

## 4. Resultado caso a caso

| ID | Caso | Critério | Global | Score | Falha do critério |
|---|---|---|---|---|---|
| T01 | Ferramenta ausente | reprovado | reprovado | 25 | noPrescriptiveMention |
| T02 | Certificacao ausente | reprovado | reprovado | 64 | gapFor |
| T03 | Idioma ausente | reprovado | reprovado | 64 | questionAbout, gapFor |
| T04 | Metrica inventada | aprovado | reprovado | 64 | — |
| T05 | Lideranca inventada | aprovado | reprovado | 64 | — |
| T06 | Projeto inventado | aprovado | reprovado | 64 | — |
| T07 | Cargo alterado | aprovado | reprovado | 64 | — |
| T08 | Data alterada | aprovado | reprovado | 64 | — |
| T09 | Empresa alterada | aprovado | reprovado | 64 | — |
| T10 | Estudo inflado em experiencia | reprovado | reprovado | 85 | statusNot, evidenceQuality |
| T11 | Match verdadeiro | reprovado | reprovado | 85 | evidenceQuality |
| T12 | Match parcial | aprovado | reprovado | 64 | — |
| T13 | Termo apenas em habilidades | reprovado | reprovado | 85 | statusNot, evidenceQuality |
| T14 | Termo equivalente | aprovado | reprovado | 64 | — |
| T15 | Sinonimo sem contexto | parcial | reprovado | 25 | questionAbout |
| T16 | Requisito desejavel ausente | aprovado | parcial | 43 | — |
| T17 | Requisito obrigatorio ausente | reprovado | reprovado | 64 | gapFor, questionAbout |
| T18 | Experiencia antiga | aprovado | reprovado | 64 | — |
| T19 | Experiencia generica | aprovado | reprovado | 64 | — |
| T20 | Experiencia especifica | reprovado | reprovado | 64 | statusFor |
| T21 | Repeticao excessiva | reprovado | reprovado | 85 | flagsStuffing |
| T22 | Termo sem evidencia | reprovado | reprovado | 43 | statusNot, evidenceQuality |
| T23 | Copia da vaga | reprovado | reprovado | 64 | detectsCopy |
| T24 | Lista inflada | reprovado | reprovado | 85 | flagsStuffing |
| T25 | Cluster de termos | aprovado | reprovado | 64 | — |
| T26 | Termo contextual | aprovado | parcial | 85 | — |
| T27 | Termo em titulo | reprovado | reprovado | 64 | flagsInflation |
| T28 | Repeticao moderada | aprovado | parcial | 85 | — |
| T29 | Termo verdadeiro e contextual | reprovado | reprovado | 64 | statusFor |
| T30 | Texto oculto | reprovado | reprovado | 25 | flagsManipulation |
| T31 | Cliche | aprovado | reprovado | 64 | — |
| T32 | Travessao como pontuacao | reprovado | reprovado | 64 | flagsPunctuation |
| T33 | Frase generica | reprovado | reprovado | 64 | flagsVagueness |
| T34 | Adjetivo inflado | aprovado | reprovado | 64 | — |
| T35 | Jargao | aprovado | reprovado | 64 | — |
| T36 | Texto robotico | parcial | reprovado | 64 | aiFlag |
| T37 | Frase longa | reprovado | reprovado | 64 | flagsLongSentence |
| T38 | Repeticao de verbo | parcial | reprovado | 64 | aiFlag |
| T39 | Habilidade sem contexto | reprovado | reprovado | 64 | seniorityNotInferred, seniorityNotInferred |
| T40 | Escrita natural | aprovado | reprovado | 64 | — |
| T41 | Match forte | aprovado | parcial | 85 | — |
| T42 | Match parcial de score | reprovado | reprovado | 85 | scoreRange |
| T43 | Match fraco | reprovado | reprovado | 25 | noPrescriptiveMention |
| T44 | Incompativel | reprovado | reprovado | 64 | scoreMax, fitGeneralIs |
| T45 | Falso 100 por cento | reprovado | reprovado | 85 | scoreMax, flagsStuffing, evidenceQuality |
| T46 | Score explicavel | reprovado | reprovado | 85 | statusNot |
| T47 | Score consistente | aprovado | parcial | 85 | — |
| T50 | Score por contexto | aprovado | parcial | 85 | — |
| R01 | Curriculo forte | aprovado | parcial | 85 | — |
| R02 | Curriculo honesto fora da vaga | reprovado | reprovado | 64 | scoreMax |
| R03 | Curriculo com stuffing | reprovado | reprovado | 85 | flagsStuffing, scoreMax |
| R04 | Curriculo inflado | aprovado | reprovado | 64 | — |
| R05 | Curriculo incompleto | parcial | reprovado | 64 | questionAbout |
| R06 | Vaga mal escrita | aprovado | reprovado | 64 | — |
| R07 | Vaga com muitos desejaveis | reprovado | reprovado | 25 | scoreMin |
| R08 | Curriculo mal formatado | parcial | reprovado | 64 | flagsFormatting |
| R09 | Reescrita segura | aprovado | reprovado | 64 | — |
| R10 | Score estavel | aprovado | reprovado | 64 | — |
| E01 | Contrato de saida do avaliador | reprovado | reprovado | 85 | contractFields |
| E02 | Coerencia score e veredito | aprovado | parcial | 85 | — |
| E03 | Requisito inventado | aprovado | parcial | 85 | — |
| E04 | Injecao de instrucao no curriculo | aprovado | parcial | 85 | — |

---

## 5. O que esta auditoria não conseguiu verificar

Declaro como **não verificado**, não como aprovado:

1. **Caminho da IA (Gemini).** Sem chave configurada, nenhuma execução usou o modelo. Todo o comportamento acima é do motor heurístico de contingência. Se a produção usa a chave, os resultados podem diferir, e o prompt do modelo também precisa ser auditado (ele não contém as 20 regras absolutas, a proibição de travessão nem a distinção desejável/obrigatório).
2. **Texto oculto (T30).** A API recebe texto puro; formatação, fonte e cor não chegam. Só é verificável sobre o arquivo original.
3. **Defesa contra injeção (E04).** Passou, mas apenas porque o motor heurístico ignora o conteúdo. Sem modelo, não há o que injetar.
4. **Divergência entre os dois motores.** Existe um segundo heurístico no cliente (`src/app/utils/heuristic-engine.ts`), executado quando a API falha. Não foi comparado saída a saída nesta execução.

---

## 6. Limitações do próprio oráculo

Para não superestimar o resultado:

- T04, T05, T06, T07, T08, T09 e R09 passaram **no critério específico** porque os checks procuravam números, cargos e projetos inventados nos campos de recomendação. A invenção existe, mas em outro campo: o bullet pronto (S3). O defeito foi capturado pela invariante G13, não pelo check do caso. Ou seja, a taxa de 46,8% ainda é generosa: ela mede o critério declarado, não a ausência total de invenção.
- Os checks são mecânicos. Julgamentos semânticos finos (por exemplo, se uma equivalência é legítima em T14) ficam registrados como revisão manual, não como aprovação automática.
- T02/T03/T17 falharam por ausência de vocabulário, não por raciocínio errado. A causa raiz é a mesma de S13.

---

## 7. Correções recomendadas, por prioridade

### P0 — impede aprovação em qualquer cenário

1. **Eliminar os bullets pré-fabricados.** Nenhum texto de exemplo pode afirmar ação, projeto ou resultado que não esteja no currículo. No máximo, modelo vazio com instrução de preenchimento factual.
2. **Ancorar o score em evidência.** Termo só pontua se aparecer em contexto de uso (fora da seção de habilidades, em frase afirmativa). Negação explícita deve zerar a evidência.
3. **Remover requisitos fixos** e derivá-los apenas da vaga.
4. **Não fabricar `matched`/`missing`.** Listas vazias quando não houver termo.
5. **Separar obrigatório de desejável** no cálculo, com peso e severidade distintos.
6. **Remover o default 0,75.** Sem termos reconhecidos, o resultado deve ser "não avaliável", não 64/Moderado.

### P1 — regras explícitas da bateria

7. Detectar stuffing por contagem de repetição e densidade, e cópia por similaridade com a vaga.
8. Criar as dimensões ausentes: pontuação (travessão), frase longa, vagueza, texto oculto, formatação.
9. Ampliar o vocabulário (idiomas, certificações, Power BI, Excel, gestão de projetos, migração) ou tornar a extração independente de lista fixa.
10. Não inferir senioridade de palavra isolada.
11. Alinhar o contrato de saída ao especificado (E01) ou declarar formalmente que o app implementa outro contrato e reescrever a bateria para ele.

### P2 — robustez

12. Unificar os dois motores heurísticos.
13. Validar a resposta do modelo contra esquema e clampar faixas antes de devolver.
14. Executar esta bateria no caminho Gemini, com chave, antes de qualquer conclusão sobre produção.

---

## 8. Decisão

O sistema **não está adequado** ao prompt avaliado. Ele acerta o essencial em metade dos casos (29/62) e falha de forma crítica na outra metade, com invenção de experiência e de requisito em 100% das análises. A aprovação de 95% exigida pela bateria não é alcançável sem corrigir os itens P0, porque eles não dependem de calibragem: dependem de remover texto inventado e de fazer o score depender de evidência.
