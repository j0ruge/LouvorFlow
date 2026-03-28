# Data Model: Link de Convite para Integrantes

**Feature**: 023-invite-link | **Date**: 2026-03-28

## New Entity: InviteTokens

### Fields

| Field        | Type      | Required | Unique | Default     | Description                              |
|-------------|-----------|----------|--------|-------------|------------------------------------------|
| id          | UUID      | Yes      | Yes    | uuid_v4()   | Identificador do registro                |
| token       | UUID      | Yes      | Yes    | uuid_v4()   | Token público usado na URL do convite    |
| tenant_id   | UUID      | Yes      | No     | —           | FK para Tenant — tenant do convite       |
| created_by  | UUID      | Yes      | No     | —           | FK para Users — líder que gerou          |
| expires_at  | Timestamp | Yes      | No     | —           | Calculado: created_at + 2 horas          |
| used_at     | Timestamp | No       | No     | null        | Preenchido quando convite é aceito       |
| used_by     | UUID      | No       | No     | null        | FK para Users — quem aceitou o convite   |
| revoked_at  | Timestamp | No       | No     | null        | Preenchido quando líder revoga           |
| created_at  | Timestamp | Yes      | No     | now()       | Data de criação                          |
| updated_at  | Timestamp | Yes      | No     | auto        | Atualizado automaticamente               |

### Indexes

| Index        | Fields     | Type   | Purpose                              |
|-------------|------------|--------|--------------------------------------|
| PK          | id         | Unique | Chave primária                       |
| UQ_token    | token      | Unique | Busca rápida por token na URL        |
| IX_tenant   | tenant_id  | Index  | Listagem de convites por tenant      |

### Relationships

| Relationship   | Target  | Type | On Delete | Description                        |
|---------------|---------|------|-----------|------------------------------------|
| tenant        | Tenant  | N:1  | Restrict  | Tenant ao qual o convite pertence  |
| creator       | Users   | N:1  | Cascade   | Líder que gerou o convite          |
| user          | Users   | N:1  | SetNull   | Usuário que aceitou (opcional)     |

### State Transitions

```text
                  ┌─────────┐
                  │  ACTIVE  │ (created, not expired, not used, not revoked)
                  └────┬─────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  EXPIRED │ │   USED   │ │ REVOKED  │
    └──────────┘ └──────────┘ └──────────┘
    (expires_at   (used_at     (revoked_at
     < now())      != null)     != null)
```

**State derivation** (computed, not stored):
- **ACTIVE**: `used_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()`
- **EXPIRED**: `used_at IS NULL AND revoked_at IS NULL AND expires_at <= NOW()`
- **USED**: `used_at IS NOT NULL`
- **REVOKED**: `revoked_at IS NOT NULL AND used_at IS NULL`

**State priority** (when multiple conditions apply): USED > REVOKED > EXPIRED > ACTIVE

## Modified Entity: Users

**No schema changes required.** E-mail permanece obrigatório e único. O modelo de Users não sofre alteração.

## Existing Entity: TenantUsers

**No schema changes required.** Vínculo user↔tenant criado automaticamente ao aceitar convite, usando o padrão existente.

## Existing Entity: Tenant

**Relation added**: `InviteTokens[]` — lista de convites gerados para este tenant.

## Existing Entity: Users

**Relations added**:
- `invitesCreated: InviteTokens[]` — convites gerados pelo usuário (como líder)
- `inviteUsed: InviteTokens?` — convite aceito pelo usuário (como participante)
