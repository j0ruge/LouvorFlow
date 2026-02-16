# Data Model: Backend Layered Architecture Refactor

**Branch**: `003-backend-layered-refactor` | **Date**: 2026-02-15

> This refactoring does NOT change the database schema. This document describes the **architectural entities** (layers and shared types) being introduced, not database tables.

## Architectural Entities

### AppError

Custom error class for cross-layer error propagation.

- **Fields**: `message` (string), `statusCode` (number, default 400)
- **Extends**: `Error`
- **Used by**: All Service classes (throw), all Controller classes (catch)
- **Location**: `src/backend/src/errors/AppError.ts`

### Shared Type Interfaces

Interfaces currently duplicated across controllers, consolidated into one file.

- **IdNome**: `{ id: string, nome: string }` — used by Tags, Funcoes, Tipos Eventos, Artistas
- **IdTom**: `{ id: string, tom: string }` — used by Tonalidades
- **IntegranteWithFuncoes**: `{ id, nome, doc_id, email, telefone, Integrantes_Funcoes[] }` — used by Integrantes
- **MusicaRaw**: Raw Prisma result shape for Musicas with nested relations
- **Musica**: Formatted music object with `{ id, nome, tonalidade, tags, versoes, funcoes }`
- **VersaoRaw**: Raw Prisma result shape for artistas_musicas
- **EventoIndexRaw**: Raw Prisma result shape for event listing
- **EventoShowRaw**: Raw Prisma result shape for event detail
- **EventoShowMusica**: Formatted music within an event
- **EventoShowIntegrante**: Formatted integrante within an event
- **Location**: `src/backend/src/types/index.ts`

## Layer Responsibilities per Module

### Simple CRUD Modules (Tags, Tonalidades, Funcoes, Tipos Eventos)

| Layer      | Methods                                                   |
| ---------- | --------------------------------------------------------- |
| Repository | findAll, findById, findByField, findByFieldExcludingId, create, update, delete |
| Service    | listAll, getById, create, update, delete                  |
| Controller | index, show, create, update, delete                       |
| Route      | GET /, GET /:id, POST /, PUT /:id, DELETE /:id            |

### Artistas (Medium)

| Layer      | Methods                                                   |
| ---------- | --------------------------------------------------------- |
| Repository | findAll, findById (with nested include), findByNome, findByNomeExcludingId, create, update, delete |
| Service    | listAll, getById, create, update, delete                  |
| Controller | index, show, create, update, delete                       |
| Route      | GET /, GET /:id, POST /, PUT /:id, DELETE /:id            |

### Integrantes (High)

| Layer      | Methods                                                   |
| ---------- | --------------------------------------------------------- |
| Repository | findAll, findById (with funcoes), findByDocId, findByDocIdExcludingId, create, update, delete, findFuncoesByIntegranteId, findIntegranteFuncao, createIntegranteFuncao, deleteIntegranteFuncao |
| Service    | listAll, getById, create (bcrypt hash), update (partial, optional bcrypt), delete, listFuncoes, addFuncao, removeFuncao |
| Controller | index, show, create, update, delete, listFuncoes, addFuncao, removeFuncao |
| Route      | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:integranteId/funcoes, POST /:integranteId/funcoes, DELETE /:integranteId/funcoes/:funcaoId |

### Musicas (Very High)

| Layer      | Methods                                                   |
| ---------- | --------------------------------------------------------- |
| Repository | findAll (paginated), count, findById (with nested), create, update, delete, findVersoes, findVersaoById, createVersao, updateVersao, deleteVersao, findVersaoDuplicate, findTags, createTag, deleteTag, findTagDuplicate, findFuncoes, createFuncao, deleteFuncao, findFuncaoDuplicate |
| Service    | listAll (pagination logic), getById, create, update, delete, formatMusica, listVersoes, addVersao, updateVersao, removeVersao, listTags, addTag, removeTag, listFuncoes, addFuncao, removeFuncao |
| Controller | index, show, create, update, delete, listVersoes, addVersao, updateVersao, removeVersao, listTags, addTag, removeTag, listFuncoes, addFuncao, removeFuncao |
| Route      | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:musicaId/versoes, POST /:musicaId/versoes, PUT /:musicaId/versoes/:versaoId, DELETE /:musicaId/versoes/:versaoId, GET /:musicaId/tags, POST /:musicaId/tags, DELETE /:musicaId/tags/:tagId, GET /:musicaId/funcoes, POST /:musicaId/funcoes, DELETE /:musicaId/funcoes/:funcaoId |

### Eventos (Very High)

| Layer      | Methods                                                   |
| ---------- | --------------------------------------------------------- |
| Repository | findAll (ordered by date desc), findById (with nested), create, update, delete, findMusicas, createMusica, deleteMusica, findMusicaDuplicate, findIntegrantes, createIntegrante, deleteIntegrante, findIntegranteDuplicate |
| Service    | listAll, getById (formatEventoShow), create (date parsing), update (partial, date parsing), delete, formatEventoIndex, formatEventoShow, listMusicas, addMusica, removeMusica, listIntegrantes, addIntegrante, removeIntegrante |
| Controller | index, show, create, update, delete, listMusicas, addMusica, removeMusica, listIntegrantes, addIntegrante, removeIntegrante |
| Route      | GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:eventoId/musicas, POST /:eventoId/musicas, DELETE /:eventoId/musicas/:musicaId, GET /:eventoId/integrantes, POST /:eventoId/integrantes, DELETE /:eventoId/integrantes/:integranteId |

### Home (Trivial)

| Layer      | Methods                                                   |
| ---------- | --------------------------------------------------------- |
| Controller | index (returns welcome message)                           |
| Route      | GET /                                                     |

No Service or Repository needed.
