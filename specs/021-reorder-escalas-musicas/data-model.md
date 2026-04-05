# Data Model: Reordenacao de Musicas na Escala

**Branch**: `021-reorder-escalas-musicas` | **Date**: 2026-03-24

## Entity Changes

### Eventos_Musicas (altered)

Tabela pivot que relaciona Eventos (escalas) com Musicas. Novo campo `ordem` adicionado.

| Field | Type | Constraints | Status |
|-------|------|-------------|--------|
| id | UUID | PK, default `uuid()` | Existing |
| evento_id | UUID | FK → Eventos, ON DELETE CASCADE | Existing |
| musicas_id | UUID | FK → Musicas, ON DELETE CASCADE | Existing |
| tenant_id | UUID | FK → Tenant, ON DELETE RESTRICT | Existing |
| **ordem** | **Int** | **NOT NULL, default 0** | **NEW** |
| created_at | DateTime | default `now()` | Existing |
| updated_at | DateTime | `@updatedAt` | Existing |

**Constraints**:
- UNIQUE: `[tenant_id, evento_id, musicas_id]` (existing)
- INDEX: `[tenant_id]` (existing)

**Prisma Schema Change**:

```prisma
model Eventos_Musicas {
  id                              String   @id @default(uuid()) @db.Uuid
  evento_id                       String   @db.Uuid
  musicas_id                      String   @db.Uuid
  tenant_id                       String   @db.Uuid
  ordem                           Int      @default(0)
  created_at                      DateTime @default(now()) @db.Timestamp(6)
  updated_at                      DateTime @updatedAt @db.Timestamp(6)
  // ... relations unchanged
}
```

## Migration Strategy

1. Add `ordem Int @default(0)` to `Eventos_Musicas` model
2. Run `npx prisma migrate dev --name add-ordem-to-eventos-musicas`
3. Execute data migration SQL to populate `ordem` for existing records:

```sql
UPDATE eventos_musicas
SET ordem = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY evento_id
    ORDER BY created_at ASC
  ) AS row_num
  FROM eventos_musicas
) AS subquery
WHERE eventos_musicas.id = subquery.id;
```

## Query Changes

### EVENTO_SHOW_SELECT (types/index.ts)

The `Eventos_Musicas` select must include `ordem` and results must be ordered by it:

```typescript
Eventos_Musicas: {
  select: {
    id: true,       // needed for reorder API
    ordem: true,    // NEW
    eventos_musicas_musicas_id_fkey: {
      select: { id: true, nome: true, musicas_fk_tonalidade_fkey: { select: { id: true, tom: true } } }
    }
  },
  orderBy: { ordem: 'asc' }  // NEW
}
```

### findMusicas (repository)

Must include `orderBy: { ordem: 'asc' }` in the query.

### createMusica (repository)

Must calculate `MAX(ordem) + 1` for the given `evento_id` and assign to new record.

### deleteMusica (service)

After deleting, must recalculate `ordem` for remaining records to close gaps.
