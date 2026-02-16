# API Endpoints Contract: Frontend Consumption

**Branch**: `005-frontend-backend-integration`
**Date**: 2026-02-16
**Base URL**: `http://localhost:3000/api` (configurável via `VITE_API_BASE_URL`)

Este documento lista os endpoints da API que o frontend consumirá nesta fase, com formatos de request/response.

## Formato Padrão de Erro

Todas as respostas de erro seguem:

```json
{
  "erro": "Mensagem descritiva em português",
  "codigo": 400
}
```

| Código | Significado |
| ------ | ----------- |
| 400    | Validação: campo obrigatório ausente ou formato inválido |
| 404    | Recurso não encontrado |
| 409    | Conflito: registro duplicado (email, doc_id, etc.) |
| 500    | Erro interno do servidor |

---

## 1. Integrantes

### GET /integrantes

Lista todos os integrantes com suas funções.

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "nome": "string",
    "doc_id": "string",
    "email": "string",
    "telefone": "string | null",
    "funcoes": [{ "id": "uuid", "nome": "string" }]
  }
]
```

### POST /integrantes

Cria novo integrante. `doc_id` e `email` devem ser únicos.

**Request Body**:

```json
{
  "nome": "string (required)",
  "doc_id": "string (required)",
  "email": "string email (required)",
  "senha": "string (required)",
  "telefone": "string (optional)"
}
```

**Response** `201`:

```json
{
  "msg": "string",
  "integrante": {
    "id": "uuid",
    "nome": "string",
    "doc_id": "string",
    "email": "string",
    "telefone": "string | null"
  }
}
```

**Erros**: `400` (campo obrigatório), `409` (email ou doc_id duplicado)

---

## 2. Músicas

### GET /musicas?page=1&limit=20

Lista músicas com paginação.

**Query Parameters**:

| Param | Tipo    | Default | Min | Max |
| ----- | ------- | ------- | --- | --- |
| page  | integer | 1       | 1   | -   |
| limit | integer | 20      | 1   | 100 |

**Response** `200`:

```json
{
  "items": [
    {
      "id": "uuid",
      "nome": "string",
      "tonalidade": { "id": "uuid", "tom": "string" } | null,
      "tags": [{ "id": "uuid", "nome": "string" }],
      "versoes": [
        {
          "id": "uuid",
          "artista": { "id": "uuid", "nome": "string" },
          "bpm": "number | null",
          "cifras": "string | null",
          "lyrics": "string | null",
          "link_versao": "string | null"
        }
      ],
      "funcoes": [{ "id": "uuid", "nome": "string" }]
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "per_page": "number",
    "total_pages": "number"
  }
}
```

### POST /musicas

Cria nova música.

**Request Body**:

```json
{
  "nome": "string (required)",
  "fk_tonalidade": "uuid (required)"
}
```

**Response** `201`:

```json
{
  "msg": "string",
  "musica": {
    "id": "uuid",
    "nome": "string",
    "tonalidade": { "id": "uuid", "tom": "string" }
  }
}
```

**Erros**: `400` (campo obrigatório, tonalidade não existe)

---

## 3. Eventos

### GET /eventos

Lista todos os eventos com resumo de músicas e integrantes.

**Response** `200`:

```json
[
  {
    "id": "uuid",
    "data": "ISO 8601 string",
    "descricao": "string",
    "tipoEvento": { "id": "uuid", "nome": "string" } | null,
    "musicas": [{ "id": "uuid", "nome": "string" }],
    "integrantes": [{ "id": "uuid", "nome": "string" }]
  }
]
```

### GET /eventos/:id

Retorna detalhes completos de um evento.

**Response** `200`:

```json
{
  "id": "uuid",
  "data": "ISO 8601 string",
  "descricao": "string",
  "tipoEvento": { "id": "uuid", "nome": "string" } | null,
  "musicas": [
    {
      "id": "uuid",
      "nome": "string",
      "tonalidade": { "id": "uuid", "tom": "string" } | null
    }
  ],
  "integrantes": [
    {
      "id": "uuid",
      "nome": "string",
      "funcoes": [{ "id": "uuid", "nome": "string" }]
    }
  ]
}
```

### POST /eventos

Cria novo evento (etapa 1 do fluxo de escalas).

**Request Body**:

```json
{
  "data": "ISO 8601 string (required)",
  "fk_tipo_evento": "uuid (required)",
  "descricao": "string (required)"
}
```

**Response** `201`:

```json
{
  "msg": "string",
  "evento": {
    "id": "uuid",
    "data": "ISO 8601 string",
    "descricao": "string",
    "tipoEvento": { "id": "uuid", "nome": "string" }
  }
}
```

**Erros**: `400` (campo obrigatório, tipo de evento não existe)

### POST /eventos/:eventoId/musicas

Associa uma música ao evento (etapa 2 do fluxo de escalas).

**Request Body**:

```json
{
  "musicas_id": "uuid (required)"
}
```

**Response** `201`: `{ "msg": "string" }`

**Erros**: `400`, `404`

### DELETE /eventos/:eventoId/musicas/:musicaId

Remove associação de música do evento.

**Response** `200`: `{ "msg": "string" }`

### POST /eventos/:eventoId/integrantes

Associa um integrante ao evento (etapa 2 do fluxo de escalas).

**Request Body**:

```json
{
  "musico_id": "uuid (required)"
}
```

**Response** `201`: `{ "msg": "string" }`

**Erros**: `400`, `404`

### DELETE /eventos/:eventoId/integrantes/:integranteId

Remove associação de integrante do evento.

**Response** `200`: `{ "msg": "string" }`

---

## 4. Recursos de Suporte (Lookup Lists)

Estes endpoints fornecem dados para listas de seleção em formulários.

### GET /tonalidades

**Response** `200`: `[{ "id": "uuid", "tom": "string" }]`

### GET /funcoes

**Response** `200`: `[{ "id": "uuid", "nome": "string" }]`

### GET /tipos-eventos

**Response** `200`: `[{ "id": "uuid", "nome": "string" }]`
