# Phase 0 — Research: 027 CifraClub List Link

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-17

Decisões técnicas que destravam o Phase 1 (design). Cada item segue o formato `Decisão · Rationale · Alternativas consideradas`. Todas as decisões já refletem as 3 clarificações fechadas no `/speckit.clarify` (vide `spec.md` §Clarifications) — esta fase apenas detalha a forma técnica de cada uma.

---

## 1. Regex de validação de URL CifraClub (FR-002)

**Decisão**: Regex única, case-insensitive, com query string opcional:

```regex
^https://www\.cifraclub\.com\.br/musico/(\d+)/repertorio/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)/?(\?.*)?$
```

Grupos capturados (para uso futuro / preview):
- Grupo 1: `userId` (numérico).
- Grupo 2: `listId` (numérico ou um dos 3 slugs reservados).
- Grupo 3: query string opcional, **preservada literalmente** se presente.

Função `validateCifraclubListUrl(url): { valid: boolean, userId?: string, listId?: string, isSystemList: boolean }` exposta em `packages/backend/src/lib/cifraclub-list-url.ts` e duplicada (cópia 1:1) em `packages/frontend/src/lib/cifraclub-list-url.ts` (decisão YAGNI sobre criar lib compartilhada por 1 regex).

**Rationale**: A regex cobre 100% dos formatos observados na investigação Playwright (vide `specs/025-cifraclub-playlist-integration/prd.md` §16.2.1 v1.2). Aceita lista custom (`/repertorio/{listId}` numérico) E listas-sistema (`/repertorio/{slug}/`). Case-insensitive (flag implícita no Zod com `i` ou regex `i`) cobre EC-10. Query string opcional cobre EC-1. Domínio fixo `www.cifraclub.com.br` (sem `m.` mobile) — não vimos lista pública em subdomínio mobile durante a investigação; deixar restritivo agora, relaxar se aparecer caso real.

**Alternativas consideradas**:

- **Regex permissivo "qualquer https em cifraclub.com.br"**: rejeitado. Aceitaria cifras individuais, hub editorial, blog, etc. — fora do escopo. Regex específica dá melhor mensagem de erro.
- **Múltiplas regex (uma por variante)**: rejeitado. Uma regex única com alternativa em grupo 2 é mais legível.
- **Validar via API call (HEAD/GET no `/v3/songbook/{id}`)**: rejeitado para validação síncrona — vincula UX a latência externa. Mantemos como preview opcional, não como gate.

---

## 2. Preview da lista no frontend (FR-012)

**Decisão**: Implementar em `packages/frontend/src/lib/cifraclub-list-url.ts`:

```typescript
async function fetchListPreview(url: string, signal: AbortSignal): Promise<ListPreview | null> {
  const parsed = validateCifraclubListUrl(url);
  if (!parsed.valid || !parsed.listId) return null;
  // Listas-sistema (favoritas, etc.) não têm endpoint /v3/songbook/{slug}
  if (parsed.isSystemList) return null;

  try {
    const r = await fetch(`https://api.cifraclub.com.br/v3/songbook/${parsed.listId}`, {
      signal,
      mode: 'cors',
      credentials: 'omit',
    });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      name: data.name,
      ownerName: data.userName,
      totalSongs: data.totalSongs,
      isPublic: data.public === true,
    };
  } catch {
    return null;  // qualquer erro (timeout, CORS, JSON) → sem preview
  }
}
```

A chamada usa `AbortController` com `setTimeout(controller.abort, 3000)`. Componente do form debounce 500ms após o usuário parar de digitar.

**Rationale**: CORS confirmado liberado durante a investigação Playwright (chamada `credentials: 'omit'` retornou JSON em sessão anônima). Timeout de 3s é generoso para uma chamada simples. AbortController + signal permite cancelar em re-input rápido (digite-cole-edite). Falha silenciosa em qualquer erro evita poluir UI com mensagens técnicas. Listas-sistema retornam `null` imediatamente porque não temos endpoint equivalente (a URL é validada como cadastrada mas o preview não é possível — UI mostra fallback "lista do sistema do usuário, sem preview").

**Alternativas consideradas**:

- **Sem AbortController, só timeout via setTimeout()**: rejeitado. Fetch continua rodando em background, gasta banda do usuário em mobile.
- **Preview eager (sem debounce, a cada keystroke)**: rejeitado. Quebra cota de rate-limit eventual do CifraClub e gera ruído visual.
- **Proxy backend (Q1 Option B)**: descartada na clarificação (vide `spec.md` §Clarifications Q1). Decisão fica registrada.

---

## 3. Política de `cifraclub_list_url_updated_at`

**Decisão**: O backend mantém esse campo no método `update` de `eventos.service.ts` da seguinte forma:

- **Set para `NOW()`** se e somente se o valor de `cifraclub_list_url` no payload **difere** do valor atualmente persistido (criação ou modificação).
- **Set para `NULL`** quando `cifraclub_list_url` é removido (payload `null` ou string vazia).
- **Não tocar** quando o payload **não inclui** o campo (PATCH parcial sem URL) OU quando inclui mas o valor é idêntico ao persistido (mantém o timestamp original — não rebumping desnecessário).

Implementação: ler o evento atual antes do update, comparar valores, decidir o set.

**Rationale**: Timestamp dedicado é mais preciso que `eventos.updated_at` (que muda por qualquer edição, ex.: trocar título). O critério do FR-009 ("desatualizada se `MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at`") depende dessa precisão para não dar falso positivo a cada edição de descrição. Não atualizar em PATCH parcial respeita semântica REST (campo não enviado = sem intenção de modificar).

**Alternativas consideradas**:

- **Trigger PostgreSQL**: viável (`BEFORE UPDATE ... IF NEW.cifraclub_list_url IS DISTINCT FROM OLD.cifraclub_list_url`) mas adiciona DDL custom fora do padrão Prisma. Optei por lógica no service (testável via Vitest, transparente para auditoria).
- **Coluna `updated_at` única do `eventos`**: rejeitado. Daria falso positivo em qualquer outra edição (vide rationale acima).
- **Tabela de auditoria separada**: overkill (Princípio V).

---

## 4. Detecção de "lista possivelmente desatualizada" (FR-009)

**Decisão**: Service method em `eventos.service.ts`:

```typescript
async function isListUrlStale(eventoId: string): Promise<boolean> {
  const evento = await prisma.eventos.findUnique({
    where: { id: eventoId },
    select: {
      cifraclub_list_url: true,
      cifraclub_list_url_updated_at: true,
      Eventos_Musicas: {
        select: { updated_at: true },
        orderBy: { updated_at: 'desc' },
        take: 1,
      },
    },
  });
  if (!evento?.cifraclub_list_url || !evento.cifraclub_list_url_updated_at) return false;
  const latestMusicaUpdate = evento.Eventos_Musicas[0]?.updated_at;
  if (!latestMusicaUpdate) return false;
  return latestMusicaUpdate > evento.cifraclub_list_url_updated_at;
}
```

O resultado é exposto no `GET /api/eventos/:id` como novo campo derivado `cifraclub_list_url_stale: boolean` (computado no controller/service, não persistido).

**Rationale**: Query única com `take: 1` é O(1) em índices existentes (`Eventos_Musicas` já tem `@@index([evento_id, ordem])` — ordenação por `updated_at` pode beneficiar de novo índice se virar gargalo, mas para escalas com ≤30 músicas é trivial). Exposto como campo derivado evita lógica duplicada no frontend.

**Alternativas consideradas**:

- **Calcular no frontend** usando dados que já vêm na resposta do `EventoShow`: viável se `Eventos_Musicas[].updated_at` estiver no payload. Hoje não está (per `EVENTO_SHOW_SELECT`). Adicionar 1 campo é alternativa válida; mantemos cálculo backend por encapsular a regra em um lugar.
- **Webhook/notify quando músicas mudam**: overengineering.

---

## 5. UX do botão "Compartilhar lista no CifraClub" (FR-007 + FR-008)

**Decisão**: Acrescentar 1 botão no footer do `CifraclubPlaylistDialog.tsx` (entre os botões existentes "Copiar links", "Compartilhar no WhatsApp" e "Fechar"). O botão tem:

- **Visibilidade condicional**: só renderiza quando `evento.cifraclub_list_url` está preenchida.
- **Label desktop**: "Lista no CifraClub". Mobile (icon-only): ícone `ListMusic` lucide + `aria-label="Compartilhar lista no CifraClub via WhatsApp"`.
- **Click handler**: abre `wa.me/?text=<encoded>` com a mensagem formatada pela função `formatCifraclubListShare(evento)` em `packages/frontend/src/lib/cifraclub-list-share.ts`.

Formato da mensagem:

```text
*{tipo_evento}* — _{data_pt_br}_

🎸 *Lista no CifraClub*: {url}

_Toque para abrir no app do CifraClub._
```

Quando `cifraclub_list_url` não está cadastrada, em vez do botão, o diálogo mostra um link textual discreto "Cadastrar URL da lista CifraClub" que abre o `EventoForm` em modo edição focado no campo (FR-007 / spec US-1 AC-2).

**Rationale**: Posicionar no footer mantém a unidade conceitual "ações do diálogo". Botão independente respeita Q3 — share da 025 fica intocado. Mensagem curta (header + URL + microcopy) evita a poluição que motivou a discussão no §15.5 da 025. Microcopy final orienta o usuário (especialmente Camilas — User Story 3 da 025).

**Alternativas consideradas**:

- **Botão no header da Escala (não no diálogo da Playlist)**: rejeitado. O fluxo natural é abrir o diálogo da Playlist (já que líder vai compartilhar com músicos) e ter ambos os botões juntos. Mantemos o "Abrir lista no CifraClub" no header da Escala apenas para US-3 (acesso direto).
- **Dropdown "Compartilhar" com 2 opções (Lista vs Playlist)**: rejeitado. Adiciona 1 clique a mais; menos discoverable. 2 botões lado a lado é mais explícito.

---

## 6. Migração Prisma e estratégia de rollout

**Decisão**: Uma única migração `<ts>_add_cifraclub_list_url_to_eventos`:

```sql
ALTER TABLE "eventos"
  ADD COLUMN "cifraclub_list_url" TEXT,
  ADD COLUMN "cifraclub_list_url_updated_at" TIMESTAMPTZ;
```

Sem default, sem backfill, sem CHECK constraint (a regex vive no app). Sem novo índice (busca sempre por `id`, já indexado).

**Rationale**: Mudança puramente aditiva. Versões antigas do backend continuam funcionando com a nova coluna (ignoram). Versões antigas do frontend (sem suporte ao campo) ignoram dados desconhecidos no JSON. Zero risco de quebra. Rollout pode ser progressivo: migrar banco primeiro, depois backend, depois frontend — ou tudo num único deploy.

**Alternativas consideradas**:

- **NOT NULL + default ''**: rejeitado. Polui histórico, força lógica de "string vazia == ausente" no app.
- **CHECK constraint com regex no banco**: rejeitado. Replica lógica que o app já valida via Zod; manutenção dupla.

---

## 7. Permissões e isolamento multi-tenant

**Decisão**: Sem mudança na middleware chain de Eventos:

- `GET /api/eventos/:id`: já protegido por `ensureAuthenticated + ensureTenantContext`. Nova coluna entra na resposta automaticamente após atualização do `EVENTO_SHOW_SELECT`.
- `POST/PUT /api/eventos[/:id]`: já protegido por `can(['escalas.write'])`. Validator Zod recebe campo opcional novo. Repositório/Service propaga.
- Multi-tenant: invariante já garantido pelo `tenant_id` interceptado em todas as queries via `$extends` (MEMORY.md "Multi-Tenant Architecture"). Nenhuma mudança necessária.

**Rationale**: Reusar 100% da segurança e isolamento existente. Princípio V (Simplicity) — não inventar nova arquitetura quando a atual cobre.

**Alternativas consideradas**:

- **Permissão dedicada `escalas.cifraclub_list.write`**: rejeitado. Granularidade desnecessária; quem pode editar a escala pode editar essa URL.

---

## 8. Testes (cobertura)

**Decisão**: Cobertura mínima para mergear:

- **Backend unit** (`packages/backend/tests/lib/cifraclub-list-url.test.ts`): regex exaustivo — URLs custom válidas (`/musico/123/repertorio/456/`), system lists (`favoritas`, `consegui-tocar`, `ainda-vou-tocar`), query strings opcionais, casing variado, URLs inválidas (cifras.com.br, youtube.com, http://, sem `www.`, com path extra, com `m.` mobile), `null`/`undefined`/empty.
- **Backend integration** (`packages/backend/tests/services/eventos.service.test.ts`): cenários novos — (a) criar evento com URL → persiste + timestamp set; (b) update com mesma URL → timestamp inalterado; (c) update com URL diferente → timestamp bumped; (d) update removendo URL (null) → timestamp set to null; (e) PATCH parcial sem o campo → timestamp inalterado; (f) `isListUrlStale` true/false segundo critério.
- **Frontend unit** (`packages/frontend/src/tests/lib/cifraclub-list-url.test.ts`): regex (mesma cobertura backend) + `fetchListPreview` com fetch mock (200/404/timeout/CORS error/JSON inválido).
- **Frontend unit** (`packages/frontend/src/tests/lib/cifraclub-list-share.test.ts`): formato da mensagem WhatsApp (header, URL, microcopy, encoding correto de espaços e acentos).
- **Frontend component** (`packages/frontend/src/tests/components/EventoDetail.test.tsx`): botão "Abrir lista" aparece/desaparece; aviso "desatualizada" condicional; click handlers.

**Rationale**: Funções puras (regex + formatter) são triviais de testar com alto ROI. Integration tests garantem que a lógica de timestamp está correta (regra com vários casos sutis). Frontend testa o comportamento condicional dos botões — que é o coração da UX.

**Alternativas consideradas**:

- **E2E com Playwright**: fora do estilo do projeto (consistente com 025/026). Spec não requer.
- **Apenas unit, sem integration**: insuficiente — a regra de bumpar timestamp só validada no service test.
