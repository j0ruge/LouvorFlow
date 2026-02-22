# Data Model: Histórico com Dados Reais

**Feature**: 010-live-historico | **Date**: 2026-02-22

## Existing Entities (no changes)

Esta feature não introduz nem modifica entidades no modelo de dados. Todas as entidades abaixo já existem e são consumidas em modo leitura.

### Evento (tabela `eventos`)

| Campo           | Tipo     | Descrição                          |
|-----------------|----------|------------------------------------|
| id              | UUID     | Identificador único                |
| data            | Date     | Data do evento                     |
| descricao       | String   | Descrição livre do evento          |
| fk_tipo_evento  | UUID (FK)| Referência ao tipo de evento       |
| created_at      | DateTime | Data de criação                    |
| updated_at      | DateTime | Data de atualização                |

**Relationships**:
- `tipoEvento` → `Tipos_Eventos` (N:1)
- `musicas` → `Musicas` via `Eventos_Musicas` (N:N)
- `integrantes` → `Integrantes` via `Eventos_Integrantes` (N:N)

### Tipos_Eventos (tabela `tipos_eventos`)

| Campo      | Tipo     | Descrição                          |
|------------|----------|------------------------------------|
| id         | UUID     | Identificador único                |
| nome       | String   | Nome do tipo (ex: "Culto de Domingo") |

### Frontend Types (existing, unchanged)

**`EventoIndex`** — usado na listagem:

```typescript
{
  id: string;        // UUID
  data: string;      // ISO date string
  descricao: string; // Descrição do evento
  tipoEvento: { id: string; nome: string } | null;
  musicas: { id: string; nome: string }[];
  integrantes: { id: string; nome: string }[];
}
```

**`EventoShow`** — usado no detalhe (já servido por `/escalas/:id`):

```typescript
{
  id: string;
  data: string;
  descricao: string;
  tipoEvento: { id: string; nome: string } | null;
  musicas: { id: string; nome: string; tonalidade: { id: string; tom: string } | null }[];
  integrantes: { id: string; nome: string; funcoes: { id: string; nome: string }[] }[];
}
```

## Data Flow

```text
PostgreSQL → Prisma → Express API → React Query (useEventos) → History.tsx
                                                                    │
                                                      filter: data <= today
                                                      sort: data DESC
                                                                    │
                                                      render cards with real data
```

## Schema Changes

**None.** Nenhuma migração Prisma, nenhum novo endpoint, nenhuma alteração em schemas Zod.
