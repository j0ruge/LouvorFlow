# Feature Specification: Mapeamento de Tom LouvorFlow → Fragmento `#key=N` do CifraClub

**Feature Branch**: `026-cifraclub-key-mapping`
**Created**: 2026-05-17
**Status**: Draft
**Input**: User description: "@specs\025-cifraclub-playlist-integration\prd.md quero adicionar a pesquisa se corresponder no cifraclub.com.br o tom selecionado no LouvorFlow, por exemplo a url no cifraclub para o tom 'A' fica com #key=0 no final da url como em https://www.cifraclub.com.br/florianopolis-house-of-prayer/sublime/#key=0 se for 'Bb' via #key=1"

> **Relação com 025**: esta spec é uma **extensão direta** da feature `025-cifraclub-playlist-integration`. Ela não altera o modelo de dados nem o endpoint criado em 025 — apenas enriquece a URL final entregue ao músico para que a cifra abra **já no tom escolhido para a escala**, evitando que cada músico transponha manualmente no app/site do CifraClub.

---

## Clarifications

### Session 2026-05-17

- Q: Semântica do `#key=N` no CifraClub — offset relativo ao tom-base (H1) ou índice cromático absoluto (H2)? → A: H2 — índice cromático absoluto com `N=0 ⇒ A`, `N=1 ⇒ Bb`, ..., `N=11 ⇒ Ab` (mod 12). Confirmado pelos exemplos observados pelo usuário (A=0, Bb=1) que são inconsistentes com H1 dado que o tom-base catalogado de "Sublime" é D.
- Q: Tratamento de fragmentos/queries pré-existentes na `cifraclub_url` cadastrada? → A: **Preservar query string, substituir TODO o fragmento.** A query string original (ex.: `?utm=x`) é mantida; qualquer fragmento existente (`#letras`, `#key=3`, etc.) é descartado e substituído pelo `#key=N` calculado. Se o cálculo não puder ocorrer, a query original é preservada e o fragmento original também (regra de fallback de EC-4).
- Q: `#key=0` explícito ou omitir fragmento quando não há transposição? → A: **Sempre anexar `#key=N`**, inclusive `#key=0`. URL idempotente, auto-documentada e elimina ambiguidade entre "líder não escolheu tom" e "líder escolheu o tom-base".
- Q: Grafia da nota no campo `tom_final` da resposta? → A: **Canonicalizar para a grafia do CifraClub** (confirmada via screenshot do seletor de tom oficial em 2026-05-17): `A, Bb, B, C, Db, D, Eb, E, F, F#, G, Ab`. Notas com acidente: 4 bemóis (`Bb, Db, Eb, Ab`) + 1 sustenido (`F#`). Independente da grafia que o líder digitou na escala (`A#` é convertido para `Bb`, etc.), o `tom_final` exposto pela API e badge na UI seguem essa convenção.

### Investigação adicional — Listas públicas do CifraClub (2026-05-17)

Durante o `/speckit.plan` desta feature, investigação Playwright independente da 026 descobriu fatos relevantes que validam pré-condições da spec **e revisam a spec 025**:

- **Tabela H2 confirmada empiricamente**: API pública `GET https://api.cifraclub.com.br/v3/songbook/{listId}` serializa cada música com `siteUrl` contendo `#…&key=N` numérico onde `C→3`, `G→10`, `Am→0` — bate 100% com a tabela `A=0..Ab=11` decidida em Q1. Sem necessidade de reabrir Q1.
- **Listas públicas com URL compartilhável EXISTEM** no CifraClub (`/musico/{userId}/repertorio/{listId}/`). Isso **invalida a §16 da spec 025** e gera proposta de **feature 027** (`cifraclub-list-link`) — fora do escopo desta 026 mas conectada. Detalhes em `specs/025-cifraclub-playlist-integration/prd.md` §16 (revisado v1.2).

---

## Contexto da Pesquisa Solicitada

O usuário observou que páginas de cifra no CifraClub aceitam um fragmento de URL no formato `#key=<inteiro>` que altera o tom de exibição da cifra. Exemplos fornecidos:

| Tom selecionado pelo usuário | URL final |
|---|---|
| A  | `https://www.cifraclub.com.br/florianopolis-house-of-prayer/sublime/#key=0` |
| Bb | `https://www.cifraclub.com.br/florianopolis-house-of-prayer/sublime/#key=1` |

A pergunta a ser respondida pela feature é: **dado o tom escolhido para uma música em uma escala do LouvorFlow, conseguimos compor automaticamente a URL CifraClub com o `#key=N` correto, de forma que ao tocar o link a cifra já apareça no tom certo?**

### Achados da investigação (DeepSearch interno)

| # | Pergunta | Resultado |
|---|----------|-----------|
| R1 | Existe documentação oficial pública do fragmento `#key=N` no CifraClub? | **Não encontrada.** Buscas em blog/forum CifraClub e documentação do app não retornaram referência ao parâmetro. |
| R2 | O parâmetro funciona ao tocar/clicar a URL no app oficial e no navegador? | **Comportamento observado pelo usuário**: sim, a cifra renderiza no tom correspondente ao `N` informado. Web reader e Universal Link respeitam o fragmento. |
| R3 | `N` é offset relativo ao tom-base catalogado do song, ou é um índice absoluto de altura (ex.: A=0, Bb=1, …, Ab=11)? | **Resolvido (2026-05-17, sessão Clarifications)**: índice cromático **absoluto** com `A=0`, `Bb=1`, …, `Ab=11`, mod 12. Os exemplos do usuário (A=0, Bb=1) só são consistentes com essa interpretação dado que o tom-base catalogado de "Sublime" é D (não A). |
| R4 | Existem variantes (`#key=-1`, `#key=12`, decimais)? | **Não testado nesta pesquisa.** Hipótese: valores fora de `0..11` provavelmente são normalizados mod 12 ou ignorados. Decimais provavelmente são ignorados. |

A **clarificação sobre R3** é o pivô da feature: ela determina se precisamos (ou não) cadastrar um tom-base por URL no LouvorFlow. Está formalizada como **clarificação Q1** abaixo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Músico abre a cifra já no tom da escala (Priority: P1)

Camila (backing vocal) recebe via WhatsApp a Playlist CifraClub gerada pelo líder Marcos para o culto de domingo. Marcos cadastrou a música "Sublime" com a cifra do CifraClub e selecionou para esta escala o tom **A** (a versão original cadastrada está em **D**). Quando Camila toca o link da música no celular, o app oficial do CifraClub abre a cifra **já transposta para A**, sem que ela precise mexer no botão de transposição.

**Why this priority**: é o coração da feature. Sem isso, a Playlist CifraClub do 025 entrega uma lista de cifras genérica e cada músico precisa transpor manualmente, replicando a fricção que a 025 quis eliminar. P1 porque é o que justifica o esforço incremental.

**Independent Test**: cadastrar uma música com cifra CifraClub conhecida e tom-base conhecido, criar uma escala, selecionar um tom diferente, chamar o endpoint da Playlist CifraClub e verificar que a URL retornada termina com o `#key=<N>` correspondente ao tom escolhido. Abrir o link em um celular e confirmar visualmente que a cifra carrega no tom esperado.

**Acceptance Scenarios**:

1. **Given** uma versão de música com `cifraclub_url` cadastrada e a versão registrada em "D", **When** o líder seleciona o tom "A" para essa música na escala e o backend monta a Playlist CifraClub, **Then** a URL retornada termina com o fragmento `#key=<N>` correspondente a "A".
2. **Given** uma versão sem tom selecionado para a escala (a escala usa o tom da própria versão cadastrada), **When** o backend monta a Playlist CifraClub, **Then** a URL termina com `#key=0` (sem transposição) ou sem fragmento — comportamento consistente conforme decidido em Q3.
3. **Given** uma versão cuja `cifraclub_url` já vem cadastrada com um fragmento (ex.: `…/sublime/#key=3`), **When** o backend monta a Playlist CifraClub para um tom diferente, **Then** o fragmento original é **substituído** pelo `#key=<N>` calculado — nunca duplicado.
4. **Given** o tom selecionado é enarmônico (ex.: o usuário pode digitar "F#" ou "Gb" no LouvorFlow para a mesma altura), **When** o backend calcula o fragmento, **Then** o `N` resultante é o mesmo para ambas as grafias.

---

### User Story 2 — Líder confia que o link "abre certo" sem precisar conferir tom música a música (Priority: P2)

Marcos finaliza a escala dominical em 4 minutos. Ele troca o tom de 2 músicas para acomodar a tessitura da Camila. Ao gerar a Playlist CifraClub, ele **não precisa abrir cada cifra para confirmar que o tom está certo** — confia que o link já entrega cada cifra no tom que ele escolheu.

**Why this priority**: é a confiança operacional que sustenta a adoção. Sem ela, o líder vira "QA de URL" e a feature perde valor. P2 porque o valor é cumulativo — se 80% dos casos funcionam corretamente e os 20% restantes mostram um aviso claro, a feature ainda é útil.

**Independent Test**: simular o fluxo completo (cadastrar música, criar escala, mudar tom, gerar playlist) e validar que pelo menos uma indicação visual no diálogo da playlist mostra "tom transposto" ou similar, e que nenhum link silenciosamente falha em aplicar a transposição.

**Acceptance Scenarios**:

1. **Given** todas as músicas da escala têm `cifraclub_url` cadastrada e tom selecionado, **When** o líder abre o diálogo da Playlist CifraClub, **Then** cada item mostra discretamente o tom que será entregue (ex.: badge "🎚 A" ao lado do nome).
2. **Given** uma música cujo cálculo de `#key=N` não foi possível (dado faltando — ver Q1), **When** o líder abre o diálogo, **Then** a UI mostra um indicador claro ("tom não ajustado") e o link é entregue **sem fragmento**, abrindo a cifra no tom-base do CifraClub.
3. **Given** o líder muda o tom de uma música após gerar a playlist, **When** ele reabre o diálogo, **Then** os links são recalculados automaticamente.

---

### User Story 3 — Músico não precisa ser instruído sobre como transpor no CifraClub (Priority: P2)

Camila é nova na equipe e ainda não conhece o botão de transposição do app CifraClub. Como o link entregue já abre no tom correto, ela consegue ensaiar sem onboarding adicional.

**Why this priority**: reduz a curva de entrada para músicos voluntários, que rotacionam com frequência em igrejas. P2 porque é um ganho de UX significativo mas não bloqueante para a adoção do líder (que é o decisor primário).

**Independent Test**: entrega um link gerado para um músico que não conhece o app; observa se ele consegue tocar a cifra no tom da escala sem ajustes manuais.

**Acceptance Scenarios**:

1. **Given** um link com `#key=N` correto, **When** tocado em iOS ou Android com o app CifraClub instalado, **Then** o app abre direto na cifra transposta.
2. **Given** o usuário não tem o app instalado, **When** o link é aberto, **Then** o navegador (web reader do CifraClub) também respeita o fragmento e exibe a cifra no tom correto.

---

### Edge Cases

- **EC-1**: Tom selecionado em formato inesperado (ex.: "Am", "C#m", "F/A"). A parte modal (minor/major) e o baixo invertido **não afetam** o cálculo do `#key=N` (que é puramente cromático). Tratamento: extrair apenas a nota raiz (A, A#, Bb, B, C, …), ignorar `m`, `maj`, `7`, `/<nota>` etc.
- **EC-2**: Tom selecionado vazio ou nulo. A URL é entregue **sem fragmento** (cifra no tom-base do CifraClub).
- **EC-3**: Tom selecionado fora do conjunto cromático esperado (ex.: "X", "??", "100"). A URL é entregue **sem fragmento** e o backend loga um warning de telemetria.
- **EC-4**: `cifraclub_url` já vem com fragmento cadastrado pelo líder (ex.: `…/sublime/#key=3`). O fragmento original é **substituído** pelo calculado. Se o cálculo não puder produzir um fragmento (dado faltando), o fragmento original cadastrado **é preservado** (é melhor abrir em um tom escolhido pelo líder do que ignorar o que ele cadastrou).
- **EC-5**: `cifraclub_url` apontando para uma variante de URL que **não respeita** `#key=N` (ex.: `/partituras/` ou `/simplificada.html`). Comportamento: o fragmento é anexado mesmo assim — se o destino ignorar, a degradação é silenciosa e o usuário vê o tom-base. Sem ação especial no MVP.
- **EC-6**: Tom da escala igual ao tom-base CifraClub. O `N` calculado é `0`. Comportamento: **anexar `#key=0` sempre** (decisão Q3) — torna a URL idempotente, auto-documentada e elimina ambiguidade entre "líder escolheu o tom-base" e "líder não escolheu tom".
- **EC-7**: Notas enarmônicas (F#/Gb, C#/Db, D#/Eb, G#/Ab, A#/Bb). Devem mapear para o mesmo `N`. A tabela de normalização é parte do requisito.
- **EC-8**: Tom com modificador "♭" / "♯" (caracteres Unicode) em vez de "b" / "#". Normalizar antes de mapear.
- **EC-9**: LouvorFlow permite hoje tonalidades por digitação livre? Se sim, possíveis valores fora do esperado (espaços, lowercase, "DM7") devem ser saneados antes do cálculo.
- **EC-10**: Se o app oficial do CifraClub for desinstalado pelo músico e o link cair no navegador, o fragmento ainda deve funcionar no web reader (validar via teste manual em pelo menos um device real).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST gerar, para cada música da Playlist CifraClub (endpoint criado em 025), uma URL final que inclua o fragmento `#key=<N>` correspondente ao tom escolhido para aquela música naquela escala, sempre que houver dados suficientes para o cálculo.

- **FR-002**: O sistema MUST aceitar como entrada tanto a grafia "♯/♭" quanto "#/b" para os semitons, e tratar **F#/Gb, C#/Db, D#/Eb, G#/Ab, A#/Bb** como equivalentes para fins de cálculo do `N`.

- **FR-003**: O sistema MUST extrair apenas a **nota raiz** do tom selecionado (descartando sufixos como `m`, `maj7`, `/A`) antes de calcular o `N`. Tom "Am" e "A" geram o mesmo `N`.

- **FR-004**: O sistema MUST substituir qualquer fragmento `#key=…` pré-existente na `cifraclub_url` cadastrada pelo `N` calculado. Outros fragmentos coexistentes (ex.: `#letras`) são tratados conforme Q2.

- **FR-005**: Se o cálculo de `N` não for possível (dado faltando ou inválido), o sistema MUST entregar a `cifraclub_url` **original cadastrada** (sem alteração) e MUST sinalizar à UI um flag `tom_ajustado: false` por item da playlist.

- **FR-006**: A UI da Playlist CifraClub MUST exibir, por item, o tom em que a cifra será aberta (ex.: badge ao lado do nome) e, quando `tom_ajustado: false`, um indicador visual sutil ("tom não ajustado") com tooltip explicando o motivo.

- **FR-007**: O cálculo de `N` MUST tratar `#key=N` como **índice cromático absoluto**, com a tabela de mapeamento fixa baseada na grafia canônica do CifraClub: `A=0, Bb=1, B=2, C=3, Db=4, D=5, Eb=6, E=7, F=8, F#=9, G=10, Ab=11`. Grafias enarmônicas equivalentes da entrada (`A#=1`, `C#=4`, `D#=6`, `Gb=9`, `G#=11`) MUST ser aceitas e mapeadas para o mesmo `N`. O valor MUST ser normalizado mod 12. Nenhum dado adicional (tom-base CifraClub) precisa ser cadastrado por URL.

- **FR-008**: O texto compartilhado via WhatsApp / clipboard (formato já especificado em 025 §4) MUST refletir a URL final com o `#key=N` calculado, não a URL bruta cadastrada.

- **FR-009**: O contrato de resposta do endpoint de Playlist CifraClub MUST passar a incluir, por item, os campos `tom_final` (string canonicalizada na grafia CifraClub — vide FR-007) e `tom_ajustado` (boolean, se o `#key=N` foi efetivamente aplicado). Exemplo: entrada `tom="A#m"` → resposta `tom_final="Bb"` e `#key=1`.

- **FR-010**: O sistema MUST manter o comportamento atual da 025 quando o tom selecionado for vazio/null: a URL é entregue como cadastrada, sem fragmento de transposição.

- **FR-011**: O sistema MUST tratar valores de tom completamente inválidos (vazio, espaços, símbolos não-musicais) como "sem tom" — não falhar, não retornar erro 500, apenas omitir o fragmento e marcar `tom_ajustado: false`.

- **FR-012**: O tratamento de partes "extras" da `cifraclub_url` cadastrada MUST seguir esta política: (a) **query string** (tudo após `?`) é **preservada** intacta; (b) **fragmento** (tudo após `#`) é **descartado** e substituído pelo `#key=N` calculado quando o cálculo é possível. Se o cálculo não for possível (ver FR-005), tanto a query quanto o fragmento originais são preservados sem alteração.

- **FR-013**: O sistema MUST tornar o cálculo de `N` **puro e idempotente** (mesmo input → mesma URL final), para facilitar caching futuro e diff de links em telemetria.

### Key Entities *(include if feature involves data)*

- **Tom musical (entidade conceitual)**: representação de uma altura musical (nota raiz) usada tanto no LouvorFlow (campo `tom` de versões e do item da escala) quanto no CifraClub (parâmetro de transposição). Atributos lógicos: nota raiz (A..G), modificador (`#`, `b`, vazio). Modo (major/minor) é ignorado para fins de cálculo do `#key=N`.
- **Item da Playlist CifraClub**: enriquecido — herda de 025 e ganha `tom_final` + `tom_ajustado`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 90% das músicas com `cifraclub_url` cadastrada e tom selecionado válido, o link entregue na Playlist CifraClub abre a cifra **diretamente no tom esperado** (medido por verificação manual em 30 amostras representativas pós-deploy).
- **SC-002**: Tempo entre "líder muda tom da música na escala" e "músico abre a cifra já transposta" cai para ≤30 segundos no fluxo end-to-end (cadastro → playlist → WhatsApp → tap no link).
- **SC-003**: ≤5% das músicas da playlist apresentam o estado `tom_ajustado: false` (proxy para qualidade dos dados cadastrados) após 30 dias de uso ativo.
- **SC-004**: Zero erros 500 originados do cálculo de `#key=N` em logs de produção em 30 dias (resiliência a inputs inesperados).
- **SC-005**: ≥80% dos líderes que usaram a Playlist CifraClub citam, em pesquisa qualitativa, que "as cifras já abrem no tom certo" como benefício percebido.
- **SC-006**: Nenhuma regressão funcional na Playlist CifraClub da 025: 100% dos testes anteriores continuam passando.

---

## Assumptions

- **A1**: O LouvorFlow registra tom como string curta (ex.: "A", "Bb", "C#m"). A grafia interna do projeto segue a convenção brasileira de letras (não números nem solfejo).
- **A2**: O fragmento `#key=N` é interpretado pelo CifraClub mod 12 (ou seja, `#key=12` ≡ `#key=0`). Confirmar empiricamente antes de implementar normalização defensiva.
- **A3**: Apps e web reader oficiais do CifraClub continuam respeitando o fragmento `#key=N` durante todo o ciclo de vida desta feature. Mudança unilateral por parte do CifraClub é risco aceito (graceful degradation: a cifra abre no tom-base).
- **A4**: O LouvorFlow não precisa armazenar o tom-base catalogado pelo CifraClub — a decisão H2 (vide Clarifications 2026-05-17) elimina essa necessidade. Nenhum campo novo no banco.
- **A5**: Esta feature pressupõe que a 025 já está em produção (modelo de dados `cifraclub_url`, endpoint `GET /api/eventos/:id/cifraclub-playlist`, diálogo na UI).
- **A6**: Tom modal (Am vs A, Dm vs D) compartilha a mesma raiz cromática para fins de `#key=N`. O CifraClub trata isso transparentemente.

---

## Out of Scope

- **OOS-1**: Detecção automática do tom-base CifraClub via scraping da página (poderia resolver Q1 sem cadastro manual, mas pertence à Fase 2 do roadmap geral).
- **OOS-2**: Suporte a outros sites de cifras (Cifras.com.br, Ultimate Guitar). Esta feature é exclusivamente CifraClub.
- **OOS-3**: Telemetria/analytics formal de "tom abriu correto?" — só log no backend e indicador visual.
- **OOS-4**: Permitir que o músico final ajuste o tom no LouvorFlow (continuamos delegando o ajuste fino ao app do CifraClub).
- **OOS-5**: Capodastro (`#capo=N`?) — fora de escopo, focar apenas em transposição cromática.

---

## Dependencies

- **D1**: Feature 025 (`cifraclub-playlist-integration`) **já em produção**. Esta spec assume o endpoint, o modelo e a UI da 025 existem.
- **D2**: ~~Validação empírica final do mapeamento absoluto (H2)~~ — **resolvida em 2026-05-17 via investigação Playwright na API pública do CifraClub**. O endpoint não-documentado `GET https://api.cifraclub.com.br/v3/songbook/{listId}` serializa cada música com `siteUrl` contendo o fragmento `#instrument=guitar&tuning=…&capo=0&key=N` onde `N` segue a tabela cromática absoluta `A=0..Ab=11` (observado: `tone="C" → key=3`, `tone="G" → key=10`, `tone="Am" → key=0`). Referência cruzada: `specs/025-cifraclub-playlist-integration/prd.md` §16.2.7 e §16.6. Resta apenas um check visual confirmatório de ~5 min (T002 do `tasks.md`), não-bloqueante.
