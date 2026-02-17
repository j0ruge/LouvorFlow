# Data Model: Schema & API Alignment

**Feature**: 001-schema-api-alignment
**Date**: 2026-02-14
**Source**: ER diagram + current Prisma schema

## Base Entities

### Artistas
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| nome | String | UNIQUE ("artistas_nome_unico") |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Artistas_Musicas` (versions)

---

### Musicas
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| nome | String | NOT NULL |
| fk_tonalidade | UUID | FK → tonalidades.id, CASCADE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Artistas_Musicas`, `Eventos_Musicas`, `Musicas_Funcoes`, `Musicas_Tags`. Belongs to `Tonalidades`.

---

### Integrantes
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| nome | String | NOT NULL |
| doc_id | String | UNIQUE |
| email | String(255) | UNIQUE |
| senha | String(255) | NOT NULL (hashed via bcryptjs) |
| telefone | String(20) | NULLABLE — **NEW** |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Eventos_Integrantes`, `Integrantes_Funcoes`.
**Note**: `senha` MUST be excluded from all API responses.

---

### Funcoes
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| nome | String | UNIQUE — **NEW constraint** |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Musicas_Funcoes`, `Integrantes_Funcoes`.

---

### Tonalidades
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| tom | String | UNIQUE — **NEW constraint** |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Musicas`.

---

### Tags — **NEW MODEL**
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| nome | String | UNIQUE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Musicas_Tags`.

---

### Eventos
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| data | DateTime | NOT NULL |
| fk_tipo_evento | UUID | FK → tipos_eventos.id, CASCADE |
| descricao | String | NOT NULL |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Eventos_Musicas`, `Eventos_Integrantes`. Belongs to `Tipos_Eventos`.

---

### Tipos_Eventos
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| nome | String | UNIQUE ("tipos_eventos_nome_unico") |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Relations**: Has many `Eventos`.

---

## Junction Tables

### Artistas_Musicas (Versions)
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| artista_id | UUID | FK → artistas.id, CASCADE |
| musica_id | UUID | FK → musicas.id, CASCADE |
| bpm | Int | NULLABLE |
| cifras | String | NULLABLE |
| lyrics | String | NULLABLE |
| link_versao | String | NULLABLE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Uniqueness**: Composite unique on (artista_id, musica_id) to prevent duplicate versions.

---

### Eventos_Musicas
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| evento_id | UUID | FK → eventos.id, CASCADE |
| musicas_id | UUID | FK → musicas.id, CASCADE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Uniqueness**: Composite unique on (evento_id, musicas_id).

---

### Eventos_Integrantes
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| evento_id | UUID | FK → eventos.id, CASCADE |
| fk_integrante_id | UUID | FK → integrantes.id, CASCADE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Uniqueness**: Composite unique on (evento_id, fk_integrante_id).

---

### Integrantes_Funcoes
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| fk_integrante_id | UUID | FK → integrantes.id, CASCADE |
| funcao_id | UUID | FK → funcoes.id, CASCADE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Uniqueness**: Composite unique on (fk_integrante_id, funcao_id).

---

### Musicas_Funcoes
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| musica_id | UUID | FK → musicas.id, CASCADE |
| funcao_id | UUID | FK → funcoes.id, CASCADE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Uniqueness**: Composite unique on (musica_id, funcao_id).

---

### Musicas_Tags — **NEW MODEL**
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| musica_id | UUID | FK → musicas.id, CASCADE |
| tag_id | UUID | FK → tags.id, CASCADE |
| created_at | DateTime | default now() |
| updated_at | DateTime | auto-updated |

**Uniqueness**: Composite unique on (musica_id, tag_id).

---

## Schema Changes Summary (migration)

| Change | Type | Entity |
|--------|------|--------|
| Add `Tags` model | NEW TABLE | tags |
| Add `Musicas_Tags` model | NEW TABLE | musicas_tags |
| Add `telefone` column | NEW COLUMN (nullable) | integrantes |
| Add unique constraint on `nome` | NEW CONSTRAINT | funcoes |
| Add unique constraint on `tom` | NEW CONSTRAINT | tonalidades |
| Add unique constraint on `nome` | NEW CONSTRAINT | tags |
| Add composite unique (artista_id, musica_id) | NEW CONSTRAINT | artistas_musicas |
| Add composite unique (evento_id, musicas_id) | NEW CONSTRAINT | eventos_musicas |
| Add composite unique (evento_id, fk_integrante_id) | NEW CONSTRAINT | eventos_integrantes |
| Add composite unique (fk_integrante_id, funcao_id) | NEW CONSTRAINT | integrantes_funcoes |
| Add composite unique (musica_id, funcao_id) | NEW CONSTRAINT | musicas_funcoes |
| Add composite unique (musica_id, tag_id) | NEW CONSTRAINT | musicas_tags |
