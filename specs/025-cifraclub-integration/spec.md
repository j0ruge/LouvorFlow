# Feature Specification: Integração CifraClub — Playlist, Transposição e Lista por Evento

> **Atualização (2026-06-14):** a funcionalidade de **lista por evento**
> (`cifraclub_list_url`) e o preview da lista (tarefa **T035**) foram **removidos**.
> Na prática, cadastrar uma lista CifraClub por escala era trabalhoso e a lista não
> era reaproveitada. A integração mantida é o **link da cifra por música**
> (`cifraclub_url`) + a **playlist da escala** com transposição (`#key=N`), que
> reaproveita o cadastro da música em todas as escalas. As seções abaixo sobre a
> "lista por evento" são históricas.

**Feature Branch**: `027-cifraclub-list-link`
**Created**: 2026-05-24
**Status**: Draft
**Origem**: Unificação das specs 025 (cifraclub-playlist-integration), 026 (cifraclub-key-mapping) e 027 (cifraclub-list-link).

---

## Contexto

Hoje, ao montar uma escala no LouvorFlow, o líder organiza títulos, tonalidades e responsáveis — mas, no ensaio e no culto, **cada músico precisa abrir manualmente a cifra de cada música no CifraClub**, perdendo tempo e quebrando o fluxo. A relação entre uma versão de música no LouvorFlow e seu correspondente no CifraClub é informal.

Esta feature adiciona três capacidades complementares:

1. **Playlist por escala** (ex-025): vínculo formal `cifraclub_url` por versão de música → geração de playlist exportável com 1 clique → compartilhamento via WhatsApp/clipboard.
2. **Transposição automática** (ex-026): enriquecimento de cada URL com fragmento `#key=N` para que a cifra abra já no tom escolhido para a escala.
3. **Lista pública por Evento** (ex-027): o líder cola a URL de uma lista criada manualmente no CifraClub → botão "Abrir lista" + share dedicado → link único que abre o app CifraClub na lista nativa.

As capacidades 1 e 2 são **automatizadas** (o sistema gera a playlist a partir dos dados). A capacidade 3 é **manual** (o líder cria a lista no CifraClub e cola o link). Ambos os caminhos **coexistem** — servem momentos diferentes (planejamento vs. execução rápida).

### Investigação técnica (resumo)

- **URLs públicas de listas EXISTEM** no CifraClub: `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/`, compartilháveis sem login quando `public: true`.
- **API pública de leitura EXISTE** (não-documentada): `GET https://api.cifraclub.com.br/v3/songbook/{listId}` — retorna JSON com nome, owner, músicas com `siteUrl`, `tone`, `stdTone`, `capo`, `#key=N`. CORS liberado. Sem autenticação.
- **Tabela cromática absoluta confirmada empiricamente**: `A=0, Bb=1, B=2, C=3, Db=4, D=5, Eb=6, E=7, F=8, F#=9, G=10, Ab=11` (mod 12).
- **Universal/App Links**: URLs `cifraclub.com.br` abrem no app oficial se instalado (iOS/Android).
- **APIs de escrita** (POST/PUT/DELETE de listas): não testadas — requerem login. Fora do escopo.

---

## Clarifications

### Session 2026-05-17 (ex-025)

- Q1: Preview da lista CifraClub no cadastro — frontend ou backend? → A: **Frontend direto** (chamada do browser para `https://api.cifraclub.com.br/v3/songbook/{listId}`). CORS confirmado. Falha graceful (timeout 3s, sem retry). Zero código backend para preview.
- Q2: Persistência do `cifraclub_list_url` — coluna direta, tabela polimórfica ou JSONB? → A: **Coluna direta em `Eventos`** com 2 novos campos: `cifraclub_list_url TEXT NULL` e `cifraclub_list_url_updated_at TIMESTAMPTZ NULL`. Decisão por YAGNI.
- Q3: Share da lista — botão independente ou opt-in no share da playlist? → A: **Botão independente** "Compartilhar lista no CifraClub" no diálogo da Playlist CifraClub. Share original segue intocado.

### Session 2026-05-17 (ex-026)

- Q4: Semântica do `#key=N` — offset relativo ou índice cromático absoluto? → A: **Índice cromático absoluto** com `A=0..Ab=11` (mod 12). Confirmado empiricamente pela API.
- Q5: Tratamento de fragmentos pré-existentes na `cifraclub_url`? → A: **Preservar query string, substituir TODO o fragmento.** Se o cálculo não puder ocorrer, preservar o fragmento original (fallback).
- Q6: `#key=0` explícito ou omitir quando não há transposição? → A: **Sempre anexar `#key=N`**, inclusive `#key=0`. URL idempotente e auto-documentada.
- Q7: Grafia da nota no campo `tom_final` da resposta? → A: **Canonicalizar para a grafia do CifraClub**: `A, Bb, B, C, Db, D, Eb, E, F, F#, G, Ab`.

### Session 2026-05-24

- Q8: Fonte do tom para cálculo de `#key=N` — campo novo em `Eventos_Musicas` ou tom-base da composição? → A: **Sempre usar `musicas.fk_tonalidade → tonalidades.tom`** (tom-base da composição). Sem campo novo. A tonalidade é atributo da música; quando a música é selecionada para a escala, seu tom-base já está definido. Override por escala é fora de escopo (pode ser adicionado em feature futura).
- Q9: `#key=N` deve ser anexado a todas as URLs ou apenas a `cifraclub.com.br`? → A: **Apenas URLs contendo `cifraclub.com.br`** (case-insensitive). Para URLs de outros domínios (YouTube, Cifras.com.br, etc.), entregar a URL original sem fragmento e `tom_ajustado: false`.
- Q10: Botão "CifraClub" no header da Escala deve aparecer sempre ou só com ≥1 link? → A: **Sempre visível**, independente de ter links cadastrados. O diálogo com estado vazio ("Nenhuma música possui cifra cadastrada") é call-to-action que incentiva o cadastro.
- Q11: Staleness — reordenação de músicas (mudar `ordem`) deve acionar o aviso "lista desatualizada"? → A: **Sim, incluir reordenação.** Qualquer `eventos_musicas.updated_at` posterior ao `cifraclub_list_url_updated_at` aciona. A ordem é relevante para a lista CifraClub e o custo de um falso-positivo é baixo (aviso sutil).
- Q12: "Copiar links" — incluir músicas sem URL no texto copiado? → A: **Incluir todas.** Músicas sem link aparecem como `_(sem cifra cadastrada)_`. Mantém numeração consistente com a ordem da escala e torna visível quais músicas faltam link.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Líder cadastra link CifraClub por versão de música (Priority: P0)

Marcos abre o formulário de edição de uma versão de "Rendido Estou — Aline Barros" no LouvorFlow. No campo "Link CifraClub (opcional)", cola `https://www.cifraclub.com.br/aline-barros/rendido-estou/`. O sistema valida que é uma URL segura (http/https, sem `javascript:`), salva, e o campo passa a ser exibido na visualização da versão.

**Acceptance Scenarios**:

1. **Given** versão sem `cifraclub_url`, **When** o líder cola uma URL válida e salva, **Then** backend retorna 201/200 com campo ecoado.
2. **Given** URL com protocolo `javascript:` ou `data:`, **When** o líder salva, **Then** o backend rejeita com 400.
3. **Given** versão com `cifraclub_url` preenchido, **When** o líder edita para vazio e salva, **Then** o campo vira `null`.
4. **Given** URL com `m.cifraclub.com.br` ou variantes legítimas (http/https), **When** o líder salva, **Then** o sistema aceita (sem restrição de domínio nesta camada).

---

### User Story 2 — Líder gera playlist CifraClub de uma escala (Priority: P0)

Marcos abre o detalhe da Escala do domingo e toca o botão "CifraClub". Um diálogo abre mostrando a lista ordenada das músicas com links do CifraClub, stats ("8 de 10 com cifra"), e botões de ação. Cada link já vem com `#key=N` do tom escolhido para aquela música na escala.

**Acceptance Scenarios**:

1. **Given** escala com 10 músicas (8 com `cifraclub_url`), **When** o líder abre o diálogo, **Then** vê lista numerada com 8 links clicáveis + 2 "Sem link CifraClub", stats "8 de 10", e cada URL inclui o fragmento `#key=N` correspondente ao tom da escala.
2. **Given** música sem versão selecionada, **When** o backend resolve o link, **Then** usa fallback: primeira versão com `cifraclub_url` definido.
3. **Given** música sem nenhuma versão com link, **When** a playlist é montada, **Then** item aparece sem URL, com texto em itálico cinza.
4. **Given** escala sem nenhuma música, **When** o líder abre o diálogo, **Then** lista vazia, botões de ação desabilitados.

---

### User Story 3 — Líder compartilha playlist via WhatsApp (Priority: P0)

Marcos toca "WhatsApp" no diálogo da Playlist CifraClub. Abre `wa.me/?text=...` com a playlist formatada. Cada músico toca o link, o app CifraClub abre a cifra já no tom certo.

**Acceptance Scenarios**:

1. **Given** playlist com links, **When** o líder toca "WhatsApp", **Then** abre `wa.me` com mensagem formatada (header bold, lista numerada com URLs indentadas, microcopy final).
2. **Given** mensagem excede `WHATSAPP_URL_SAFE_LIMIT` (3800), **When** o líder toca "WhatsApp", **Then** toast orienta a usar "Copiar links".
3. **Given** playlist sem nenhum link, **When** o líder toca "WhatsApp", **Then** botão desabilitado com tooltip explicativo.

---

### User Story 4 — Líder copia playlist em texto (Priority: P0)

Marcos toca "Copiar links" no diálogo. Texto plano numerado vai para o clipboard. Confirmação visual (ícone Check por 3s).

**Acceptance Scenarios**:

1. **Given** playlist com links, **When** o líder toca "Copiar links", **Then** clipboard recebe texto numerado com URLs e ícone muda para Check por 3s.
2. **Given** playlist sem links, **When** o líder toca "Copiar links", **Then** botão desabilitado.

---

### User Story 5 — Músico abre cifra já no tom cadastrado (Priority: P1)

Camila recebe a playlist no WhatsApp. Toca o link de "Sublime". O app CifraClub abre a cifra **diretamente no tom A** (o tom-base que o líder cadastrou para a música no LouvorFlow), sem que ela precise mexer no botão de transposição — independente do tom-base que o CifraClub mostraria por padrão.

**Acceptance Scenarios**:

1. **Given** música com `fk_tonalidade → tonalidades.tom = "A"` e versão com `cifraclub_url`, **When** o backend monta a playlist, **Then** URL termina com `#key=0` (A=0).
2. **Given** música com tom "A#m" (enarmônico), **When** o backend calcula, **Then** `N=1` (normalizado para Bb) e `tom_final="Bb"`.
3. **Given** `cifraclub_url` já tem fragmento `#key=3`, **When** o backend calcula para tom "C", **Then** o fragmento original é **substituído** por `#key=3`.
4. **Given** música sem tonalidade (`fk_tonalidade` null), **When** o backend monta a playlist, **Then** URL entregue como cadastrada, sem `#key=N`, com `tom_ajustado: false`.
5. **Given** tonalidade com valor não-mapeável ("X", "??"), **When** o backend calcula, **Then** `tom_ajustado: false`, URL sem fragmento, log warning.

---

### User Story 6 — Líder cadastra URL da lista CifraClub por Evento (Priority: P1)

Marcos cria uma lista chamada "Culto Domingo Manhã" no CifraClub (~7 min), copia a URL pública e cola no campo "Lista no CifraClub" no detalhe da Escala do LouvorFlow. O sistema valida por regex, mostra preview opcional (nome da lista, owner, nº músicas), e persiste.

**Acceptance Scenarios**:

1. **Given** Evento sem URL cadastrada, **When** o líder cola URL válida e salva, **Then** backend retorna 200 com campo atualizado; UI mostra estado "cadastrada" + preview.
2. **Given** URL inválida (domínio errado, path errado), **When** o líder tenta salvar, **Then** erro inline "URL deve seguir o padrão https://www.cifraclub.com.br/musico/.../repertorio/.../"; backend rejeita com 400.
3. **Given** Evento com URL cadastrada, **When** o líder edita para vazio, **Then** URL removida (null); botões de lista desaparecem.
4. **Given** URL válida mas que retorna 404/privada na API CifraClub, **When** o líder salva, **Then** backend aceita mas UI mostra aviso "Não conseguimos validar essa lista".

---

### User Story 7 — Líder compartilha link único da lista (Priority: P1)

Marcos abre o diálogo da Playlist CifraClub. Vê o botão "Lista no CifraClub" (novo). Toca. WhatsApp abre com mensagem curta: header + URL única + microcopy.

**Acceptance Scenarios**:

1. **Given** Evento com `cifraclub_list_url`, **When** o líder toca "Lista no CifraClub" no diálogo, **Then** abre `wa.me` com mensagem: header bold (tipo+data), `🎸 *Lista no CifraClub*: {url}`, microcopy itálico.
2. **Given** Evento sem `cifraclub_list_url`, **When** o líder abre o diálogo, **Then** no lugar do botão, link discreto "Cadastrar URL da lista CifraClub" que abre o form de edição.
3. **Given** mensagem do share de lista, **Then** NÃO inclui lista detalhada de músicas (isso fica no share da playlist).

---

### User Story 8 — Músico abre lista direto pelo botão na Escala (Priority: P2)

Camila abre a Escala pelo celular. Vê botão "Abrir lista no CifraClub" no header. Toca. O app CifraClub abre a lista.

**Acceptance Scenarios**:

1. **Given** Evento com `cifraclub_list_url`, **When** qualquer usuário autenticado abre o detalhe, **Then** vê o botão no header.
2. **Given** Evento sem URL, **When** o usuário abre o detalhe, **Then** botão NÃO aparece.
3. **Given** o usuário toca o botão, **Then** URL abre em nova aba (`target="_blank"` + `rel="noopener noreferrer"`).

---

### User Story 9 — Líder vê aviso de lista desatualizada (Priority: P2)

Marcos cadastra a URL na quarta. Na sexta, troca uma música da escala. Ao reabrir o detalhe, vê aviso sutil: "Você editou músicas após cadastrar essa lista — atualize no CifraClub".

**Acceptance Scenarios**:

1. **Given** `cifraclub_list_url_updated_at = T0` e `MAX(eventos_musicas.updated_at) > T0`, **When** o líder abre o detalhe, **Then** aviso "Lista possivelmente desatualizada".
2. **Given** sem edições posteriores, **Then** sem aviso.
3. **Given** o líder toca "Atualizar no CifraClub", **Then** URL abre em nova aba (edição é responsabilidade do CifraClub).

---

### Edge Cases

#### Playlist & Versões (ex-025)

- **EC-01**: Escala sem músicas → diálogo abre vazio, stats "0 de 0", ações desabilitadas.
- **EC-02**: Música sem versão selecionada → backend usa fallback (primeira versão com link).
- **EC-03**: Música sem nenhuma versão com link → item aparece sem URL, ações por-linha desabilitadas.
- **EC-04**: Mensagem WhatsApp > 3800 chars → toast orientando "Copiar links".
- **EC-05**: URL `javascript:` cadastrada via API → `isSafeUrl()` no frontend impede renderização clicável.
- **EC-06**: Pop-up bloqueado ao abrir link individual → toast orientando habilitar pop-ups.

#### Transposição (ex-026)

- **EC-07**: Tom "Am", "C#m", "F/A" → extrair apenas nota raiz (A, C#, F); ignorar sufixos.
- **EC-08**: Tom vazio/null → URL sem fragmento, `tom_ajustado: false`.
- **EC-09**: Tom inválido ("X", "??") → URL sem fragmento, log warning.
- **EC-10**: `cifraclub_url` com fragmento pré-existente → substituir pelo calculado; se cálculo impossível, preservar original.
- **EC-11**: Notas enarmônicas (F#/Gb, C#/Db, D#/Eb, G#/Ab, A#/Bb) → mesmo `N`.
- **EC-12**: Tom com "♭"/"♯" (Unicode) → normalizar para "b"/"#" antes de mapear.
- **EC-13**: `cifraclub_url` para `/partituras/` ou `/simplificada.html` → anexar `#key=N` mesmo assim; degradação silenciosa se destino ignorar.

#### Lista por Evento (ex-027)

- **EC-14**: URL com query string (`?utm=share`) → regex aceita; preservar literal.
- **EC-15**: URL para lista-sistema (`/repertorio/favoritas/`, etc.) → aceitar; preview indisponível (texto fixo).
- **EC-16**: URL de lista privada (`public: false`) → salvar com warning "não está acessível publicamente".
- **EC-17**: URL com fragmento (`#anything`) → regex aceita; preservar literal.
- **EC-18**: URL de outro domínio → rejeitar com erro de validação.
- **EC-19**: Lista deletada no CifraClub → 404 ao abrir; líder edita/remove URL.
- **EC-20**: Usuário sem `escalas.write` tenta editar URL → backend 403; UI desabilita campo com tooltip.
- **EC-21**: Multi-tenant → URL isolada por `tenant_id` (invariante existente de Eventos).
- **EC-22**: WhatsApp share da lista atinge limite → toast "mensagem muito longa, use Copiar texto" + clipboard fallback.
- **EC-23**: URL com casing variado (`CifraClub.COM.BR`) → aceitar (regex `i`); preservar literal.

---

## Requirements *(mandatory)*

### Functional Requirements

#### A. Cadastro de URL por Versão (ex-025)

- **FR-001**: Cada versão de música (`Artistas_Musicas`) MUST armazenar campo opcional `cifraclub_url` (string).
- **FR-002**: O campo MUST ser exposto no formulário de criação/edição de versão e nos endpoints REST relevantes (`POST/PUT /api/musicas/:musicaId/versoes`, `POST/PUT /api/musicas/complete`).
- **FR-003**: Validação: aceita string vazia → trata como `null`; valida URL http/https; rejeita `javascript:`, `data:`, `vbscript:`.
- **FR-004**: Sem restrição de domínio para `cifraclub_url` de versão — aceita `cifraclub.com.br`, `m.cifraclub.com.br`, qualquer http/https.

#### B. Playlist CifraClub (ex-025)

- **FR-005**: Novo endpoint `GET /api/eventos/:id/cifraclub-playlist` MUST retornar a playlist ordenada da escala.
- **FR-006**: Cada item da playlist: `{ ordem, musica_id, nome, tom, artista_nome, cifraclub_url, tom_final, tom_ajustado }`. Ordem segue `Eventos_Musicas.ordem`.
- **FR-007**: Resolução do link por música: (1) `versao_selecionada.cifraclub_url`; (2) senão, primeira versão com `cifraclub_url`; (3) senão, `cifraclub_url: null`.
- **FR-008**: Resposta MUST incluir `stats: { total, com_link, sem_link }`.
- **FR-009**: Auth: `ensureAuthenticated` + `ensureTenantContext` (qualquer usuário com tenant ativo).

#### C. Diálogo de Playlist na UI (ex-025)

- **FR-010**: Botão "CifraClub" no header de ações da Escala (`EventoDetail.tsx`), **sempre visível** (independente de ter links cadastrados — estado vazio no diálogo serve como call-to-action). Mobile: icon-only (`Guitar`); Desktop: ícone + label.
- **FR-011**: Diálogo shadcn com: header (título + nome evento + data pt-BR), stat badge, lista ordenada (`<ol>`), e cada item com botão "Abrir" (`ExternalLink`) se houver URL.
- **FR-012**: Footer com 4 ações: "Copiar links", "WhatsApp" (playlist detalhada), "Lista no CifraClub" (link único, condicionado a `cifraclub_list_url`), "Fechar".
- **FR-013**: "Copiar links" MUST copiar texto plano numerado para clipboard com confirmação visual (ícone Check 3s). MUST incluir **todas** as músicas na numeração — músicas sem `cifraclub_url` aparecem como `_(sem cifra cadastrada)_` para manter a ordenação visível e evidenciar lacunas.
- **FR-014**: "WhatsApp" MUST abrir `wa.me/?text=<encoded>` com playlist formatada. Guard `WHATSAPP_URL_SAFE_LIMIT = 3800`.
- **FR-015**: Formato da mensagem WhatsApp da playlist: header `🎸 Cifras — {tipo_evento}`, subtitle com data+stats, lista numerada (nome+tom+artista+URL), microcopy final.
- **FR-016**: Músicas sem link aparecem como `_(sem cifra cadastrada)_` em itálico.

#### D. Transposição Automática #key=N (ex-026)

- **FR-017**: Para cada música da playlist com `cifraclub_url` e `musicas.fk_tonalidade` válido, o sistema MUST anexar `#key=<N>` correspondente ao tom-base da composição (lido de `musicas.fk_tonalidade → tonalidades.tom`). Tabela fixa: `A=0, Bb=1, B=2, C=3, Db=4, D=5, Eb=6, E=7, F=8, F#=9, G=10, Ab=11`. Sem campo novo — nenhum override per-escala nesta entrega.
- **FR-018**: O sistema MUST aceitar grafias "♯/♭" e "#/b", e tratar enarmônicos como equivalentes (F#/Gb → 9, C#/Db → 4, etc.).
- **FR-019**: O sistema MUST extrair apenas a nota raiz (descartar `m`, `maj7`, `/A`, etc.) antes de calcular `N`.
- **FR-020**: Fragmento `#key=…` pré-existente na URL MUST ser substituído pelo calculado. Query string preservada.
- **FR-021**: Se cálculo impossível (dado faltando/inválido) OU a URL não contém `cifraclub.com.br` (case-insensitive), URL MUST ser entregue **sem alteração** (fragmento original preservado), com flag `tom_ajustado: false`.
- **FR-022**: UI da playlist MUST exibir `tom_final` (grafia canônica CifraClub) por item, e quando `tom_ajustado: false`, indicador visual sutil com tooltip.
- **FR-023**: `#key=N` MUST ser idempotente (mesmo input → mesma URL).
- **FR-024**: Texto do WhatsApp/clipboard MUST usar a URL final com `#key=N`, não a bruta.

#### E. Lista Pública por Evento (ex-027)

- **FR-025**: O sistema MUST permitir cadastrar, editar e remover uma única URL de lista CifraClub por Evento.
- **FR-026**: Validação por regex: `^https://www\.cifraclub\.com\.br/musico/(\d+)/repertorio/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)/?(\?[^#]*)?(#.*)?$` (case-insensitive). URLs de outros domínios MUST ser rejeitadas.
- **FR-027**: Persistência: 2 novas colunas em `Eventos` — `cifraclub_list_url TEXT NULL` + `cifraclub_list_url_updated_at TIMESTAMPTZ NULL`. Timestamp atualizado automaticamente quando URL muda.
- **FR-028**: `GET /api/eventos/:id` MUST expor `cifraclub_list_url`, `cifraclub_list_url_updated_at`, e `cifraclub_list_url_stale` (derivado: `MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at`).
- **FR-029**: `POST/PUT /api/eventos` MUST aceitar campo opcional `cifraclub_list_url` com validação do FR-026. Vazio → null.
- **FR-030**: Botão "Abrir lista no CifraClub" no header da Escala, visível **somente** quando URL cadastrada. `target="_blank"` + `rel="noopener noreferrer"`.
- **FR-031**: Botão "Lista no CifraClub" no diálogo da Playlist (FR-012), visível **somente** quando URL cadastrada. Quando ausente, link discreto "Cadastrar URL da lista CifraClub" abre o form de edição.
- **FR-032**: Share da lista: `wa.me/?text=<encoded>` com mensagem curta — header (tipo+data), `🎸 *Lista no CifraClub*: {url}`, microcopy. MUST NOT incluir lista detalhada de músicas.
- **FR-033**: Aviso "Lista possivelmente desatualizada" quando `MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at`. CTA "Atualizar no CifraClub" abre a URL.
- **FR-034**: Criação/edição de `cifraclub_list_url` MUST exigir `escalas.write`. Leitura: qualquer autenticado com tenant ativo. UI MUST desabilitar campo com tooltip para usuários sem permissão.
- **FR-035**: Preview opcional no formulário: ao colar URL válida, frontend chama `GET https://api.cifraclub.com.br/v3/songbook/{listId}` (timeout 3s, sem retry, sem bloquear cadastro). Mostra nome, owner, totalSongs, badge pública/privada. Falha = preview some. Zero código backend.
- **FR-036**: Multi-tenant: `cifraclub_list_url` isolada por `tenant_id` (invariante existente de Eventos).

#### F. Coexistência de Shares

- **FR-037**: Os dois fluxos de share (playlist detalhada e link único da lista) MUST coexistir como botões independentes no diálogo. O share original (playlist) MUST permanecer inalterado — MUST NOT incluir `cifraclub_list_url`, MUST NOT ter checkbox de merge.

### Key Entities

- **Artistas_Musicas** (versão): ganha `cifraclub_url: string | null` (URL http/https da cifra no CifraClub).
- **Eventos**: ganha `cifraclub_list_url: string | null` (URL de lista pública, regex específica) e `cifraclub_list_url_updated_at: timestamp | null`.
- **Lista CifraClub** (entidade externa): não persistida. Consultada via API pública `/v3/songbook/{listId}` para preview opcional.
- **Tom musical** (entidade conceitual): nota raiz (A..G + modificador) → índice cromático `0..11`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥25% das versões de música com `cifraclub_url` preenchido em 30 dias (proxy de adoção).
- **SC-002**: ≥40% das escalas com ≥1 música com link CifraClub em 30 dias.
- **SC-003**: ≥90% das músicas com URL e tom válido entregam `#key=N` correto (verificação manual em 30 amostras pós-deploy).
- **SC-004**: Tempo "abrir escala → músico tocando cifra no tom certo" ≤30 segundos no fluxo end-to-end.
- **SC-005**: ≤5% de músicas com `tom_ajustado: false` após 30 dias de uso.
- **SC-006**: Zero erros 500 do cálculo de `#key=N` em 30 dias.
- **SC-007**: ≥30% das escalas com `cifraclub_list_url` cadastrada em 60 dias.
- **SC-008**: Zero vazamentos cross-tenant em 30 dias (validado por testes automatizados).
- **SC-009**: Zero regressões — 100% dos testes anteriores continuam passando.
- **SC-010**: NPS qualitativo ≥40 em pesquisa com 10 líderes após 30 dias.

---

## Assumptions

- **A1**: Líderes têm (ou criarão) conta no CifraClub (gratuita).
- **A2**: URLs e API pública do CifraClub continuam funcionando durante o ciclo de vida da feature.
- **A3**: O fragmento `#key=N` é respeitado por apps e web reader oficiais do CifraClub.
- **A4**: Tom no LouvorFlow é string curta ("A", "Bb", "C#m") em grafia de letras brasileira.
- **A5**: Tabela cromática absoluta `A=0..Ab=11` — sem necessidade de cadastrar tom-base por URL.
- **A6**: Tom modal (Am vs A) compartilha mesma raiz cromática para `#key=N`.
- **A7**: O LouvorFlow não toma responsabilidade pelo conteúdo no CifraClub — apenas armazena URLs.

---

## Out of Scope

- **OOS-1**: Criação programática de listas no CifraClub (requer API privada/parceria — Fase 3).
- **OOS-2**: Sync automático entre escalas LouvorFlow e listas CifraClub.
- **OOS-3**: Múltiplas URLs de lista por Evento (apenas 1 no MVP).
- **OOS-4**: Suporte a outros provedores (Cifras.com.br, Ultimate Guitar, etc.).
- **OOS-5**: Autocompletar `cifraclub_url` a partir do nome da música (Fase 2).
- **OOS-6**: Cifra/letra exibida dentro do LouvorFlow (delegar ao CifraClub).
- **OOS-7**: Capodastro (`#capo=N`) — fora de escopo.
- **OOS-8**: Telemetria/analytics formal (apenas log backend e console.debug).
- **OOS-9**: Preview rico da lista (miniaturas, cifras inline) — delegar ao CifraClub.
- **OOS-10**: Histórico de URLs (versionamento). Apenas valor atual persistido.

---

## Dependencies

- **D1**: Listas públicas e API `/v3/songbook/{id}` do CifraClub continuam funcionando (risco baixo, monitorável).
- **D2**: Utilitário `isSafeUrl` (frontend `lib/utils.ts`) e `safeUrlSchema` (backend validators) — já existem.
- **D3**: Componentes `EscalaShareActions` (pattern de share, `WHATSAPP_URL_SAFE_LIMIT=3800`) — já existem.
- **D4**: Ícone `Guitar` de `lucide-react` — já importado em `EventoDetail.tsx`.

---

## Open Questions

| ID | Pergunta | Status | Resolução |
|----|----------|--------|-----------|
| Q1 | Preview da lista via API CifraClub: frontend ou backend? | Resolvido | Frontend direto, falha graciosa |
| Q2 | Persistir `cifraclub_list_url` como coluna ou tabela polimórfica? | Resolvido | Coluna direta + timestamp |
| Q3 | Share da lista: independente ou opt-in? | Resolvido | Botão independente |
| Q4 | `#key=N`: offset ou absoluto? | Resolvido | Absoluto A=0..Ab=11 |
| Q5 | Fragmentos pré-existentes na URL? | Resolvido | Substituir fragmento, preservar query |
| Q6 | `#key=0` explícito? | Resolvido | Sempre anexar |
| Q7 | Grafia canônica do `tom_final`? | Resolvido | Grafia CifraClub |
