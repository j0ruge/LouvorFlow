# API Contract: Backend Layered Architecture Refactor

**Branch**: `003-backend-layered-refactor` | **Date**: 2026-02-15

> This refactoring preserves ALL existing endpoints with zero changes to the public API. This document serves as the **contract that must be preserved** — every endpoint, status code, and response shape listed here must be byte-identical after refactoring.

## Common Response Patterns

### Success Response (list)

```text
Status: 200
Body: [ { field1, field2, ... }, ... ]
```

### Success Response (create)

```text
Status: 201
Body: { msg: "... criado/criada com sucesso", <entity>: { ... } }
```

### Success Response (update/delete)

```text
Status: 200
Body: { msg: "... editado/editada/deletado/deletada com sucesso", <entity>: { ... } }
```

### Error Responses

```text
Status: 400  Body: { errors: ["<validation message>"] }
Status: 404  Body: { errors: ["<not found message>"] }
Status: 409  Body: { errors: ["<conflict message>"] }
Status: 500  Body: { errors: ["<generic error message>"] }
```

---

## Endpoints

### Home — `GET /`

| Method | Path | Status | Response |
| ------ | ---- | ------ | -------- |
| GET    | /    | 200    | Welcome message |

### Tags — `/api/tags`

| Method | Path          | Status | Response Shape             |
| ------ | ------------- | ------ | -------------------------- |
| GET    | /             | 200    | `[{ id, nome }]`          |
| GET    | /:id          | 200    | `{ id, nome }`             |
| POST   | /             | 201    | `{ msg, tag: { id, nome } }` |
| PUT    | /:id          | 200    | `{ msg, tag: { id, nome } }` |
| DELETE | /:id          | 200    | `{ msg, tag: { id, nome } }` |

### Tonalidades — `/api/tonalidades`

| Method | Path          | Status | Response Shape                       |
| ------ | ------------- | ------ | ------------------------------------ |
| GET    | /             | 200    | `[{ id, tom }]`                     |
| GET    | /:id          | 200    | `{ id, tom }`                        |
| POST   | /             | 201    | `{ msg, tonalidade: { id, tom } }`   |
| PUT    | /:id          | 200    | `{ msg, tonalidade: { id, tom } }`   |
| DELETE | /:id          | 200    | `{ msg, tonalidade: { id, tom } }`   |

### Funcoes — `/api/funcoes`

| Method | Path          | Status | Response Shape                    |
| ------ | ------------- | ------ | --------------------------------- |
| GET    | /             | 200    | `[{ id, nome }]`                 |
| GET    | /:id          | 200    | `{ id, nome }`                    |
| POST   | /             | 201    | `{ msg, funcao: { id, nome } }`   |
| PUT    | /:id          | 200    | `{ msg, funcao: { id, nome } }`   |
| DELETE | /:id          | 200    | `{ msg, funcao: { id, nome } }`   |

### Tipos Eventos — `/api/tipos-eventos`

| Method | Path          | Status | Response Shape                         |
| ------ | ------------- | ------ | -------------------------------------- |
| GET    | /             | 200    | `[{ id, nome }]`                      |
| GET    | /:id          | 200    | `{ id, nome }`                         |
| POST   | /             | 201    | `{ msg, tipoEvento: { id, nome } }`    |
| PUT    | /:id          | 200    | `{ msg, tipoEvento: { id, nome } }`    |
| DELETE | /:id          | 200    | `{ msg, tipoEvento: { id, nome } }`    |

### Artistas — `/api/artistas`

| Method | Path          | Status | Response Shape                         |
| ------ | ------------- | ------ | -------------------------------------- |
| GET    | /             | 200    | `[{ id, nome }]`                      |
| GET    | /:id          | 200    | `{ id, nome, versoes: [{ id, musica: { id, nome }, bpm, cifras, lyrics, link_versao }] }` |
| POST   | /             | 201    | `{ msg, artista: { id, nome } }`       |
| PUT    | /:id          | 200    | `{ msg, artista: { id, nome } }`       |
| DELETE | /:id          | 200    | `{ msg, artista: { id, nome } }`       |

### Integrantes — `/api/integrantes`

| Method | Path                                  | Status | Response Shape |
| ------ | ------------------------------------- | ------ | -------------- |
| GET    | /                                     | 200    | `[{ id, nome, doc_id, email, telefone, funcoes: [{ id, nome }] }]` |
| GET    | /:id                                  | 200    | `{ id, nome, doc_id, email, telefone, funcoes: [{ id, nome }] }` |
| POST   | /                                     | 201    | `{ msg, integrante: { id, nome, doc_id, email, telefone } }` |
| PUT    | /:id                                  | 200    | `{ msg, integrante: { id, nome, doc_id, email, telefone } }` |
| DELETE | /:id                                  | 200    | `{ msg, integrante: { id, nome, doc_id, email, telefone } }` |
| GET    | /:integranteId/funcoes                | 200    | `[{ id, funcao_id, funcao: { id, nome } }]` |
| POST   | /:integranteId/funcoes                | 201    | `{ msg, registro: { id, musico_id, funcao_id } }` |
| DELETE | /:integranteId/funcoes/:funcaoId      | 200    | `{ msg }` |

### Musicas — `/api/musicas`

| Method | Path                                  | Status | Response Shape |
| ------ | ------------------------------------- | ------ | -------------- |
| GET    | /?page=N&limit=N                      | 200    | `{ items: [Musica], meta: { total, page, per_page, total_pages } }` |
| GET    | /:id                                  | 200    | `Musica` (formatted) |
| POST   | /                                     | 201    | `{ msg, musica: Musica }` |
| PUT    | /:id                                  | 200    | `{ msg, musica: Musica }` |
| DELETE | /:id                                  | 200    | `{ msg, musica: { id, nome } }` |
| GET    | /:musicaId/versoes                    | 200    | `[{ id, artista: { id, nome }, bpm, cifras, lyrics, link_versao }]` |
| POST   | /:musicaId/versoes                    | 201    | `{ msg, versao: { id, artista: { id, nome }, bpm, cifras, lyrics, link_versao } }` |
| PUT    | /:musicaId/versoes/:versaoId          | 200    | `{ msg, versao: { id, artista: { id, nome }, bpm, cifras, lyrics, link_versao } }` |
| DELETE | /:musicaId/versoes/:versaoId          | 200    | `{ msg }` |
| GET    | /:musicaId/tags                       | 200    | `[{ id, tag_id, tag: { id, nome } }]` |
| POST   | /:musicaId/tags                       | 201    | `{ msg, registro: { id, musica_id, tag_id } }` |
| DELETE | /:musicaId/tags/:tagId                | 200    | `{ msg }` |
| GET    | /:musicaId/funcoes                    | 200    | `[{ id, funcao_id, funcao: { id, nome } }]` |
| POST   | /:musicaId/funcoes                    | 201    | `{ msg, registro: { id, musica_id, funcao_id } }` |
| DELETE | /:musicaId/funcoes/:funcaoId          | 200    | `{ msg }` |

**Musica formatted shape**:

```json
{
  id, nome,
  tonalidade: { id, tom },
  tags: [{ id, nome }],
  versoes: [{ id, artista: { id, nome }, bpm, cifras, lyrics, link_versao }],
  funcoes: [{ id, nome }]
}
```

### Eventos — `/api/eventos`

| Method | Path                                        | Status | Response Shape |
| ------ | ------------------------------------------- | ------ | -------------- |
| GET    | /                                           | 200    | `[EventoIndex]` |
| GET    | /:id                                        | 200    | `EventoShow` |
| POST   | /                                           | 201    | `{ msg, evento: { id, data, descricao, tipoEvento: { id, nome } } }` |
| PUT    | /:id                                        | 200    | `{ msg, evento: { id, data, descricao, tipoEvento: { id, nome } } }` |
| DELETE | /:id                                        | 200    | `{ msg, evento: { id, data, descricao, tipoEvento: { id, nome } } }` |
| GET    | /:eventoId/musicas                          | 200    | `[{ id, musicas_id, musica: { id, nome } }]` |
| POST   | /:eventoId/musicas                          | 201    | `{ msg, registro: { id, evento_id, musicas_id } }` |
| DELETE | /:eventoId/musicas/:musicaId                | 200    | `{ msg }` |
| GET    | /:eventoId/integrantes                      | 200    | `[{ id, musico_id, integrante: { id, nome } }]` |
| POST   | /:eventoId/integrantes                      | 201    | `{ msg, registro: { id, evento_id, musico_id } }` |
| DELETE | /:eventoId/integrantes/:integranteId        | 200    | `{ msg }` |

**EventoIndex shape**:

```
{
  id, data, descricao,
  tipoEvento: { id, nome },
  musicas: [{ id, nome }],
  integrantes: [{ id, nome }]
}
```

**EventoShow shape**:

```
{
  id, data, descricao,
  tipoEvento: { id, nome },
  musicas: [{ id, nome, tonalidade: { id, tom } }],
  integrantes: [{ id, nome, funcoes: [{ id, nome }] }]
}
```
