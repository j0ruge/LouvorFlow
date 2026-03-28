# API Contracts: Link de Convite para Integrantes

**Feature**: 023-invite-link | **Date**: 2026-03-28

## Authenticated Endpoints (Líder)

### POST /api/convites

Gera um novo link de convite para o tenant do líder.

**Middleware**: `ensureAuthenticated → ensureTenantContext → can(['integrantes.write'])`

**Request**: Nenhum body necessário. O tenant_id e created_by vêm do JWT.

**Response 201**:

```json
{
  "msg": "Convite gerado com sucesso",
  "invite": {
    "id": "uuid",
    "token": "uuid",
    "url": "https://app.louvorflow.com/convite/{token}",
    "expires_at": "2026-03-28T14:00:00.000Z",
    "created_at": "2026-03-28T12:00:00.000Z",
    "status": "active"
  }
}
```

**Errors**:
- `401`: Token JWT inválido ou ausente
- `403`: Sem permissão `integrantes.write` ou sem contexto de tenant

---

### GET /api/convites

Lista todos os convites do tenant do líder.

**Middleware**: `ensureAuthenticated → ensureTenantContext → can(['integrantes.write'])`

**Response 200**:

```json
{
  "invites": [
    {
      "id": "uuid",
      "token": "uuid",
      "url": "https://app.louvorflow.com/convite/{token}",
      "expires_at": "2026-03-28T14:00:00.000Z",
      "created_at": "2026-03-28T12:00:00.000Z",
      "status": "active",
      "created_by": {
        "id": "uuid",
        "name": "João Líder"
      },
      "used_by": null
    },
    {
      "id": "uuid",
      "token": "uuid",
      "url": "https://app.louvorflow.com/convite/{token}",
      "expires_at": "2026-03-27T10:00:00.000Z",
      "used_at": "2026-03-27T09:30:00.000Z",
      "created_at": "2026-03-27T08:00:00.000Z",
      "status": "used",
      "created_by": {
        "id": "uuid",
        "name": "João Líder"
      },
      "used_by": {
        "id": "uuid",
        "name": "Maria Silva"
      }
    }
  ]
}
```

**Status derivation** (computed field):
- `"active"`: não usado, não revogado, não expirado
- `"expired"`: não usado, não revogado, `expires_at` no passado
- `"used"`: `used_at` preenchido
- `"revoked"`: `revoked_at` preenchido e não usado

---

### DELETE /api/convites/:id

Revoga um convite ativo.

**Middleware**: `ensureAuthenticated → ensureTenantContext → can(['integrantes.write'])`

**Params**: `id` — UUID do registro (não o token)

**Response 200**:

```json
{
  "msg": "Convite revogado com sucesso"
}
```

**Errors**:
- `400`: Convite já foi utilizado ou já está revogado
- `404`: Convite não encontrado no tenant

---

## Public Endpoints (Participante)

### GET /api/convites/:token/validate

Valida o token e retorna informações para exibir na tela de cadastro.

**Middleware**: Nenhum (rota pública)

**Params**: `token` — UUID do token de convite

**Response 200** (token válido):

```json
{
  "valid": true,
  "tenant": {
    "name": "Igreja Exemplo"
  }
}
```

**Response 400** (token expirado):

```json
{
  "erro": "Este convite expirou. Peça um novo ao seu líder.",
  "codigo": 400,
  "status": "expired"
}
```

**Response 400** (token já utilizado):

```json
{
  "erro": "Este convite já foi utilizado.",
  "codigo": 400,
  "status": "used"
}
```

**Response 400** (token revogado):

```json
{
  "erro": "Este convite foi cancelado.",
  "codigo": 400,
  "status": "revoked"
}
```

**Response 404** (token inexistente):

```json
{
  "erro": "Convite não encontrado.",
  "codigo": 404
}
```

---

### POST /api/convites/:token/accept

Aceita o convite e cria conta (ou vincula conta existente).

**Middleware**: Nenhum (rota pública)

**Params**: `token` — UUID do token de convite

**Request Body** (body único para novo usuário e conta existente):

```json
{
  "nome": "Maria Silva",
  "email": "maria@gmail.com",
  "senha": "minhasenha123",
  "senha_confirmacao": "minhasenha123"
}
```

**Lógica do backend**:
1. Busca user por e-mail
2. Se **não existe**: cria Users (hash senha) + TenantUsers → 201
3. Se **existe** e **já pertence ao tenant**: retorna 409 "Você já pertence a este grupo"
4. Se **existe** e **não pertence ao tenant**: compara `senha` com hash existente
   - Se correta: cria TenantUsers → 200
   - Se incorreta: retorna 401 "Senha incorreta para a conta existente"

**Response 201** (conta criada):

```json
{
  "msg": "Conta criada com sucesso! Faça login para continuar."
}
```

**Response 200** (conta existente vinculada):

```json
{
  "msg": "Você foi adicionado à igreja com sucesso! Faça login para continuar."
}
```

**Errors**:
- `400`: Token inválido (expirado/usado/revogado), validação falhou, senhas não coincidem
- `401`: Senha incorreta para conta existente (e-mail já cadastrado, senha não confere)
- `404`: Token inexistente
- `409`: Usuário já pertence ao tenant do convite

**Response 401** (senha incorreta para conta existente):

```json
{
  "erro": "Senha incorreta para a conta existente.",
  "codigo": 401
}
```

**Response 409** (usuário já pertence ao tenant):

```json
{
  "erro": "Você já pertence a este grupo.",
  "codigo": 409
}
```
