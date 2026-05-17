# Phase 1 — Data Model: 027 CifraClub List Link

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-17

## Resumo de impacto no modelo de dados

| Camada | Mudança |
|---|---|
| **Banco PostgreSQL** | 1 migração: 2 colunas novas (`cifraclub_list_url`, `cifraclub_list_url_updated_at`) na tabela `eventos`. Sem índice novo. Sem default. Sem backfill. |
| **Prisma schema** | Model `Eventos` ganha 2 campos correspondentes. |
| **TypeScript types (backend)** | Tipo `Evento` (e variantes `EventoShow`, `EventoCreate`, `EventoUpdate`) ganha os campos. Selects (`EVENTO_*_SELECT`) atualizados. |
| **Zod schemas (frontend)** | Schema do Evento ganha os 2 campos + `cifraclub_list_url_stale: boolean` derivado. |

Mudança puramente aditiva, sem risco de breaking change para clientes legados.

---

## Entidade modificada

### `Eventos` (model Prisma)

Atributos relevantes para esta feature (existentes + novos):

| Atributo | Tipo Prisma | Origem | Notas |
|---|---|---|---|
| `id` | `String @id @default(uuid()) @db.Uuid` | Existente | PK |
| `tenant_id` | `String @db.Uuid` | Existente | Isolamento multi-tenant; FK para `Tenant` |
| `descricao` | `String` | Existente | Nome do evento |
| `data` | `DateTime` | Existente | Data/hora |
| `tipo_evento` | `String` | Existente | Tipo (ex.: "Culto Domingo Manhã") |
| `cifraclub_list_url` | `String? @db.Text` | **NOVO (027)** | URL pública da lista CifraClub. Validada pela regex `^https://www\.cifraclub\.com\.br/musico/\d+/repertorio/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)/?(\?.*)?$` no app. NULL = não cadastrada. |
| `cifraclub_list_url_updated_at` | `DateTime? @db.Timestamptz(6)` | **NOVO (027)** | Timestamp do último UPDATE em `cifraclub_list_url`. NULL quando a URL nunca foi setada ou foi removida. Usado pelo critério "desatualizada" do FR-009. |
| `updated_at` | `DateTime @updatedAt @db.Timestamp(6)` | Existente | Auto-managed pelo Prisma; **não substitui** o campo dedicado novo (vide research.md §3). |
| `Eventos_Musicas` | `Eventos_Musicas[]` | Existente | Relação 1:N usada para detectar "desatualizada" via `MAX(updated_at)` |

### Schema Prisma (delta)

```prisma
model Eventos {
  id                              String          @id @default(uuid()) @db.Uuid
  // ... campos existentes ...
  cifraclub_list_url              String?         @db.Text                       // NOVO
  cifraclub_list_url_updated_at   DateTime?       @db.Timestamptz(6)             // NOVO
  // ... relações ...
}
```

### Migração SQL

```sql
-- migration: <ts>_add_cifraclub_list_url_to_eventos
ALTER TABLE "eventos"
  ADD COLUMN "cifraclub_list_url" TEXT,
  ADD COLUMN "cifraclub_list_url_updated_at" TIMESTAMPTZ;
```

Sem default. Sem backfill. Sem CHECK constraint. Sem novo índice (busca por `eventos.id` continua O(1) com índice PK existente).

---

## Invariantes

| ID | Invariante | Como garantir |
|---|---|---|
| INV-1 | `cifraclub_list_url`, quando não-nulo, casa a regex do FR-002 | Zod schema no backend (validateRequest middleware) + Zod schema no frontend |
| INV-2 | `cifraclub_list_url_updated_at` é `NULL` ⇔ `cifraclub_list_url` é `NULL` (ambos juntos) | Lógica explícita no `eventos.service.update`: ao setar URL para null, setar timestamp para null junto |
| INV-3 | `cifraclub_list_url_updated_at` muda apenas quando o valor de `cifraclub_list_url` muda (criação, edição com valor diferente, remoção). PATCH parcial sem o campo NÃO muda timestamp. | Lógica do service (vide research.md §3) |
| INV-4 | Multi-tenant: nenhum evento de tenant A expõe seu campo para tenant B | Invariante existente do middleware `ensureTenantContext` + Prisma `$extends` (não muda com 027) |
| INV-5 | `cifraclub_list_url_stale` (campo derivado da resposta) = `MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at`, ou `false` se ambos lados não aplicáveis | Computado no service `isListUrlStale`, exposto na resposta `GET /api/eventos/:id` |

---

## Estados/transições do campo

| Estado | `cifraclub_list_url` | `cifraclub_list_url_updated_at` | Trigger |
|---|---|---|---|
| **Nunca cadastrado** | NULL | NULL | Estado inicial (todo Evento criado antes da migração ou sem URL no payload de create) |
| **Cadastrado** | URL válida (regex OK) | timestamp do create/update | Após primeiro POST/PUT com URL preenchida |
| **Atualizado** | nova URL válida | timestamp do update | PUT com `cifraclub_list_url` ≠ valor persistido |
| **Removido** | NULL | NULL | PUT com `cifraclub_list_url: null` ou string vazia |
| **Inalterado (PATCH parcial)** | mesmo valor anterior | mesmo timestamp anterior | PUT sem o campo no body, ou com mesmo valor |

---

## Entidade externa (não persistida)

### `Songbook` (do CifraClub, leitura só)

Dados retornados por `GET https://api.cifraclub.com.br/v3/songbook/{listId}`. **Não persistimos**, apenas consumimos como preview opcional no frontend.

Subset usado:

| Campo | Tipo | Uso na UI |
|---|---|---|
| `name` | string | Texto principal do preview: "Lista: **{name}**" |
| `userName` | string | Texto secundário: "por {userName}" |
| `totalSongs` | int | Badge: "{totalSongs} músicas" |
| `public` | boolean | Badge "pública"/"privada"; warning UI se `false` (vide EC-3) |
| `lastUpdate` | string (ISO-like) | Não usado no MVP (informativo apenas para debug) |

Campos ignorados nesta feature: `id`, `userId`, `songs[]`, `thumb`, `thumbURLs[]`, `timestamp`, `type`, `status`. Não os armazenamos para evitar acoplamento ao schema do CifraClub.

---

## Compatibilidade & migração de dados

- **Forward**: nenhuma. A migração é puramente aditiva.
- **Backward**: rollback da migração é seguro (`ALTER TABLE eventos DROP COLUMN ...`) já que a coluna é opcional e clientes legados não dependem dela.
- **Backfill**: nenhum. Todos os eventos existentes começam com `cifraclub_list_url = NULL`.
- **Frontend defensivo**: schemas Zod aceitam os 2 novos campos como `.nullable().default(null)` para tolerar respostas de backend pré-027 durante rollout progressivo.
