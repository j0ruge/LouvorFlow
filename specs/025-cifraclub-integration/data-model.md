# Phase 1 — Data Model: Integração CifraClub

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-24

## Resumo de impacto no modelo de dados

| Camada | Mudança |
|---|---|
| **Banco PostgreSQL** | 2 migrações: (1) `cifraclub_url TEXT` em `artistas_musicas`; (2) `cifraclub_list_url TEXT` + `cifraclub_list_url_updated_at TIMESTAMPTZ` em `eventos`. Sem índices novos. |
| **Prisma schema** | Models `Artistas_Musicas` e `Eventos` ganham campos. |
| **TypeScript types (backend)** | Tipos de versão ganham `cifraclub_url`. Tipos de evento ganham 3 campos (2 persistidos + 1 derivado). Novo tipo `CifraclubPlaylistResponse`. |
| **Zod schemas (frontend)** | Schemas de versão e evento atualizados + novo schema para playlist response. |

Mudança puramente aditiva, sem breaking change.

---

## Entidades modificadas

### `Artistas_Musicas` (versão de música)

| Atributo | Tipo Prisma | Origem | Notas |
|---|---|---|---|
| `id` | `String @id @default(uuid()) @db.Uuid` | Existente | PK |
| `cifraclub_url` | `String? @db.Text` | **NOVO** | URL http/https da cifra no CifraClub. Validada por `safeUrlSchema`. NULL = não cadastrada. |
| `...` | | Existente | Demais campos inalterados |

### `Eventos` (escala)

| Atributo | Tipo Prisma | Origem | Notas |
|---|---|---|---|
| `id` | `String @id @default(uuid()) @db.Uuid` | Existente | PK |
| `cifraclub_list_url` | `String? @db.Text` | **NOVO** | URL pública de lista CifraClub. Validada por regex específica. NULL = não cadastrada. |
| `cifraclub_list_url_updated_at` | `DateTime? @db.Timestamptz(6)` | **NOVO** | Timestamp do último set/change. NULL quando URL nunca setada ou removida. |
| `...` | | Existente | Demais campos inalterados |

### Campos derivados (não persistidos)

| Campo | Tipo | Computação | Endpoint |
|---|---|---|---|
| `cifraclub_list_url_stale` | `boolean` | `cifraclub_list_url != null && MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at` | `GET /api/eventos/:id` |
| `tom_final` | `string` | Grafia canônica CifraClub do tom da música | `GET /api/eventos/:id/cifraclub-playlist` |
| `tom_ajustado` | `boolean` | Se `#key=N` foi efetivamente calculado e anexado | `GET /api/eventos/:id/cifraclub-playlist` |

---

## Migrações SQL

### Migração 1: `add_cifraclub_url_to_artistas_musicas`

```sql
ALTER TABLE "artistas_musicas" ADD COLUMN "cifraclub_url" TEXT;
```

### Migração 2: `add_cifraclub_list_url_to_eventos`

```sql
ALTER TABLE "eventos"
  ADD COLUMN "cifraclub_list_url" TEXT,
  ADD COLUMN "cifraclub_list_url_updated_at" TIMESTAMPTZ;
```

---

## Novo tipo: CifraclubPlaylistResponse

```typescript
interface CifraclubPlaylistItem {
  ordem: number;
  musica_id: string;
  nome: string;
  tom: string | null;
  tom_final: string | null;
  tom_ajustado: boolean;
  artista_nome: string;
  cifraclub_url: string | null;
}

interface CifraclubPlaylistResponse {
  evento: {
    id: string;
    data: string;
    descricao: string;
    tipo_evento: string;
  };
  playlist: CifraclubPlaylistItem[];
  stats: { total: number; com_link: number; sem_link: number };
  cifraclub_list_url: string | null;
}
```

---

## Entidades externas (não persistidas)

### Lista CifraClub (preview)

Consultada via `GET https://api.cifraclub.com.br/v3/songbook/{listId}` apenas no frontend para preview.

```typescript
interface ListPreview {
  name: string;
  ownerName: string;
  totalSongs: number;
  isPublic: boolean;
}
```

### Tabela cromática (constante hardcoded)

```typescript
const CHROMATIC_MAP = {
  'A': 0, 'Bb': 1, 'B': 2, 'C': 3, 'Db': 4, 'D': 5,
  'Eb': 6, 'E': 7, 'F': 8, 'F#': 9, 'G': 10, 'Ab': 11
};
```
