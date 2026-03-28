# Research: Link de Convite para Integrantes

**Feature**: 023-invite-link | **Date**: 2026-03-28

## R-001: Token Generation & Validation Pattern

**Decision**: Seguir o padrão de `UsersRecoveryTokens` — UUID auto-gerado no campo `token`, expiração via `expires_at` timestamp, invalidação por marcação (`used_at`, `revoked_at`) em vez de deleção.

**Rationale**: O recovery token já usa UUID + validação temporal + deleção pós-uso. Para convites, optamos por marcar como usado/revogado (soft state) em vez de deletar, porque o líder precisa ver o histórico de convites (FR-006).

**Alternatives considered**:
- Token opaco (crypto random string): Desnecessário — UUID v4 tem 122 bits de entropia, suficiente para links de convite.
- JWT como token de convite: Over-engineering — não precisa de payload auto-contido; a validação sempre consulta o banco.

## R-002: User Creation via Invite

**Decision**: Reusar o padrão de `integrantes.service.ts` — validar e-mail único, hash bcrypt (SALT_ROUNDS=12), criar Users + TenantUsers em sequência.

**Rationale**: O fluxo de criação de integrante já faz exatamente isso. A diferença é que no convite: (1) o participante preenche seus próprios dados, (2) o token identifica o tenant, (3) não precisa de autenticação.

**Alternatives considered**:
- Criar serviço completamente novo: Redundante — reusar lógica existente de hash + criação + vinculação.

## R-003: Existing User Linking (e-mail já existente)

**Decision**: Quando o e-mail já existe no sistema, exigir a senha da conta existente para verificar identidade. Se válida, criar apenas o TenantUsers (sem novo Users). Retornar erro 409 com mensagem específica no frontend para solicitar a senha.

**Rationale**: Previne que qualquer pessoa com o link vincule a conta de outro usuário ao tenant sem autorização. O fluxo frontend detecta o 409 e mostra campo de senha para confirmação.

**Alternatives considered**:
- Vincular automaticamente sem verificação: Risco de segurança — qualquer pessoa com o link poderia vincular conta alheia.
- Redirecionar para login: UX fragmentada — o participante perde o contexto do convite.

## R-004: Role Assignment for Invited Users

**Decision**: Não atribuir nenhuma role automaticamente. O usuário fica como membro básico (apenas vinculado ao tenant via TenantUsers, sem roles em UsersRoles). O líder atribui roles manualmente depois.

**Rationale**: O sistema atual já não atribui roles automaticamente ao criar integrante via `integrantes.service.ts`. Manter consistência. Membro sem roles tem acesso de leitura básico.

**Alternatives considered**:
- Criar role "membro" padrão: Não existe no sistema atual — criá-la adicionaria escopo desnecessário.
- Copiar roles do criador: Risco de segurança — admin criando convite daria admin ao convidado.

## R-005: Public Route Pattern

**Decision**: Registrar rotas públicas de convite (`GET /api/convites/:token/validate`, `POST /api/convites/:token/accept`) sem middleware de autenticação, similar a `/api/password/forgot` e `/api/password/reset`.

**Rationale**: O participante não tem conta ainda — não pode se autenticar. As rotas autenticadas do líder (`POST /api/convites`, `GET /api/convites`, `DELETE /api/convites/:id`) seguem o padrão de integrantes com `ensureAuthenticated + ensureTenantContext + can()`.

**Alternatives considered**:
- Todas as rotas autenticadas: Impossível — participante não tem JWT.

## R-006: Frontend Public Route

**Decision**: Adicionar rota pública `/convite/:token` no React Router (fora de `ProtectedRoute`), similar a `/redefinir-senha`. Página standalone com branding LouvorFlow + nome do tenant + formulário de cadastro.

**Rationale**: Segue o padrão existente de `/redefinir-senha` que é uma rota pública com validação de token.

**Alternatives considered**:
- Usar modal no login: UX confusa — o participante não tem contexto de login.

## R-007: Frontend URL Configuration

**Decision**: Usar a env var `APP_WEB_URL` já existente (usada em `send-forgot-password-email.service.ts`) para construir a URL do convite: `${APP_WEB_URL}/convite/${token}`.

**Rationale**: Variável já existe e é usada para construir links de reset de senha. Mesmo padrão.

**Alternatives considered**:
- Nova env var `FRONTEND_URL`: Redundante — `APP_WEB_URL` serve o mesmo propósito.
