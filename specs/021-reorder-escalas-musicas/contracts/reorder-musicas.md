# API Contract: Reorder Musicas in Evento

**Branch**: `021-reorder-escalas-musicas` | **Date**: 2026-03-24

## PATCH /api/eventos/:eventoId/musicas/reorder

Reordena as musicas de uma escala. Recebe a lista completa de IDs de musicas na ordem desejada.

### Request

**Method**: PATCH
**Path**: `/api/eventos/:eventoId/musicas/reorder`
**Auth**: Bearer token com `tenantId`
**Permission**: `escalas.write`
**Middleware chain**: `ensureAuthenticated → ensureTenantContext → can(['escalas.write']) → validateRequest`

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| eventoId | UUID | ID do evento (escala) |

**Body** (JSON):

```json
{
  "musicas_ids": [
    "uuid-musica-3",
    "uuid-musica-1",
    "uuid-musica-2"
  ]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| musicas_ids | string[] | Yes | Array de UUIDs. Deve conter exatamente os mesmos IDs de musicas associadas ao evento (sem adicoes, remocoes ou duplicatas). |

**Zod Schema**:

```typescript
export const reorderMusicasBodySchema = z.object({
  musicas_ids: z.array(z.string().uuid('Cada ID deve ser um UUID valido')).min(1, 'Lista de musicas nao pode estar vazia'),
});
```

### Response

**Success (200)**:

```json
{
  "msg": "Ordem das musicas atualizada com sucesso"
}
```

**Errors**:

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Array vazio, UUIDs invalidos, IDs nao correspondem as musicas do evento | `{ "erro": "...", "codigo": 400 }` |
| 401 | Token invalido ou ausente | `{ "erro": "Token invalido", "codigo": 401 }` |
| 403 | Sem permissao `escalas.write` | `{ "erro": "Nao autorizado", "codigo": 403 }` |
| 404 | Evento nao encontrado | `{ "erro": "Evento nao encontrado", "codigo": 404 }` |

## Changes to Existing Endpoints

### GET /api/eventos/:eventoId

**Response change**: `musicas` array now includes `ordem` field and is sorted by it.

Before:

```json
{
  "musicas": [
    { "id": "...", "nome": "Song A", "tonalidade": { "id": "...", "tom": "C" } }
  ]
}
```

After:

```json
{
  "musicas": [
    { "id": "...", "nome": "Song A", "tonalidade": { "id": "...", "tom": "C" }, "ordem": 1 }
  ]
}
```

### POST /api/eventos/:eventoId/musicas

**Behavior change**: New musica receives `ordem = MAX(ordem) + 1` for the given evento. No request body change needed.

### DELETE /api/eventos/:eventoId/musicas/:musicaId

**Behavior change**: After deletion, remaining musicas have their `ordem` values recalculated to maintain a continuous sequence (1, 2, 3, ...). No request/response change.
