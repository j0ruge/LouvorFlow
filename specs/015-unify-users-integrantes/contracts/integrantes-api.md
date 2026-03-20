# API Contract: /api/integrantes (Unified)

**Date**: 2026-03-15 | **Status**: Post-unification contract

> All endpoints operate on the `users` table with field mapping (name↔nome, password↔senha).
> URLs are unchanged for retrocompatibility.

## Endpoints

### GET /api/integrantes

**Description**: Lista todos os users (sem filtro).

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "telefone": "string | null",
    "funcoes": [
      { "id": "uuid", "nome": "string" }
    ]
  }
]
```

**Field mapping**: `users.name` → response `nome`

---

### GET /api/integrantes/:id

**Description**: Retorna um user por ID com funções musicais.

**Response** `200`:

```json
{
  "id": "uuid",
  "nome": "string",
  "email": "string",
  "telefone": "string | null",
  "funcoes": [
    { "id": "uuid", "nome": "string" }
  ]
}
```

**Response** `404`: `{ "erro": "Integrante não encontrado", "codigo": 404 }`

---

### POST /api/integrantes

**Description**: Cria um novo user (com capacidade de login).

**Request body**:

```json
{
  "nome": "string (required)",
  "email": "string (required, unique)",
  "senha": "string (required, min 6 chars)",
  "telefone": "string (optional, max 20 chars)"
}
```

**Field mapping**:
- `nome` → `users.name`
- `senha` → `users.password` (bcrypt hashed)

**Response** `201`:

```json
{
  "msg": "Integrante criado com sucesso",
  "integrante": {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "telefone": "string | null"
  }
}
```

**Response** `409`: `{ "erro": "Email já está em uso", "codigo": 409 }`

---

### PUT /api/integrantes/:id

**Description**: Atualiza dados de um user.

**Request body** (all optional):

```json
{
  "nome": "string",
  "email": "string (unique)",
  "senha": "string (min 6 chars)",
  "telefone": "string (max 20 chars)"
}
```

**Response** `200`:

```json
{
  "msg": "Integrante atualizado com sucesso",
  "integrante": {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "telefone": "string | null"
  }
}
```

---

### DELETE /api/integrantes/:id

**Response** `200`: `{ "msg": "Integrante deletado com sucesso" }`

**Cascade**: Removes all `Eventos_Users` and `Users_Funcoes` records for this user.

---

### GET /api/integrantes/:integranteId/funcoes

**Response** `200`:

```json
[
  { "id": "uuid", "nome": "string" }
]
```

---

### POST /api/integrantes/:integranteId/funcoes

**Request body**:

```json
{
  "funcao_id": "uuid (required)"
}
```

**Response** `201`: `{ "msg": "Função adicionada com sucesso" }`

**Response** `409`: `{ "erro": "Integrante já possui esta função", "codigo": 409 }`

---

### DELETE /api/integrantes/:integranteId/funcoes/:funcaoId

**Response** `200`: `{ "msg": "Função removida com sucesso" }`

---

## Event-Integrante Endpoints (unchanged URLs)

### GET /api/eventos/:eventoId/integrantes

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "nome": "string",
    "funcoes": [
      { "id": "uuid", "nome": "string" }
    ]
  }
]
```

### POST /api/eventos/:eventoId/integrantes

**Request body**:

```json
{
  "fk_integrante_id": "uuid (required)"
}
```

> Note: Field name kept as `fk_integrante_id` in request for retrocompatibility.
> Internally maps to `fk_user_id` in `Eventos_Users`.

**Response** `201`: `{ "msg": "Integrante adicionado ao evento com sucesso" }`

### DELETE /api/eventos/:eventoId/integrantes/:integranteId

**Response** `200`: `{ "msg": "Integrante removido do evento com sucesso" }`
