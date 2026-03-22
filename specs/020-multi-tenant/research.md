# Research: Migração para Multi-Tenant

**Feature**: 020-multi-tenant | **Date**: 2026-03-21

## Decision 1: Estratégia de Isolamento — App-level filtering vs PostgreSQL RLS

### Decision

**App-level filtering via Prisma `$extends`** com `$allModels` + `$allOperations`.

### Rationale

1. **Simplicidade**: Não requer SQL DDL para policies RLS, nem gestão de `set_config` por transação.
2. **Princípio V (YAGNI)**: O projeto não usa `$queryRaw`/`$executeRaw` em nenhum repositório — todo acesso é via Prisma Client tipado. O risco de "bypass" do isolamento que o RLS mitiga não se aplica.
3. **Manutenibilidade**: Adicionar/remover models do escopo de tenant é uma alteração em uma única lista TypeScript, sem migração SQL.
4. **Performance**: Sem overhead de `$transaction` + `$executeRaw(SELECT set_config(...))` em toda query.
5. **Prisma Docs**: A documentação oficial apresenta ambas as abordagens como válidas. RLS é recomendado quando há acesso direto ao banco por múltiplas aplicações — não é o caso do LouvorFlow.

### Alternatives Considered

- **PostgreSQL RLS**: Mais robusto contra queries raw e acesso direto ao banco. Descartado porque o LouvorFlow acessa o banco exclusivamente via Prisma Client e não há plano de acesso direto por outras aplicações.
- **Schema-per-tenant**: Isolamento total via schemas PostgreSQL separados. Descartado por complexidade operacional desproporcional à escala do projeto (dezenas de igrejas).

---

## Decision 2: Mecanismo de injeção do tenant por requisição

### Decision

**Factory function que retorna Prisma Client estendido**, chamada no middleware de autenticação e injetada em `req.prisma` (ou acessada via wrapper).

### Rationale

1. **Prisma recomenda extended clients por request**: Cada `$extends()` cria uma instância leve (wrapper, não nova conexão). O connection pool é compartilhado.
2. **Sem AsyncLocalStorage**: Evita complexidade de CLS (Continuation Local Storage) que não é necessária dado que o Express já tem `req` como contexto por requisição.
3. **Tipo seguro**: A factory retorna um tipo `PrismaClient` estendido que pode ser usado nos repositórios sem alteração de interface.

### Alternatives Considered

- **AsyncLocalStorage**: Permite acesso ao tenantId sem passar explicitamente. Descartado porque adiciona camada de complexidade sem ganho real — o `req` já carrega o contexto.
- **Middleware que seta global**: Perigoso em ambiente concorrente (race conditions entre requests).

### Implementation Pattern

```typescript
// prisma/cliente.ts
import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

const TENANT_MODELS = [
  'artistas', 'musicas', 'tonalidades', 'funcoes', 'categorias',
  'tipos_Eventos', 'eventos', 'artistas_Musicas', 'musicas_Funcoes',
  'musicas_Categorias', 'eventos_Musicas', 'eventos_Users',
  'eventos_Users_Funcoes', 'users_Funcoes',
  'usersRoles', 'usersPermissions',
];

function forTenant(tenantId: string) {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.includes(model)) return query(args);

          if (operation === 'create') {
            args.data = { ...args.data, tenant_id: tenantId };
          } else if (operation === 'createMany') {
            args.data = args.data.map(d => ({ ...d, tenant_id: tenantId }));
          } else if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            args.where = { ...args.where, tenant_id: tenantId };
          } else if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, tenant_id: tenantId };
          } else if (operation === 'upsert') {
            args.where = { ...args.where, tenant_id: tenantId };
            args.create = { ...args.create, tenant_id: tenantId };
          }

          return query(args);
        },
      },
    },
  });
}

export { basePrisma, forTenant };
export default basePrisma;
```

---

## Decision 3: Tabelas que recebem `tenant_id`

### Decision

**15 tabelas** recebem `tenant_id`:

| Categoria | Tabelas |
| --------- | ------- |
| Domain entities | `artistas`, `musicas`, `tonalidades`, `funcoes`, `categorias`, `tipos_eventos`, `eventos` |
| Domain junctions | `artistas_musicas`, `musicas_funcoes`, `musicas_categorias`, `eventos_musicas`, `eventos_users`, `eventos_users_funcoes`, `users_funcoes` |
| RBAC assignments | `users_roles`, `users_permissions` |

### Rationale

- **Domain entities**: Cada igreja tem seus próprios artistas, músicas, etc.
- **Domain junctions**: Mesmo que parents sejam filtrados, queries diretas a junctions (ex: `prisma.artistas_Musicas.findMany()`) precisam do filtro.
- **RBAC assignments**: Um usuário pode ser `admin` na Igreja A e `musico` na Igreja B (FR-007 + Clarificação).

**Tabelas globais (SEM tenant_id)**:
- `users` — Identidade global (email/senha). Vínculo via `TenantUsers`.
- `roles`, `permissions`, `permissions_roles` — Definições globais de papéis.
- `users_refresh_tokens`, `users_recovery_tokens` — Tokens de sessão (não são dados de domínio).

---

## Decision 4: Unique constraints por tenant

### Decision

Converter unique constraints globais para **compound unique com `tenant_id`**:

| Tabela | Antes | Depois |
| ------ | ----- | ------ |
| `artistas` | `@@unique([nome])` | `@@unique([tenant_id, nome])` |
| `funcoes` | `@@unique([nome])` | `@@unique([tenant_id, nome])` |
| `categorias` | `@@unique([nome])` | `@@unique([tenant_id, nome])` |
| `tipos_eventos` | `@@unique([nome])` | `@@unique([tenant_id, nome])` |
| `tonalidades` | `@@unique([tom])` | `@@unique([tenant_id, tom])` |

Junction table compound uniques também ganham `tenant_id` no compound.

### Rationale

FR-009: "Duas igrejas podem ter um artista com o mesmo nome sem conflito."

---

## Decision 5: Fluxo de login multi-tenant

### Decision

**Two-step login** quando o usuário pertence a múltiplos tenants:

1. `POST /api/sessions` (email + password):
   - Se 1 tenant: retorna `{ user, token, refresh_token }` (fluxo atual + `tenantId` no JWT).
   - Se N tenants: retorna `{ requires_tenant_selection: true, tenants: [...], selection_token }` com HTTP 200.
2. `POST /api/sessions/select-tenant` (selection_token + tenantId):
   - Valida selection_token (JWT temporário, curta duração ~5min).
   - Valida que o usuário pertence ao tenant.
   - Retorna `{ user, token, refresh_token }` com `tenantId` no JWT.

### Rationale

- O `selection_token` é um JWT temporário que carrega o `userId` mas sem `tenantId`. Impede que o frontend selecione um tenant sem autenticação prévia.
- HTTP 200 (não 302 ou 401) porque a autenticação foi bem-sucedida — só falta a seleção de contexto.
- O campo `requires_tenant_selection` é explícito para facilitar parsing no frontend.

### JWT Payload (após seleção)

```json
{
  "sub": "<userId>",
  "tenantId": "<tenantId>",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Decision 6: Super-admin — role de nível sistema

### Decision

Nova role `super-admin` no seed, **sem contexto de tenant**. Endpoints de gestão de tenants verificam esta role. O super-admin opera com o `basePrisma` (sem filtro de tenant) para poder acessar dados cross-tenant.

### Rationale

- Separação clara: `admin` = gerenciar dentro de uma igreja, `super-admin` = gerenciar a plataforma.
- O admin existente (seed) será elevado a `super-admin` e também atribuído como `admin` no tenant padrão.

### Implementation

- Middleware `ensureSuperAdmin`: verifica se `req.user` tem role `super-admin` (global, sem tenantId no where).
- Rotas `/api/igrejas/*`: protegidas por `ensureAuthenticated + ensureSuperAdmin`.
- Super-admin bypass: quando `tenantId` não está no JWT (super-admin logou sem selecionar tenant), usa `basePrisma`.

---

## Decision 7: Estratégia de migração de dados

### Decision

**Single migration em 3 etapas** (executada dentro de uma Prisma migration + script de seed):

1. **Schema changes**: Adicionar `tenant_id` (nullable) em todas as 15 tabelas + criar models `Tenant` e `TenantUsers`.
2. **Backfill** (via migration SQL): Criar tenant padrão, preencher `tenant_id` de todos os registros existentes, criar `TenantUsers` para todos os users existentes, preencher `tenant_id` nas tabelas de assignment RBAC.
3. **Finalize**: Tornar `tenant_id` NOT NULL, criar índices, atualizar unique constraints para compound.

### Rationale

- Executar tudo em uma migration garante atomicidade.
- O tenant padrão é criado com UUID fixo (hardcoded) para que o backfill funcione sem subqueries complexas.
- Após a migration, todos os dados existentes estão no tenant padrão e o sistema opera normalmente.
