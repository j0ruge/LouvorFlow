# Implementation Plan: Link de Convite para Integrantes

**Branch**: `023-invite-link` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-invite-link/spec.md`

## Summary

Implementar sistema de link de convite com expiração de 2h para onboarding de integrantes. O líder gera um link único, envia por qualquer canal (WhatsApp, SMS), e o participante cria sua própria conta via formulário público. O token é validado em cada estado (válido, expirado, usado, revogado, inexistente). Backend segue padrão de recovery tokens; frontend segue padrão de telas públicas (redefinir-senha).

## Technical Context

**Language/Version**: TypeScript 5.9 (backend + frontend)
**Primary Dependencies**: Express 5, Prisma 6, React 18, Vite, shadcn/ui, React Query, Zod, bcryptjs
**Storage**: PostgreSQL 17 (nova tabela `invite_tokens`)
**Testing**: Vitest 4
**Target Platform**: Web (mobile-first responsive)
**Project Type**: Web application (monorepo: backend + frontend)
**Performance Goals**: Geração de convite < 2s, validação de token < 500ms
**Constraints**: Token UUID v4, expiração 2h, uso único
**Scale/Scope**: Sem limite de convites ativos por tenant (v1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | PASS | Tela de convite será mobile-first, sem APIs web-only |
| II. Relational Data Integrity | PASS | UUID v4 PKs, FKs com ON DELETE, junction via TenantUsers |
| III. RESTful API | PASS | Endpoints REST em `/api/convites`, JSON, status codes padrão |
| IV. Version-Centric Repertoire | N/A | Feature não toca modelo de músicas/versões |
| V. Simplicity & Pragmatism | PASS | Reutiliza padrões existentes (recovery tokens, integrantes), sem abstrações novas |

**Post-Design Re-check**: Todos os princípios mantidos. Nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/023-invite-link/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Setup & smoke test guide
├── contracts/
│   └── api.md           # API endpoint contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/backend/
├── prisma/
│   └── schema.prisma                    # ADD: model InviteTokens + relations
├── src/
│   ├── repositories/
│   │   └── convites.repository.ts        # NEW: CRUD para invite_tokens
│   ├── services/
│   │   └── convites/
│   │       ├── create-convite.service.ts  # NEW: gerar token + expires_at
│   │       ├── list-convites.service.ts   # NEW: listar com status derivado
│   │       ├── revoke-convite.service.ts  # NEW: marcar revoked_at
│   │       ├── validate-convite.service.ts # NEW: validar estado do token
│   │       └── accept-convite.service.ts  # NEW: criar user ou vincular existente
│   ├── controllers/
│   │   └── convites.controller.ts        # NEW: handlers HTTP
│   ├── routes/
│   │   └── convites.routes.ts            # NEW: rotas autenticadas + públicas
│   ├── validators/
│   │   └── convites.validators.ts        # NEW: schemas Zod
│   ├── types/
│   │   └── convites.types.ts             # NEW: interfaces/DTOs
│   └── app.ts                           # MODIFY: registrar convites routes
└── docs/
    └── openapi.json                     # MODIFY: documentar novos endpoints

packages/frontend/
├── src/
│   ├── pages/
│   │   └── InviteAccept.tsx             # NEW: tela pública de cadastro via convite
│   ├── components/
│   │   ├── InviteGenerateDialog.tsx     # NEW: modal de gerar convite + copiar link
│   │   └── InviteListDialog.tsx         # NEW: modal/drawer de lista de convites
│   ├── services/
│   │   └── convites.ts                   # NEW: chamadas API + schemas Zod
│   ├── hooks/
│   │   └── use-convites.ts              # NEW: React Query hooks
│   └── App.tsx                          # MODIFY: adicionar rota pública /convite/:token
```

**Structure Decision**: Segue a estrutura existente do monorepo. Backend em camadas (repository → service → controller → route). Frontend com pages + components + hooks + services. Nenhum diretório novo fora do padrão.

## Implementation Strategy

### Phase A: Backend — Model & Migration

1. Adicionar model `InviteTokens` ao `schema.prisma` com relations para Tenant, Users (creator), Users (used_by)
2. Adicionar relations inversas em `Tenant` e `Users`
3. Executar `npx prisma migrate dev --name add-invite-tokens`
4. Regenerar Prisma Client

**Key files**:
- `packages/backend/prisma/schema.prisma` (modelo existente linhas 19-45 Tenant, 294-312 Users, 352-362 RecoveryTokens como referência)

### Phase B: Backend — Repository + Services

1. **`convites.repository.ts`**: create, findByToken, findAllByTenantId, revokeById, markAsUsed
   - Referência: `src/repositories/auth/recovery-tokens.repository.ts`
2. **`create-convite.service.ts`**: gera token, calcula `expires_at = now + 2h`, retorna URL completa
   - Usa `APP_WEB_URL` (como `send-forgot-password-email.service.ts` linha 36)
3. **`list-convites.service.ts`**: busca todos do tenant, computa status derivado (active/expired/used/revoked)
4. **`revoke-convite.service.ts`**: valida que não está usado, marca `revoked_at`
5. **`validate-convite.service.ts`**: busca por token, retorna estado + nome do tenant
6. **`accept-convite.service.ts`**: fluxo completo:
   - Validar token (estado)
   - Se e-mail já existe: verificar senha (bcrypt.compare), criar TenantUsers
   - Se e-mail novo: criar Users (bcrypt.hash SALT_ROUNDS=12) + TenantUsers
   - Marcar token como usado (`used_at`, `used_by`)
   - Referência: `src/services/integrantes.service.ts` (criação linhas 87-111)

### Phase C: Backend — Validators + Controller + Routes

1. **`convites.validators.ts`**: schemas Zod para accept (nome, email, senha, senha_confirmacao com refine) e params (token UUID, id UUID)
   - Referência: `src/validators/auth.validators.ts` (resetPasswordBodySchema linhas 133-140)
2. **`convites.controller.ts`**: create, index, revoke, validate, accept
3. **`convites.routes.ts`**: rotas autenticadas (`POST /`, `GET /`, `DELETE /:id`) + rotas públicas (`GET /:token/validate`, `POST /:token/accept`)
   - Referência pública: `src/routes/auth/password.routes.ts`
   - Referência autenticada: `src/routes/integrantes.routes.ts`
4. **`app.ts`**: registrar `this.app.use('/api/convites', convitesRoutes)`

### Phase D: Backend — Types + OpenAPI

1. **`convites.types.ts`**: interfaces para request/response
2. **`openapi.json`**: documentar os 5 endpoints

### Phase E: Frontend — API Service + Hooks

1. **`services/convites.ts`**: funções para cada endpoint + schemas Zod de resposta
   - Referência: `src/services/integrantes.ts`
2. **`hooks/use-convites.ts`**: useCreateInvite, useInvites, useRevokeInvite, useValidateInvite, useAcceptInvite
   - Referência: `src/hooks/use-integrantes.ts`

### Phase F: Frontend — Tela Pública de Convite

1. **`pages/InviteAccept.tsx`**: rota `/convite/:token`
   - Ao carregar: valida token via `GET /api/convites/:token/validate`
   - Se válido: mostra form (Nome + E-mail + Senha + Confirmação)
   - Se 409 (e-mail existe): mostra campo de senha para confirmação de identidade
   - Se inválido: mostra mensagem de estado (expirado/usado/revogado/404)
   - Após sucesso: redirecionar para `/login`
   - Layout: similar a Login/ResetPassword — card centralizado com branding
   - Referência: `src/pages/Login.tsx`, `src/pages/ResetPassword.tsx`
2. **`App.tsx`**: adicionar `<Route path="/convite/:token" element={<InviteAccept />} />`

### Phase G: Frontend — Componentes do Líder

1. **`InviteGenerateDialog.tsx`**: modal com botão "Gerar convite"
   - Ao clicar: chama `POST /api/convites`
   - Mostra link + botão copiar (navigator.clipboard) + timer de expiração
   - Toast de sucesso ao copiar
2. **`InviteListDialog.tsx`**: modal/drawer com lista de convites
   - Tabela: status (badge colorido), gerado por, expiração, ação revogar
   - Botão revogar desabilitado para convites não-ativos
3. **`Members.tsx`**: adicionar botões "Gerar convite" e "Ver convites" no header
   - Visíveis apenas com permissão `integrantes.write`

### Phase H: Testes + Documentação

1. Testes unitários backend (services) — Vitest
2. Testes unitários frontend (hooks/components) — Vitest
3. Smoke test via API (conforme quickstart.md)
4. Atualizar `openapi.json`
5. Docstrings JSDoc em PT-BR em todo código novo
6. Atualizar CLAUDE.md/rules se necessário

## Complexity Tracking

> Nenhuma violação de constitution identificada. Nenhuma justificativa necessária.
