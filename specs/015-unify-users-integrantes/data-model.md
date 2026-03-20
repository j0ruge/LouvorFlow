# Data Model: Unificação Users/Integrantes

**Date**: 2026-03-15 | **Branch**: `018-unify-users-integrantes`

## Entity Changes

### Users (MODIFIED — absorve campos e relações de Integrantes)

| Field | Type | Constraints | Change |
|-------|------|-------------|--------|
| `id` | UUID | PK, default uuid() | Existing |
| `name` | VARCHAR(255) | NOT NULL | Existing |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Existing |
| `password` | VARCHAR(255) | NOT NULL | Existing |
| `avatar` | VARCHAR(255) | NULLABLE | Existing |
| `telefone` | VARCHAR(20) | NULLABLE | **NEW** (from Integrantes) |
| `created_at` | TIMESTAMP | default now() | Existing |
| `updated_at` | TIMESTAMP | auto-update | Existing |

**New Relations** (absorbed from Integrantes):
- `Eventos_Users[]` — eventos em que o user participa
- `Users_Funcoes[]` — funções musicais do user

**Existing Relations** (unchanged):
- `UsersRoles[]`, `UsersPermissions[]`, `UsersRefreshTokens[]`, `UsersRecoveryTokens[]`

### Integrantes (REMOVED)

Todos os campos e dados migrados para Users. Tabela dropada após migração.

### Eventos_Users (RENAMED from Eventos_Integrantes)

| Field | Type | Constraints | Change |
|-------|------|-------------|--------|
| `id` | UUID | PK, default uuid() | Existing |
| `evento_id` | UUID | FK → Eventos(id), CASCADE | Existing |
| `fk_user_id` | UUID | FK → Users(id), CASCADE | **RENAMED** (was `fk_integrante_id`) |
| `created_at` | TIMESTAMP | default now() | Existing |
| `updated_at` | TIMESTAMP | auto-update | Existing |

**Unique constraint**: `@@unique([evento_id, fk_user_id])`
**Table map**: `@@map("eventos_users")`

### Users_Funcoes (RENAMED from Integrantes_Funcoes)

| Field | Type | Constraints | Change |
|-------|------|-------------|--------|
| `id` | UUID | PK, default uuid() | Existing |
| `fk_user_id` | UUID | FK → Users(id), CASCADE | **RENAMED** (was `fk_integrante_id`) |
| `funcao_id` | UUID | FK → Funcoes(id), CASCADE | Existing |
| `created_at` | TIMESTAMP | default now() | Existing |
| `updated_at` | TIMESTAMP | auto-update | Existing |

**Unique constraint**: `@@unique([fk_user_id, funcao_id])`
**Table map**: `@@map("users_funcoes")`

## Prisma Schema Diff (conceptual)

```prisma
// MODIFIED: Users gains telefone + domain relations
model Users {
  id              String               @id @default(uuid()) @db.Uuid
  name            String               @db.VarChar(255)
  email           String               @unique @db.VarChar(255)
  password        String               @db.VarChar(255)
  avatar          String?              @db.VarChar(255)
  telefone        String?              @db.VarChar(20)          // NEW
  created_at      DateTime             @default(now()) @db.Timestamp(6)
  updated_at      DateTime             @updatedAt @db.Timestamp(6)
  // Auth relations (existing)
  roles           UsersRoles[]
  permissions     UsersPermissions[]
  refresh_tokens  UsersRefreshTokens[]
  recovery_tokens UsersRecoveryTokens[]
  // Domain relations (NEW — absorbed from Integrantes)
  Eventos_Users   Eventos_Users[]
  Users_Funcoes   Users_Funcoes[]

  @@map("users")
}

// RENAMED: Eventos_Integrantes → Eventos_Users
model Eventos_Users {
  id                              String   @id @default(uuid()) @db.Uuid
  evento_id                       String   @db.Uuid
  fk_user_id                      String   @map("fk_user_id") @db.Uuid   // RENAMED
  created_at                      DateTime @default(now()) @db.Timestamp(6)
  updated_at                      DateTime @updatedAt @db.Timestamp(6)
  eventos_users_evento_id_fkey    Eventos  @relation(fields: [evento_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  eventos_users_fk_user_id_fkey   Users    @relation(fields: [fk_user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([evento_id, fk_user_id])
  @@map("eventos_users")
}

// RENAMED: Integrantes_Funcoes → Users_Funcoes
model Users_Funcoes {
  id                                  String   @id @default(uuid()) @db.Uuid
  fk_user_id                          String   @map("fk_user_id") @db.Uuid   // RENAMED
  funcao_id                           String   @db.Uuid
  created_at                          DateTime @default(now()) @db.Timestamp(6)
  updated_at                          DateTime @updatedAt @db.Timestamp(6)
  users_funcoes_funcao_id_fkey        Funcoes  @relation(fields: [funcao_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  users_funcoes_fk_user_id_fkey       Users    @relation(fields: [fk_user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([fk_user_id, funcao_id])
  @@map("users_funcoes")
}

// REMOVED: model Integrantes { ... }
```

## Affected Models (unchanged but relations updated)

### Eventos

- Relation `Eventos_Integrantes[]` → `Eventos_Users[]`
- No field changes

### Funcoes

- Relation `Integrantes_Funcoes[]` → `Users_Funcoes[]`
- No field changes

## Migration Data Flow

```text
┌──────────────┐     merge by email    ┌──────────────┐
│  integrantes │ ─────────────────────► │    users     │
│              │                        │  + telefone  │
│  nome        │  → name               │              │
│  email       │  → email (match key)  │              │
│  telefone    │  → telefone           │              │
│  senha       │  → DISCARDED          │              │
└──────────────┘                        └──────────────┘

┌───────────────────────┐  rename + re-FK  ┌──────────────────┐
│  eventos_integrantes  │ ───────────────► │  eventos_users   │
│  fk_integrante_id     │                  │  fk_user_id      │
└───────────────────────┘                  └──────────────────┘

┌───────────────────────┐  rename + re-FK  ┌──────────────────┐
│  integrantes_funcoes  │ ───────────────► │  users_funcoes   │
│  fk_integrante_id     │                  │  fk_user_id      │
└───────────────────────┘                  └──────────────────┘
```

## Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| `Users.email` | Unique across entire system | FR-006 / SC-006 |
| `Users.telefone` | Max 20 chars, nullable | FR-004 |
| `Users.password` | bcrypt hash, min 6 chars raw (on create via `/api/integrantes`) | Existing auth pattern |
| `Eventos_Users` | Unique(evento_id, fk_user_id) | Existing constraint |
| `Users_Funcoes` | Unique(fk_user_id, funcao_id) | Existing constraint |
