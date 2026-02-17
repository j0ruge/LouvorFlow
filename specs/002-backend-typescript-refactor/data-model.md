# Data Model: Backend TypeScript Refactor

**Feature**: 002-backend-typescript-refactor
**Date**: 2026-02-15

## Overview

No schema changes — all 14 Prisma models remain identical. This document defines the **TypeScript type annotations** that will be derived from Prisma's generated types and used across controllers.

## Prisma-Generated Types

All entity types come from `@prisma/client` after running `prisma generate`. No manual type definitions for models.

```typescript
// Auto-generated — imported as:
import type {
    Artistas,
    Artistas_Musicas,
    Eventos,
    Eventos_Musicas,
    Eventos_Integrantes,
    Funcoes,
    Integrantes,
    Integrantes_Funcoes,
    Musicas,
    Musicas_Funcoes,
    Musicas_Tags,
    Tags,
    Tipos_Eventos,
    Tonalidades
} from '@prisma/client';

// Input types — imported via Prisma namespace:
import { Prisma } from '@prisma/client';
// e.g., Prisma.MusicasCreateInput, Prisma.IntegrantesUpdateInput
```

## Base Entities (8)

### Artistas
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| nome | string | unique |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Musicas
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| nome | string | |
| fk_tonalidade | string (UUID) | FK → Tonalidades, cascade delete |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Integrantes
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| nome | string | |
| doc_id | string | unique |
| email | string | unique, varchar(255) |
| senha | string | varchar(255), **excluded from API responses** |
| telefone | string? | varchar(20), optional |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Eventos
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| data | DateTime | date only |
| fk_tipo_evento | string (UUID) | FK → Tipos_Eventos, cascade delete |
| descricao | string | |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Tonalidades
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| tom | string | unique |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Funcoes
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| nome | string | unique |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Tags
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| nome | string | unique |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

### Tipos_Eventos
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK, auto-generated |
| nome | string | unique |
| created_at | DateTime | auto-generated |
| updated_at | DateTime | auto-updated |

## Junction Entities (6)

### Artistas_Musicas (Versions)
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK |
| artista_id | string (UUID) | FK → Artistas, cascade |
| musica_id | string (UUID) | FK → Musicas, cascade |
| bpm | number? | optional |
| cifras | string? | optional |
| lyrics | string? | optional |
| link_versao | string? | optional |
| @@unique | [artista_id, musica_id] | |

### Eventos_Musicas
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK |
| evento_id | string (UUID) | FK → Eventos, cascade |
| musicas_id | string (UUID) | FK → Musicas, cascade |
| @@unique | [evento_id, musicas_id] | |

### Eventos_Integrantes
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK |
| evento_id | string (UUID) | FK → Eventos, cascade |
| fk_integrante_id | string (UUID) | FK → Integrantes, cascade |
| @@unique | [evento_id, fk_integrante_id] | |

### Musicas_Funcoes
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK |
| musica_id | string (UUID) | FK → Musicas, cascade |
| funcao_id | string (UUID) | FK → Funcoes, cascade |
| @@unique | [musica_id, funcao_id] | |

### Musicas_Tags
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK |
| musica_id | string (UUID) | FK → Musicas, cascade |
| tag_id | string (UUID) | FK → Tags, cascade |
| @@unique | [musica_id, tag_id] | |

### Integrantes_Funcoes
| Field | Type | Constraints |
|-------|------|-------------|
| id | string (UUID) | PK |
| fk_integrante_id | string (UUID) | FK → Integrantes, cascade |
| funcao_id | string (UUID) | FK → Funcoes, cascade |
| @@unique | [fk_integrante_id, funcao_id] | |

## Extended Prisma Client Type

The password-stripping middleware produces an extended client type that differs from `PrismaClient`:

```typescript
// prisma/cliente.ts exports:
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;
export default prisma; // instance of ExtendedPrismaClient
```

All controllers import `prisma` from `../../prisma/cliente.js` — the type is inferred automatically.
