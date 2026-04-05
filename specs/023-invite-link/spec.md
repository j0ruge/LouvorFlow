# Feature Specification: Link de Convite para Integrantes

**Feature Branch**: `023-invite-link`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Link de convite com expiração para onboarding de integrantes sem depender de e-mail"

## Clarifications

### Session 2026-03-28

- Q: Como usuários sem e-mail fazem login? → A: E-mail é obrigatório em todos os cadastros (inclusive via convite). E-mail é o identificador de login e canal de recuperação de senha.
- Q: Qual papel/permissões o usuário recebe ao aceitar convite? → A: Membro básico sem permissões administrativas. Líder ajusta depois manualmente.
- Q: Como tratar e-mail já existente ao aceitar convite? → A: Exigir senha da conta existente para confirmar identidade antes de vincular ao novo tenant.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Líder gera link de convite (Priority: P1)

O líder de louvor acessa a tela de Integrantes e gera um link de convite único com expiração de 2 horas. O link é copiado automaticamente para a área de transferência, permitindo que o líder o envie por WhatsApp, mensagem de texto ou qualquer outro canal de comunicação.

**Why this priority**: É o ponto de entrada do fluxo. Sem gerar o link, nenhuma outra funcionalidade da feature existe. Resolve diretamente o problema de onboarding quando e-mail falha.

**Independent Test**: Pode ser testado isoladamente fazendo login como líder, navegando até Integrantes, clicando em "Gerar convite" e verificando que o link é gerado e copiado para o clipboard.

**Acceptance Scenarios**:

1. **Given** um líder autenticado na tela de Integrantes, **When** clica em "Gerar convite", **Then** um link único é gerado com expiração de 2 horas e copiado automaticamente para o clipboard.
2. **Given** um líder autenticado, **When** gera múltiplos convites, **Then** cada convite é independente e possui seu próprio link e expiração.
3. **Given** um convite gerado, **When** o líder visualiza os detalhes, **Then** vê o link completo, tempo restante de expiração e status "Ativo".

---

### User Story 2 - Participante aceita convite e cria conta (Priority: P1)

Um participante recebe o link de convite e o abre no navegador. Vê o nome da igreja/comunidade (tenant), preenche seu nome, e-mail, senha e confirmação de senha, e cria sua conta. Após o cadastro, é automaticamente vinculado ao tenant do líder que gerou o convite e pode fazer login imediatamente com e-mail + senha.

**Why this priority**: É o lado do participante do fluxo core. Sem isso, gerar o link não tem propósito. O diferencial é que o participante faz o auto-cadastro — o líder não precisa criar a conta manualmente nem depender de e-mail de convite.

**Independent Test**: Pode ser testado abrindo o link de convite em uma janela anônima, preenchendo os dados e verificando que a conta foi criada e o login funciona.

**Acceptance Scenarios**:

1. **Given** um link de convite válido, **When** o participante o abre, **Then** vê uma tela de cadastro com o nome do tenant/igreja.
2. **Given** a tela de cadastro via convite, **When** o participante preenche Nome + E-mail + Senha + Confirmação de senha, **Then** a conta é criada com sucesso e vinculada ao tenant.
4. **Given** um cadastro via convite concluído, **When** o participante tenta fazer login, **Then** consegue acessar o sistema imediatamente.
5. **Given** um link de convite válido já utilizado por alguém, **When** outro participante tenta acessá-lo, **Then** vê a mensagem "Este convite já foi utilizado."

---

### User Story 3 - Validação de estados do token (Priority: P1)

O sistema valida o estado do token de convite e exibe mensagens claras conforme o estado: válido (abre cadastro), expirado, já utilizado, revogado ou inexistente.

**Why this priority**: Essencial para a segurança e UX do fluxo. Tokens expirados ou reutilizados não podem permitir cadastro.

**Independent Test**: Pode ser testado acessando links com tokens em diferentes estados e verificando as mensagens exibidas.

**Acceptance Scenarios**:

1. **Given** um token válido (dentro de 2h, não usado, não revogado), **When** o participante acessa o link, **Then** vê a tela de cadastro.
2. **Given** um token expirado (mais de 2h), **When** o participante acessa o link, **Then** vê "Este convite expirou. Peça um novo ao seu líder."
3. **Given** um token já utilizado, **When** alguém acessa o link, **Then** vê "Este convite já foi utilizado."
4. **Given** um token revogado pelo líder, **When** alguém acessa o link, **Then** vê "Este convite foi cancelado."
5. **Given** um token inexistente, **When** alguém acessa o link, **Then** vê uma página 404 genérica.

---

### User Story 4 - Líder gerencia convites (Priority: P2)

O líder pode ver a lista de todos os convites que gerou, com seus respectivos status (ativo, expirado, usado, revogado). Pode revogar convites ativos antes de serem utilizados.

**Why this priority**: Importante para controle e visibilidade, mas não bloqueia o fluxo core de gerar e aceitar convites.

**Independent Test**: Pode ser testado gerando vários convites, verificando a lista com filtros de status, e revogando um convite ativo.

**Acceptance Scenarios**:

1. **Given** um líder com convites gerados, **When** acessa a lista de convites, **Then** vê todos os convites com link, gerador, expiração e status.
2. **Given** um convite ativo na lista, **When** o líder clica em revogar, **Then** o convite muda para status "Revogado" e não pode mais ser usado.
3. **Given** um convite já usado ou expirado, **When** o líder tenta revogar, **Then** a ação de revogar não está disponível.

---

### Edge Cases

- O que acontece quando o e-mail informado já existe no sistema (mesmo ou outro tenant)?
  - Se o usuário já pertence ao tenant do convite: erro "Você já pertence a este grupo."
  - Se o usuário existe mas não pertence ao tenant: o sistema exige a senha da conta existente para confirmar identidade. Se correta, vincula ao novo tenant (200). Se incorreta, exibe erro de credenciais inválidas (401).
- O que acontece se o mesmo participante abrir o link de convite duas vezes em abas diferentes?
  - Apenas o primeiro cadastro concluído com sucesso utiliza o token; a segunda aba recebe erro de token já utilizado.
- O que acontece se o líder revogar um convite enquanto o participante está no meio do preenchimento do formulário?
  - Ao submeter o formulário, o participante recebe a mensagem "Este convite foi cancelado."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que líderes gerem links de convite únicos com expiração de 2 horas.
- **FR-002**: O sistema DEVE invalidar o token após o primeiro uso (uso único).
- **FR-003**: O sistema DEVE permitir que participantes criem conta via link de convite preenchendo Nome + E-mail + Senha + Confirmação de senha.
- **FR-004**: O sistema DEVE vincular automaticamente o novo usuário ao tenant do líder que gerou o convite, atribuindo papel de membro básico (sem permissões administrativas). O líder pode ajustar permissões posteriormente.
- **FR-005**: O sistema DEVE exibir mensagens de erro claras e distintas para cada estado do token (expirado, usado, revogado, inexistente).
- **FR-006**: O sistema DEVE permitir que líderes vejam a lista de todos os convites com status (ativo, expirado, usado, revogado).
- **FR-007**: O sistema DEVE permitir que líderes revoguem convites ativos antes de serem utilizados.
- **FR-008**: O campo e-mail DEVE ser obrigatório no cadastro via convite, servindo como identificador de login e canal de recuperação de senha.
- **FR-010**: O sistema DEVE exibir o nome do tenant/igreja na tela de cadastro via convite.
- **FR-011**: Ao aceitar um convite com e-mail já existente no sistema, o sistema DEVE exigir a senha da conta existente para confirmar identidade, e então vincular o usuário ao tenant do convite sem criar conta duplicada.
- **FR-012**: O sistema DEVE copiar o link automaticamente para o clipboard ao gerar um convite.

### Key Entities

- **Token de Convite (InviteToken)**: Representa um convite gerado por um líder. Atributos principais: identificador único, token de acesso, tenant associado, criador, data de expiração (2h), status de uso, status de revogação. Relaciona-se com o Tenant (pertence a) e com Usuários (criado por / utilizado por).
- **Usuário (User)**: Entidade existente. E-mail permanece obrigatório e único — é o identificador de login e canal de recuperação de senha.
- **Vínculo Tenant-Usuário (TenantUser)**: Entidade existente que representa a associação entre um usuário e um tenant. Criada automaticamente ao aceitar convite.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O líder consegue gerar um link de convite e tê-lo copiado para o clipboard em 1 clique (menos de 2 segundos).
- **SC-002**: Um participante consegue completar o cadastro via convite em menos de 1 minuto.
- **SC-003**: 100% dos tokens expirados, usados ou revogados são rejeitados com mensagem apropriada.
- **SC-004**: Participantes cadastrados via convite aparecem na lista de integrantes do tenant imediatamente após o cadastro.
- **SC-005**: Redução do tempo médio de onboarding de novos integrantes — eliminando a dependência de e-mail funcional.
- **SC-006**: O líder consegue visualizar o status de todos os convites e revogar convites ativos sem assistência técnica.

## Assumptions

- O líder já possui permissões de escrita em integrantes (`integrantes.write`) no sistema atual.
- Não há limite de convites ativos que um líder pode gerar (v1).
- A URL base do frontend é configurável via variável de ambiente.
- Login com Google/OAuth está fora do escopo desta versão.
- Notificação ao líder quando convite for aceito está fora do escopo desta versão.
- O fluxo de login existente (multi-tenant com seleção) continua funcionando normalmente para usuários criados via convite.
