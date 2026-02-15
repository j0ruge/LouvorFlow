# API Contracts: Backend TypeScript Refactor

**Feature**: 002-backend-typescript-refactor
**Date**: 2026-02-15

## Overview

All 59 endpoints are **unchanged** — this document serves as a reference for the existing contracts that must be preserved during the TypeScript migration. No new endpoints, no modified responses.

## Common Types

```typescript
// Standard error response (all endpoints)
interface ErrorResponse {
    errors: string[];
}

// Standard success response with message (create/update/delete)
interface SuccessResponse<T> {
    msg: string;
    [entityName: string]: T | string; // e.g., { msg: "...", artista: {...} }
}

// Paginated response (musicas index only)
interface PaginatedResponse<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

// Reusable entity shapes in API responses
interface IdNome { id: string; nome: string; }
interface IdTom { id: string; tom: string; }
```

---

## 1. Home (1 endpoint)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/` | 200 | `"Rota de Início"` (text) |

---

## 2. Artistas (5 endpoints)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/artistas` | 200 | `IdNome[]` |
| GET | `/api/artistas/:id` | 200 | `{ id, nome, musicas: Versao[] }` |
| POST | `/api/artistas` | 201 | `{ msg, artista: IdNome }` |
| PUT | `/api/artistas/:id` | 200 | `{ msg, artista: IdNome }` |
| DELETE | `/api/artistas/:id` | 200 | `{ msg, artista: IdNome }` |

**Request bodies:**
- POST: `{ nome: string }` (required)
- PUT: `{ nome: string }` (required)

**Error cases:** 400 (missing data), 404 (not found), 409 (duplicate nome), 500

---

## 3. Integrantes (8 endpoints)

### CRUD (5)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/integrantes` | 200 | `IntegranteComFuncoes[]` |
| GET | `/api/integrantes/:id` | 200 | `IntegranteComFuncoes` |
| POST | `/api/integrantes` | 201 | `{ msg, integrante: IntegrantePublic }` |
| PUT | `/api/integrantes/:id` | 200 | `{ msg, integrante: IntegrantePublic }` |
| DELETE | `/api/integrantes/:id` | 200 | `{ msg, integrante: IntegrantePublic }` |

```typescript
interface IntegrantePublic { id: string; nome: string; doc_id: string; email: string; telefone: string | null; }
interface IntegranteComFuncoes extends IntegrantePublic { funcoes: IdNome[]; }
```

**Note:** `senha` is NEVER included in responses (excluded by INTEGRANTE_PUBLIC_SELECT + Prisma $extends).

**Request bodies:**
- POST: `{ nome, doc_id, email, senha, telefone? }` (nome/doc_id/email/senha required)
- PUT: `{ nome?, doc_id?, email?, senha?, telefone? }` (at least one field)

### Junction: Funcoes (3)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/integrantes/:integranteId/funcoes` | 200 | `IdNome[]` |
| POST | `/api/integrantes/:integranteId/funcoes` | 201 | `{ msg }` |
| DELETE | `/api/integrantes/:integranteId/funcoes/:funcaoId` | 200 | `{ msg }` |

---

## 4. Musicas (14 endpoints)

### CRUD (5)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/musicas` | 200 | `PaginatedResponse<MusicaFormatted>` |
| GET | `/api/musicas/:id` | 200 | `MusicaFormatted` |
| POST | `/api/musicas` | 201 | `{ msg, musica: { id, nome, tonalidade: IdTom } }` |
| PUT | `/api/musicas/:id` | 200 | `{ msg, musica: { id, nome, tonalidade: IdTom } }` |
| DELETE | `/api/musicas/:id` | 200 | `{ msg, musica: { id, nome } }` |

```typescript
interface MusicaFormatted {
    id: string;
    nome: string;
    tonalidade: IdTom;
    tags: IdNome[];
    versoes: VersaoFormatted[];
    funcoes: IdNome[];
}

interface VersaoFormatted {
    id: string;
    artista: IdNome;
    bpm: number | null;
    cifras: string | null;
    lyrics: string | null;
    link_versao: string | null;
}
```

**Query params (GET index):** `?page=1&limit=20` (default page=1, limit=20, max limit=100)

### Junction: Versoes (4)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/musicas/:musicaId/versoes` | 200 | `VersaoFormatted[]` |
| POST | `/api/musicas/:musicaId/versoes` | 201 | `{ msg, versao: VersaoFormatted }` |
| PUT | `/api/musicas/:musicaId/versoes/:versaoId` | 200 | `{ msg, versao: VersaoFormatted }` |
| DELETE | `/api/musicas/:musicaId/versoes/:versaoId` | 200 | `{ msg }` |

**Request bodies:**
- POST: `{ artista_id, bpm?, cifras?, lyrics?, link_versao? }` (artista_id required)
- PUT: `{ bpm?, cifras?, lyrics?, link_versao? }`

### Junction: Tags (3)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/musicas/:musicaId/tags` | 200 | `IdNome[]` |
| POST | `/api/musicas/:musicaId/tags` | 201 | `{ msg }` |
| DELETE | `/api/musicas/:musicaId/tags/:tagId` | 200 | `{ msg }` |

**Request body (POST):** `{ tag_id: string }`

### Junction: Funcoes (3) — note: NOT a duplicate of Integrantes funcoes

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/musicas/:musicaId/funcoes` | 200 | `IdNome[]` |
| POST | `/api/musicas/:musicaId/funcoes` | 201 | `{ msg }` |
| DELETE | `/api/musicas/:musicaId/funcoes/:funcaoId` | 200 | `{ msg }` |

**Request body (POST):** `{ funcao_id: string }`

---

## 5. Tonalidades (5 endpoints)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/tonalidades` | 200 | `IdTom[]` |
| GET | `/api/tonalidades/:id` | 200 | `IdTom` |
| POST | `/api/tonalidades` | 201 | `{ msg, tonalidade: IdTom }` |
| PUT | `/api/tonalidades/:id` | 200 | `{ msg, tonalidade: IdTom }` |
| DELETE | `/api/tonalidades/:id` | 200 | `{ msg, tonalidade: IdTom }` |

**Request body:** `{ tom: string }` (required)

---

## 6. Funcoes (5 endpoints)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/funcoes` | 200 | `IdNome[]` |
| GET | `/api/funcoes/:id` | 200 | `IdNome` |
| POST | `/api/funcoes` | 201 | `{ msg, funcao: IdNome }` |
| PUT | `/api/funcoes/:id` | 200 | `{ msg, funcao: IdNome }` |
| DELETE | `/api/funcoes/:id` | 200 | `{ msg, funcao: IdNome }` |

**Request body:** `{ nome: string }` (required)

---

## 7. Tags (5 endpoints)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/tags` | 200 | `IdNome[]` |
| GET | `/api/tags/:id` | 200 | `IdNome` |
| POST | `/api/tags` | 201 | `{ msg, tag: IdNome }` |
| PUT | `/api/tags/:id` | 200 | `{ msg, tag: IdNome }` |
| DELETE | `/api/tags/:id` | 200 | `{ msg, tag: IdNome }` |

**Request body:** `{ nome: string }` (required)

---

## 8. Tipos Eventos (5 endpoints)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/tipos-eventos` | 200 | `IdNome[]` |
| GET | `/api/tipos-eventos/:id` | 200 | `IdNome` |
| POST | `/api/tipos-eventos` | 201 | `{ msg, tipoEvento: IdNome }` |
| PUT | `/api/tipos-eventos/:id` | 200 | `{ msg, tipoEvento: IdNome }` |
| DELETE | `/api/tipos-eventos/:id` | 200 | `{ msg, tipoEvento: IdNome }` |

**Request body:** `{ nome: string }` (required)

---

## 9. Eventos (11 endpoints)

### CRUD (5)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/eventos` | 200 | `EventoIndex[]` |
| GET | `/api/eventos/:id` | 200 | `EventoShow` |
| POST | `/api/eventos` | 201 | `{ msg, evento: EventoBase }` |
| PUT | `/api/eventos/:id` | 200 | `{ msg, evento: EventoBase }` |
| DELETE | `/api/eventos/:id` | 200 | `{ msg, evento: { id, data, descricao } }` |

```typescript
interface EventoBase {
    id: string;
    data: string; // ISO date
    descricao: string;
    tipoEvento: IdNome;
}

interface EventoIndex extends EventoBase {
    musicas: IdNome[];
    integrantes: IdNome[];
}

interface EventoShow extends EventoBase {
    musicas: { id: string; nome: string; tonalidade: IdTom; }[];
    integrantes: { id: string; nome: string; funcoes: IdNome[]; }[];
}
```

**Request body:** `{ data, fk_tipo_evento, descricao }` (all required for POST)

### Junction: Musicas (3)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/eventos/:eventoId/musicas` | 200 | `{ id, nome, tonalidade: IdTom }[]` |
| POST | `/api/eventos/:eventoId/musicas` | 201 | `{ msg }` |
| DELETE | `/api/eventos/:eventoId/musicas/:musicaId` | 200 | `{ msg }` |

**Request body (POST):** `{ musicas_id: string }`

### Junction: Integrantes (3)

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/api/eventos/:eventoId/integrantes` | 200 | `{ id, nome, funcoes: IdNome[] }[]` |
| POST | `/api/eventos/:eventoId/integrantes` | 201 | `{ msg }` |
| DELETE | `/api/eventos/:eventoId/integrantes/:integranteId` | 200 | `{ msg }` |

**Request body (POST):** `{ musico_id: string }`

---

## Error Response Patterns (All Endpoints)

| Status | Condition | Example |
|--------|-----------|---------|
| 400 | Missing required field | `{ errors: ["Nome do artista é obrigatório"] }` |
| 400 | Missing ID param | `{ errors: ["ID de artista não enviado"] }` |
| 404 | Entity not found | `{ errors: ["O artista não foi encontrado ou não existe"] }` |
| 409 | Duplicate entry | `{ errors: ["Já existe um artista com esse nome"] }` |
| 409 | Duplicate junction | `{ errors: ["Registro duplicado"] }` |
| 500 | Server error | `{ errors: ["Erro ao buscar artistas"] }` |

**Total: 59 endpoints across 9 resources. All contracts must be byte-identical after TypeScript migration.**
