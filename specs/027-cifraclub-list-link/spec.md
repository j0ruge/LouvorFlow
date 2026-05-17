# Feature Specification: Linkar lista pública do CifraClub por Evento (cifraclub-list-link)

**Feature Branch**: `027-cifraclub-list-link`
**Created**: 2026-05-17
**Status**: Draft
**Input**: User description: "Linkar lista pública do CifraClub por Evento via campo `cifraclub_list_url`, botão 'Abrir lista no CifraClub' no detalhe da Escala e no diálogo da Playlist, WhatsApp share inclui essa URL no topo." (origem: Fase 2.6 / Alternativa B' do roadmap atualizado em `specs/025-cifraclub-playlist-integration/prd.md` §16.3, v1.2 — 2026-05-17)

> **Relação com 025 e 026**:
>
> - **025** (`cifraclub-playlist-integration`) entrega a Playlist CifraClub a partir das URLs cadastradas por versão.
> - **026** (`cifraclub-key-mapping`) enriquece cada URL com `#key=N` para abrir a cifra já no tom da escala.
> - **027** (esta) acrescenta um caminho complementar: o líder cola, por Evento, uma URL pública de **lista** que ele criou manualmente no CifraClub. Isso oferece à equipe um "link único oficial" — toque na URL → app do CifraClub abre a lista nativa, com toda UX do CifraClub (próximo/anterior, scroll automático, modo escuro, transposição, etc.).
>
> 027 **não substitui** 025/026 — convive. A coexistência é parte central desta spec (vide §15 análoga).

---

## Clarifications

### Session 2026-05-17

- Q: Preview da lista CifraClub no cadastro — frontend ou backend? → A: **Frontend direto** (chamada do browser para `https://api.cifraclub.com.br/v3/songbook/{listId}`). CORS já confirmado liberado para `www.cifraclub.com.br` na investigação Playwright. Falha gracefulmente (timeout 3s, sem retry) — preview some mas cadastro segue. Zero código backend para esta capability.
- Q: Persistência do `cifraclub_list_url` — coluna direta, tabela polimórfica ou JSONB? → A: **Coluna direta em `Eventos`** com 2 novos campos: `cifraclub_list_url TEXT NULL` e `cifraclub_list_url_updated_at TIMESTAMPTZ NULL` (atualizado automaticamente sempre que o valor da URL muda, usado pelo critério "desatualizada" do FR-009). Decisão por YAGNI (Princípio V) e Principle II (relações explícitas) — refatorar para tabela polimórfica é trivial se vier um segundo provedor.
- Q: Share da 027 — botão independente ou opt-in no share da 025? → A: **Botão independente** "Compartilhar lista no CifraClub" no diálogo da Playlist CifraClub. Share original da 025 segue intocado. Coerente com decisão `specs/025-cifraclub-playlist-integration/prd.md` §15.5 (dois fluxos separados e bem rotulados em vez de checkbox de merge). Cada botão serve uma audiência clara: 025 = visão detalhada (planejamento); 027 = link único (execução/ensaio).

---

## Contexto

A spec 025 originalmente afirmava que o CifraClub não expunha URLs públicas de listas. A investigação Playwright durante a 026 revisou esse achado: listas EXISTEM com pattern `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/` e são acessíveis sem login quando marcadas `public: true`. A UI do próprio CifraClub oferece botão "Copiar link" + share Facebook/Twitter na página da lista.

Isso destrava a possibilidade de o líder **criar a lista manualmente no CifraClub** (gratuito, ~5–10 min para 5 músicas) e **colar a URL no LouvorFlow** por Evento. O LouvorFlow então oferece atalhos para abrir essa lista e a inclui na mensagem de compartilhamento.

Trade-off central: **sem sync automático**. Se a escala mudar no LouvorFlow após o link ser cadastrado, a lista do CifraClub fica desatualizada até o líder editar manualmente. Essa limitação é aceita explicitamente como custo do caminho "delegado ao CifraClub".

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Líder compartilha link único oficial do CifraClub (Priority: P1)

Marcos terminou de montar a escala do domingo no LouvorFlow. Ele abre a página de listas do CifraClub no celular, cria uma lista nova chamada "Culto Domingo Manhã", adiciona as 5 músicas escolhidas (em ~7 min), copia a URL pública (`/musico/539475470/repertorio/12339923/`) e cola num campo "URL da lista CifraClub" no detalhe da Escala do LouvorFlow. Em seguida, abre o diálogo "Playlist CifraClub" e toca "Compartilhar lista no CifraClub" — uma mensagem curta vai para o grupo do WhatsApp com **uma única URL**. Cada músico toca a URL, o app oficial do CifraClub abre a lista nativa, e o ensaio começa em 30 segundos.

**Why this priority**: é a entrega de valor da feature. Sem isso, a 027 inteira é apenas um campo guardado sem efeito visível.

**Independent Test**: cadastrar uma URL de lista pública conhecida, abrir o diálogo da Playlist CifraClub e confirmar que o botão "Compartilhar lista" gera uma mensagem WhatsApp com a URL no topo. Tocar a URL no celular → app CifraClub abre a lista correta.

**Acceptance Scenarios**:

1. **Given** Evento com `cifraclub_list_url` cadastrada e válida (regex padrão CifraClub), **When** o líder abre o diálogo da Playlist CifraClub, **Then** aparece um botão primário "Compartilhar lista no CifraClub" (além dos botões já existentes da 025).
2. **Given** Evento sem `cifraclub_list_url`, **When** o líder abre o diálogo, **Then** o botão "Compartilhar lista no CifraClub" **não aparece**; aparece um link discreto "Cadastrar URL da lista CifraClub" que abre o formulário de edição focado no campo.
3. **Given** Evento com `cifraclub_list_url`, **When** o líder toca o botão "Compartilhar lista no CifraClub", **Then** abre `wa.me/?text=...` com uma mensagem incluindo header (nome do evento + data), `🎸 *Lista no CifraClub*: <url>` e CTA curta — sem lista detalhada de músicas (essa segue no botão "Compartilhar Playlist" original da 025).

---

### User Story 2 — Líder cadastra/edita a URL da lista no detalhe da Escala (Priority: P1)

Marcos abre o detalhe da Escala no LouvorFlow. No header ou em uma seção próxima às músicas, vê o campo "Lista no CifraClub" (vazio na primeira vez). Cola a URL `https://www.cifraclub.com.br/musico/539475470/repertorio/12339923/`. O sistema valida em tempo real (regex), exibe um preview do nome da lista (consultando a API pública `/v3/songbook/{listId}`), e ele salva. Em outra ocasião, edita ou remove a URL com a mesma facilidade.

**Why this priority**: sem cadastro fluido, US1 fica inutilizada. P1 porque é a porta de entrada da feature.

**Independent Test**: criar/editar/remover a URL no detalhe da Escala e confirmar que o valor persiste no backend (round-trip via GET).

**Acceptance Scenarios**:

1. **Given** Evento sem URL cadastrada, **When** o líder cola uma URL válida e salva, **Then** o backend retorna 200 com o campo atualizado e a UI mostra o estado "cadastrada" + nome da lista (preview opcional via API CifraClub).
2. **Given** URL inválida (formato fora do padrão CifraClub), **When** o líder tenta salvar, **Then** a UI exibe erro inline "URL deve ser do formato https://www.cifraclub.com.br/musico/.../repertorio/.../" e o backend rejeita com 400.
3. **Given** Evento com URL cadastrada, **When** o líder edita o campo para vazio e salva, **Then** a URL é removida (campo nulo) e o botão "Compartilhar lista" desaparece do diálogo.
4. **Given** URL aparentemente válida mas que retorna 404/privada na API CifraClub, **When** o líder salva, **Then** o backend aceita o cadastro (sem bloquear) mas a UI mostra aviso "Não conseguimos validar essa lista — verifique se está pública". Salvar mesmo assim é permitido.

---

### User Story 3 — Músico abre a lista do CifraClub direto pelo botão na Escala (Priority: P2)

Camila (backing vocal) abre a Escala no LouvorFlow pelo celular para revisar quem está escalado. Vê um botão "Abrir lista no CifraClub" próximo ao título do Evento. Toca o botão; o app oficial do CifraClub abre a lista. Após ensaiar, ela volta ao LouvorFlow para conferir os integrantes.

**Why this priority**: caminho alternativo ao WhatsApp para músicos já dentro do LouvorFlow. P2 porque WhatsApp ainda é o canal dominante; este atalho é conveniência, não bloqueia adoção.

**Independent Test**: visualizar um Evento com URL cadastrada e confirmar que o botão "Abrir lista no CifraClub" aparece no header e abre a URL em nova aba (`target="_blank"` + `rel="noopener noreferrer"`).

**Acceptance Scenarios**:

1. **Given** Evento com `cifraclub_list_url` cadastrada, **When** qualquer usuário autenticado com tenant ativo abre o detalhe da Escala, **Then** vê o botão "Abrir lista no CifraClub" próximo ao título.
2. **Given** Evento sem URL, **When** o usuário abre o detalhe, **Then** o botão **não aparece** (espaço fica para o caminho da 025).
3. **Given** o usuário toca o botão, **When** acontece a navegação, **Then** a URL abre em nova aba (desktop) ou redireciona ao app CifraClub via Universal/App Link (mobile).

---

### User Story 4 — Líder entende a limitação de "sem sync automático" (Priority: P2)

Marcos cadastra a URL na quarta-feira. Na sexta, troca uma música da escala no LouvorFlow. Ele vê, na seção "Lista no CifraClub" do detalhe da Escala, um aviso sutil: "Você editou músicas após cadastrar essa lista — atualize a lista no CifraClub para refletir as mudanças". Um link "Abrir lista no CifraClub" o leva direto para a página da lista para editá-la.

**Why this priority**: gerencia expectativa do líder e previne reclamações silenciosas ("o link tava errado"). P2 porque é mitigação de UX, não funcionalidade core.

**Independent Test**: cadastrar URL com `lista_cadastrada_em = T0`; depois alterar `eventos_musicas` (`updated_at > T0`); confirmar que UI mostra aviso de "fora de sincronia".

**Acceptance Scenarios**:

1. **Given** `cifraclub_list_url` cadastrada com timestamp `T_list_url` e a tabela `Eventos_Musicas` do evento foi modificada após `T_list_url`, **When** o líder abre o detalhe da Escala, **Then** UI mostra aviso "Lista possivelmente desatualizada — última edição de músicas em <data>".
2. **Given** Evento sem edições posteriores ao cadastro da URL, **When** o líder abre o detalhe, **Then** UI não mostra nenhum aviso (estado "em sincronia provável").
3. **Given** o usuário toca "Atualizar no CifraClub", **When** acontece a navegação, **Then** a URL abre no app/web (a edição da lista é responsabilidade do CifraClub, não do LouvorFlow).

---

### Edge Cases

- **EC-1**: URL com query string adicional (ex.: `…/repertorio/12339923/?utm=share`). A regex de validação deve aceitar query opcional; persistir como o líder colou (não normalizar).
- **EC-2**: URL apontando para lista-sistema (`/repertorio/favoritas/`, `/consegui-tocar/`, `/ainda-vou-tocar/`). Aceitar — são URLs válidas no padrão, mesmo que o `listId` seja string em vez de número.
- **EC-3**: URL apontando para lista privada (`public: false` no JSON da API). Salvar mesmo assim, mas avisar na UI ("essa lista não está acessível publicamente — músicos podem cair em uma tela de login").
- **EC-4**: URL contendo `#` no final (fragmento). Preservar literalmente — nenhum mecanismo do CifraClub usa fragmento em URLs de lista, mas se o líder colou, manter.
- **EC-5**: URL para outro domínio (`cifras.com.br`, `youtube.com`, etc.). Rejeitar com erro de validação (mensagem clara sobre o domínio esperado).
- **EC-6**: Lista deletada no CifraClub depois de cadastrada (404 ao tocar). Não temos como detectar passivamente — comportamento aceito: o líder vê o erro 404 ao abrir e edita/remove a URL no LouvorFlow.
- **EC-7**: Usuário sem permissão de escrita (`escalas.write`) tenta editar a URL. Backend retorna 403; UI desabilita o campo com tooltip explicativo.
- **EC-8**: Multi-tenant: URL cadastrada por tenant A não deve vazar para tenant B (mesmo invariante de todas as outras escalas — `tenant_id` no `Eventos`).
- **EC-9**: Texto WhatsApp gerado com a URL atinge limite de tamanho. Como a URL é única e curta, é improvável; ainda assim, manter limite `WHATSAPP_URL_SAFE_LIMIT` da 025 e exibir erro orientando "Copiar texto" caso ultrapasse.
- **EC-10**: Cadastrada URL com case diferente (ex.: `CifraClub.COM.BR`). Aceitar via regex `i`; persistir como o líder colou.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir cadastrar, editar e remover uma única URL de lista CifraClub por Evento, através do detalhe da Escala.

- **FR-002**: O sistema MUST validar a URL cadastrada com regex que aceita os patterns `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/` e variantes para listas-sistema (`/repertorio/favoritas/`, `/consegui-tocar/`, `/ainda-vou-tocar/`), com `{userId}` numérico e `{listId}` numérico OU um dos slugs reservados. A barra final é opcional. Query string opcional é aceita. URLs de outros domínios MUST ser rejeitadas.

- **FR-003**: O sistema MUST persistir a URL como string (`text NULL`) em uma coluna do schema de Eventos (ou tabela associada — decisão técnica de plan), com timestamp `updated_at` automático.

- **FR-004**: O endpoint REST de leitura do Evento (`GET /api/eventos/:id`) MUST passar a expor o campo `cifraclub_list_url` (string ou null) no JSON de resposta.

- **FR-005**: Os endpoints REST de criação/edição de Evento MUST aceitar o campo opcional `cifraclub_list_url` no body, com a mesma validação do FR-002. Valor vazio MUST ser tratado como remoção (null).

- **FR-006**: A UI da Escala MUST exibir um botão "Abrir lista no CifraClub" próximo ao título, **somente** quando o Evento tiver `cifraclub_list_url` cadastrada. O botão MUST abrir a URL com `target="_blank"` + `rel="noopener noreferrer"`. Ícone sugerido: lista/queue (lucide `ListMusic` ou similar).

- **FR-007**: O diálogo da Playlist CifraClub (criado pela 025) MUST ganhar um botão adicional "Compartilhar lista no CifraClub" (além dos botões existentes de Copiar/WhatsApp/Fechar), exibido **somente** quando o Evento tiver `cifraclub_list_url` cadastrada.

- **FR-008**: Ao tocar "Compartilhar lista no CifraClub", o sistema MUST abrir `wa.me/?text=<encoded>` com uma mensagem curta no formato: header (tipo do evento + data formatada em pt-BR), linha `🎸 *Lista no CifraClub*: <url>`, e uma microcopy final ("Toque para abrir no app do CifraClub"). A mensagem NÃO MUST incluir lista detalhada de músicas (essa segue no botão da 025).

- **FR-009**: A UI MUST mostrar um aviso visual sutil "Lista possivelmente desatualizada" quando `MAX(eventos_musicas.updated_at) > eventos.cifraclub_list_url_updated_at` (ou critério equivalente). O aviso MUST permitir um clique direto "Atualizar no CifraClub" que abre a URL.

- **FR-010**: A criação/edição de `cifraclub_list_url` MUST exigir permissão `escalas.write` (mesma permissão de edição de outras propriedades do Evento). Leitura segue permissões padrão (qualquer usuário autenticado com tenant ativo).

- **FR-011**: Multi-tenant: o campo MUST estar isolado por tenant — Evento de outro tenant NUNCA expõe sua `cifraclub_list_url` (garantido pelo invariante já existente de `tenant_id` em Eventos).

- **FR-012**: O sistema MUST permitir preview opcional da lista no formulário de cadastro: ao colar uma URL válida (regex do FR-002), o **frontend** dispara `GET https://api.cifraclub.com.br/v3/songbook/{listId}` direto do browser e exibe nome da lista, `userName` (dono), `totalSongs` e badge "pública/privada" baseado em `public: true/false`. A chamada MUST falhar graciosamente: timeout de 3 segundos, sem retry, sem bloquear o cadastro. Se a chamada falhar (timeout, 404, bloqueio por adblocker, CORS recusado, JSON inválido), o preview some silenciosamente e o cadastro segue habilitado. Zero código backend para esta funcionalidade — não criar endpoint proxy.

- **FR-013**: O sistema MUST persistir `cifraclub_list_url` como **duas novas colunas diretas em `Eventos`**: (a) `cifraclub_list_url TEXT NULL` armazena a URL crua; (b) `cifraclub_list_url_updated_at TIMESTAMPTZ NULL` é atualizado pelo backend sempre que (a) muda (criação, edição ou remoção), usado como base do critério de "lista possivelmente desatualizada" do FR-009. Nenhuma tabela nova; nenhuma estrutura polimórfica nesta entrega.

- **FR-014**: O compartilhamento da URL da lista (027) MUST ser feito **exclusivamente** pelo botão independente "Compartilhar lista no CifraClub" descrito em FR-007 e FR-008. O share original da feature 025 (botão "Compartilhar Playlist" no mesmo diálogo) MUST permanecer **inalterado** — não MUST incluir a `cifraclub_list_url`, não MUST oferecer toggle/checkbox. Os dois botões coexistem com mensagens independentes, em linha com a decisão de coexistência da spec 025 §15.5.

### Key Entities *(include if feature involves data)*

- **Evento**: ganha **dois atributos novos**: (1) `cifraclub_list_url: string | null` (URL absoluta com regex específica CifraClub — FR-002); (2) `cifraclub_list_url_updated_at: timestamp | null` (atualizado pelo backend a cada mudança do campo (1); comparado contra `MAX(eventos_musicas.updated_at)` para o critério "desatualizada" do FR-009).
- **Lista CifraClub (entidade externa)**: não persistida no LouvorFlow. Apenas referenciada pela URL. Atributos relevantes acessíveis via API pública `/v3/songbook/{listId}`: `name`, `userName`, `public`, `totalSongs`. Usados apenas como preview opcional na UI (FR-012).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥30% das escalas criadas após o lançamento têm `cifraclub_list_url` cadastrada em 60 dias (proxy de adoção do caminho B').
- **SC-002**: ≥80% das mensagens WhatsApp da 027 (botão "Compartilhar lista") resultam em ao menos 1 tap por outro usuário no grupo (engajamento dos músicos), medido via marcador UTM opcional na URL ou via pesquisa qualitativa.
- **SC-003**: Tempo médio entre "abrir detalhe da Escala com URL cadastrada" e "músico chegou à lista no app do CifraClub" ≤15 segundos no fluxo end-to-end (tap no botão → app CifraClub abre).
- **SC-004**: ≤10% das URLs cadastradas resultam em estado "possivelmente desatualizada" persistente por >7 dias (proxy de qualidade da manutenção; meta indireta de UX do FR-009).
- **SC-005**: Zero vazamentos cross-tenant em 30 dias de uso (validado por testes automatizados e auditoria de logs).
- **SC-006**: Zero regressões na 025/026 — 100% dos testes anteriores continuam passando após esta entrega.
- **SC-007**: NPS qualitativo da feature ≥40 em pesquisa com 10 líderes após 30 dias, com pelo menos 5 citando "compartilhar uma URL só é melhor" ou similar.

---

## Assumptions

- **A1**: Líderes têm conta no CifraClub (gratuita) ou estão dispostos a criar uma. Custo de aquisição zero; processo de 1 min.
- **A2**: Listas no CifraClub continuam públicas via URL durante o ciclo de vida desta feature. Mudança unilateral pela Studio Sol é risco aceito (degradação graceful: o botão continua existindo mas o link cai em 404).
- **A3**: O usuário final está OK com a fricção inicial de **criar a lista manualmente no CifraClub** (~5–10 min para 5 músicas; agilizado pela função "Duplicar lista" do CifraClub nas iterações seguintes).
- **A4**: O LouvorFlow não toma responsabilidade pelo conteúdo da lista no CifraClub — apenas pelo armazenamento da URL e exibição de botões. Edição da lista no CifraClub é externa.
- **A5**: A feature 025 já está em produção (modelo `cifraclub_url` por versão, endpoint da playlist, diálogo da Playlist CifraClub na UI). 027 depende disso para o botão extra no diálogo (FR-007).
- **A6**: A regex de validação do FR-002 é canônica e suficiente para o MVP — não tentamos validar que o `listId` realmente existe ou que `public: true`. Casos negativos viram avisos UI (FR-012, EC-3, EC-6).

---

## Out of Scope

- **OOS-1**: Criação/edição programática de listas no CifraClub a partir do LouvorFlow (Fase 3 / Alternativa C do roadmap 025 §16.3). Requer spike de API privada com login.
- **OOS-2**: Sincronização automática entre Eventos_Musicas do LouvorFlow e a lista no CifraClub. Limitação explícita de A4.
- **OOS-3**: Múltiplas URLs por Evento (lista A, lista B, etc.). Apenas 1 URL por Evento no MVP.
- **OOS-4**: Suporte a Cifras.com.br, Ultimate Guitar, Songbook ou qualquer outro provedor. Esta feature é estritamente CifraClub.
- **OOS-5**: Preview rico da lista no LouvorFlow (carregar miniaturas dos artistas, abrir cifras inline, etc.). Delegar 100% para o app/web do CifraClub.
- **OOS-6**: Histórico de URLs (versionamento). Apenas o valor atual é persistido.

---

## Dependencies

- **D1**: Feature 025 (`cifraclub-playlist-integration`) em produção. FR-007 e UX do diálogo dependem de a 025 existir como está.
- **D2**: Listas públicas e API `/v3/songbook/{id}` do CifraClub continuam funcionando como observado em 2026-05-17. Risco baixo no curto prazo, monitorável.
- **D3**: Função de validação de URL e/ou parser equivalente (idealmente compartilhada com a 025 — `isSafeUrl` já existe em `lib/utils.ts` do frontend e `safeUrlSchema` no backend; estendê-los ou criar regex específica).

---

## Open Questions

| ID | Pergunta | Status | Resolução |
|----|----------|--------|-----------|
| Q1 | Preview da lista via API CifraClub: frontend ou backend? | **Resolvido (2026-05-17)** | Frontend direto, falha graciosa. Vide Clarifications. |
| Q2 | Persistir `cifraclub_list_url` como coluna em `Eventos` ou em tabela polimórfica? | **Resolvido (2026-05-17)** | Coluna direta em `Eventos` + `cifraclub_list_url_updated_at`. Vide Clarifications. |
| Q3 | Botão de share da 027 é independente ou opt-in via checkbox no share da 025? | **Resolvido (2026-05-17)** | Botão independente; share da 025 inalterado. Vide Clarifications. |
