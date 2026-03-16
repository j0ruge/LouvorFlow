# API Contract Changes: 019-frontend-acl-visibility

**Date**: 2026-03-15

## No API response format changes

The `GET /api/profile` endpoint already returns `roles[]` with nested `permissions[]` and direct `permissions[]`. No response schema changes are needed.

## Backend authorization changes (breaking for unauthorized users)

### Routes migrating from `ensureHasRole` to `can()`

All POST/PUT/DELETE domain endpoints change their authorization middleware. Users who previously had any role and could write to any resource will now need the specific permission.

#### Configurações endpoints (5 route files)

```text
POST   /api/artistas          → can(['configuracoes.write'])
PUT    /api/artistas/:id       → can(['configuracoes.write'])
DELETE /api/artistas/:id       → can(['configuracoes.write'])

POST   /api/categorias        → can(['configuracoes.write'])
PUT    /api/categorias/:id     → can(['configuracoes.write'])
DELETE /api/categorias/:id     → can(['configuracoes.write'])

POST   /api/funcoes           → can(['configuracoes.write'])
PUT    /api/funcoes/:id        → can(['configuracoes.write'])
DELETE /api/funcoes/:id        → can(['configuracoes.write'])

POST   /api/tonalidades       → can(['configuracoes.write'])
PUT    /api/tonalidades/:id    → can(['configuracoes.write'])
DELETE /api/tonalidades/:id    → can(['configuracoes.write'])

POST   /api/tipos-eventos     → can(['configuracoes.write'])
PUT    /api/tipos-eventos/:id  → can(['configuracoes.write'])
DELETE /api/tipos-eventos/:id  → can(['configuracoes.write'])
```

#### Integrantes endpoints

```text
POST   /api/integrantes                           → can(['integrantes.write'])
PUT    /api/integrantes/:id                        → can(['integrantes.write'])
DELETE /api/integrantes/:id                        → can(['integrantes.write'])
POST   /api/integrantes/:integranteId/funcoes      → can(['integrantes.write'])
DELETE /api/integrantes/:integranteId/funcoes/:funcaoId → can(['integrantes.write'])
```

#### Escalas (eventos) endpoints

```text
POST   /api/eventos                                → can(['escalas.write'])
PUT    /api/eventos/:id                            → can(['escalas.write'])
DELETE /api/eventos/:id                            → can(['escalas.write'])
POST   /api/eventos/:eventoId/musicas              → can(['escalas.write'])
DELETE /api/eventos/:eventoId/musicas/:musicaId     → can(['escalas.write'])
POST   /api/eventos/:eventoId/integrantes          → can(['escalas.write'])
DELETE /api/eventos/:eventoId/integrantes/:integranteId → can(['escalas.write'])
```

#### Músicas endpoints

```text
POST   /api/musicas/complete                       → can(['musicas.write'])
POST   /api/musicas                                → can(['musicas.write'])
PUT    /api/musicas/:id/complete                   → can(['musicas.write'])
PUT    /api/musicas/:id                            → can(['musicas.write'])
DELETE /api/musicas/:id                            → can(['musicas.write'])
POST   /api/musicas/:musicaId/versoes              → can(['musicas.write'])
PUT    /api/musicas/:musicaId/versoes/:versaoId    → can(['musicas.write'])
DELETE /api/musicas/:musicaId/versoes/:versaoId    → can(['musicas.write'])
POST   /api/musicas/:musicaId/categorias           → can(['musicas.write'])
DELETE /api/musicas/:musicaId/categorias/:categoriaId → can(['musicas.write'])
POST   /api/musicas/:musicaId/funcoes              → can(['musicas.write'])
DELETE /api/musicas/:musicaId/funcoes/:funcaoId     → can(['musicas.write'])
```

## Error response (unchanged)

403 responses continue to use the existing format:

```json
{ "erro": "Acesso negado — permissão insuficiente.", "codigo": 403 }
```

## GET endpoints (unchanged)

All `GET` endpoints remain protected by `ensureAuthenticated` only. Any logged-in user can read all domain data.
