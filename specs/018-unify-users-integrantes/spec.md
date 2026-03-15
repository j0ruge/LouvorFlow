# Feature Specification: Unificação das Tabelas Users e Integrantes

**Feature Branch**: `018-unify-users-integrantes`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Unificação das tabelas Users e Integrantes no LouvorFlow. O sistema tem duas tabelas separadas representando pessoas: `users` (autenticação/RBAC, naming em inglês) e `integrantes` (domínio/equipe de louvor, naming em português). Ambas têm email único e representam a mesma entidade. A decisão é unificar em uma única tabela `users`, migrando os campos de domínio (`telefone`) e as relações de domínio (`Eventos_Integrantes`, `Integrantes_Funcoes`) para o model `Users`. Eliminar a tabela `integrantes` e o campo legado `senha`. Manter KISS — uma pessoa, uma tabela, uma fonte de verdade."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Migração de dados: integrantes existentes viram users (Priority: P1) 🎯 MVP

O sistema deve migrar todos os registros da tabela `integrantes` para a tabela `users`, preservando relações com eventos e funções musicais. Após a migração, a tabela `integrantes` é removida. O campo `telefone` é absorvido pela tabela `users`. O campo `senha` de integrantes é descartado (legado, não usado para autenticação).

**Why this priority**: Sem a migração de dados, nenhuma funcionalidade do sistema funciona. É a fundação de toda a mudança.

**Independent Test**: Executar a migração em um banco com dados existentes e verificar que todos os integrantes aparecem como users, com seus eventos e funções preservados.

**Acceptance Scenarios**:

1. **Given** um banco com 10 integrantes e 5 users existentes, **When** a migração roda, **Then** o banco tem entre 10 e 15 users (dependendo de emails coincidentes) e 0 integrantes. Todos os vínculos com eventos e funções estão preservados.
2. **Given** um integrante com email `joao@igreja.com` e um user com o mesmo email, **When** a migração roda, **Then** o user existente absorve o `telefone` do integrante e herda seus vínculos com eventos e funções. Não é criado um user duplicado.
3. **Given** um integrante com email `maria@igreja.com` que não existe como user, **When** a migração roda, **Then** um novo user é criado com `name = nome`, `email = email`, `password` = hash padrão temporário, `telefone = telefone`. O user herda os vínculos com eventos e funções do integrante.
4. **Given** um banco vazio (sem integrantes nem users), **When** a migração roda, **Then** nenhum erro ocorre e o schema é atualizado normalmente.

---

### User Story 2 — Backend unificado: APIs de integrantes operam sobre users (Priority: P1)

As rotas `/api/integrantes` continuam funcionando com o mesmo contrato de resposta, mas operam sobre a tabela `users`. O CRUD de integrantes (listar, criar, editar, deletar) e o gerenciamento de funções musicais passam a usar o model `Users`. A criação de um "integrante" agora cria um user completo (com capacidade de login).

**Why this priority**: O frontend e qualquer integração existente dependem dessas APIs para funcionar.

**Independent Test**: Executar as mesmas chamadas de API que funcionavam antes da unificação e verificar que os responses mantêm o mesmo formato.

**Acceptance Scenarios**:

1. **Given** o backend rodando com o schema unificado, **When** `GET /api/integrantes` é chamado, **Then** retorna a lista de todos os users com os campos esperados (`id`, `nome`, `email`, `telefone`, `funcoes[]`).
2. **Given** o backend unificado, **When** `POST /api/integrantes` cria um novo membro com nome, email, senha e telefone, **Then** um novo user é criado no banco com `password` hasheada, e o novo membro pode fazer login com essas credenciais.
3. **Given** um user existente com funções musicais vinculadas, **When** `GET /api/integrantes/:id` é chamado com o ID do user, **Then** retorna os dados do user com suas funções achatadas no formato esperado.
4. **Given** um user criado via `/api/integrantes`, **When** ele faz login via `/api/sessions`, **Then** o login funciona e o user aparece tanto na listagem de integrantes quanto na de users admin.

---

### User Story 3 — Frontend: tela de Integrantes opera sobre users unificados (Priority: P2)

A tela de gerenciamento de membros (`Members.tsx`) continua funcionando normalmente. O formulário de criação/edição de integrante agora cria/edita um user real. O campo `telefone` continua sendo exibido e editável. As funções musicais continuam sendo gerenciadas da mesma forma.

**Why this priority**: A experiência do usuário final deve permanecer inalterada. Mudanças internas não devem afetar a interface.

**Independent Test**: Navegar à tela de Integrantes, criar um novo membro, editar seus dados e funções, e verificar que tudo funciona como antes.

**Acceptance Scenarios**:

1. **Given** a tela de Integrantes aberta, **When** o usuário visualiza a lista, **Then** todos os membros da equipe aparecem com nome, email, telefone e funções — idêntico ao comportamento anterior.
2. **Given** o formulário de criação de membro, **When** o usuário preenche e salva, **Then** o novo membro aparece na lista de integrantes E pode fazer login no sistema.
3. **Given** um membro existente, **When** o usuário edita o telefone e adiciona/remove funções, **Then** as alterações são salvas e refletidas imediatamente.

---

### User Story 4 — Eventos: escalas referenciam users ao invés de integrantes (Priority: P2)

As escalas de louvor (eventos) continuam funcionando. A associação de membros a eventos agora referencia a tabela `users`. As telas de criação/visualização de eventos exibem os mesmos dados.

**Why this priority**: Eventos são a funcionalidade central do LouvorFlow, mas dependem da migração estar pronta primeiro.

**Independent Test**: Criar um evento, associar membros, e verificar que os dados aparecem corretamente na tela de detalhes do evento.

**Acceptance Scenarios**:

1. **Given** um evento existente com membros vinculados, **When** o evento é visualizado, **Then** os membros aparecem com nome e funções, idêntico ao comportamento anterior.
2. **Given** a tela de criação de evento, **When** o usuário adiciona um membro ao evento, **Then** o dropdown lista os users (ao invés dos antigos integrantes) e a associação é persistida.
3. **Given** um membro removido de um evento, **When** a lista do evento é recarregada, **Then** o membro não aparece mais.

---

### User Story 5 — Dashboard e Histórico: contagens e estatísticas usam users (Priority: P3)

O Dashboard e a tela de Histórico, que atualmente contam integrantes, passam a contar users. As estatísticas permanecem consistentes.

**Why this priority**: Funcionalidade de suporte, não crítica para o MVP.

**Independent Test**: Verificar que o Dashboard mostra a contagem correta de membros da equipe.

**Acceptance Scenarios**:

1. **Given** 10 users no banco (8 com funções musicais, 2 admins sem funções), **When** o Dashboard é aberto, **Then** o card "Equipe" mostra 8 membros (apenas users com pelo menos uma função musical vinculada).

---

### Edge Cases

- **Emails duplicados entre users e integrantes**: A migração deve detectar e fazer merge, priorizando dados do user existente (que já tem auth) e absorvendo `telefone` do integrante.
- **Integrante sem email válido**: Não deveria existir (email é `@unique` no schema), mas a migração deve tratar com erro claro.
- **User criado via `/api/integrantes` sem roles/permissions**: Deve funcionar para login mas sem acesso a áreas admin. O admin pode atribuir roles depois.
- **Exclusão de user que está em eventos**: Cascading delete já está configurado nas junction tables — excluir um user remove automaticamente seus vínculos com eventos e funções.
- **Convenção de naming**: A tabela unificada usa naming em inglês (`name`, `password`) para campos de auth, e `telefone` (português) como campo de domínio herdado. Os endpoints `/api/integrantes` mantêm os nomes de campo em português no response para retrocompatibilidade.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE migrar todos os registros de `integrantes` para `users`, preservando vínculos com eventos (`Eventos_Integrantes`) e funções musicais (`Integrantes_Funcoes`).
- **FR-002**: O sistema DEVE fazer merge de integrantes e users com mesmo email, priorizando dados de auth do user existente e absorvendo `telefone` do integrante.
- **FR-003**: O sistema DEVE criar novos users para integrantes sem user correspondente, atribuindo um hash aleatório (UUID) como senha — forçando o uso do fluxo "Esqueci minha senha" para primeiro acesso.
- **FR-004**: O sistema DEVE adicionar o campo `telefone` (varchar 20, nullable) ao model `Users`.
- **FR-005**: O sistema DEVE remover completamente o model `Integrantes`, a tabela `integrantes` e o campo legado `senha` do schema.
- **FR-006**: O sistema DEVE renomear as tabelas junction: `Eventos_Integrantes` → `Eventos_Users` (referenciando `user_id`) e `Integrantes_Funcoes` → `Users_Funcoes` (referenciando `user_id`).
- **FR-007**: O sistema DEVE manter a retrocompatibilidade dos endpoints `/api/integrantes/*`, retornando os mesmos campos no response (`id`, `nome`, `email`, `telefone`, `funcoes[]`). A listagem `GET /api/integrantes` retorna todos os users (sem filtro por funções musicais).
- **FR-008**: O sistema DEVE permitir que um membro criado via `/api/integrantes` faça login via `/api/sessions` com as credenciais fornecidas.
- **FR-009**: O sistema DEVE atualizar o frontend (services, hooks, schemas, pages) para consumir o model unificado.
- **FR-010**: O sistema DEVE remover a extensão Prisma `$extends` que filtrava `senha` de integrantes em `prisma/cliente.ts`.
- **FR-011**: O sistema DEVE atualizar a documentação OpenAPI, os testes, os fakes e os mocks para refletir o model unificado.
- **FR-012**: O sistema DEVE atualizar os endpoints de eventos (`/api/eventos/:eventoId/integrantes`) para operar sobre a tabela `Eventos_Users`, mantendo a URL `/integrantes` inalterada para retrocompatibilidade.

### Key Entities

- **Users (unificado)**: Entidade única representando uma pessoa no sistema. Campos de auth (`name`, `email`, `password`, `avatar`) + campo de domínio (`telefone`). Relações: roles, permissions, tokens, eventos, funções musicais.
- **Eventos_Users** (ex-Eventos_Integrantes): Junction table vinculando users a eventos (escalas de louvor).
- **Users_Funcoes** (ex-Integrantes_Funcoes): Junction table vinculando users a funções musicais (guitarrista, vocalista, etc.).
- **Funcoes**: Funções/instrumentos disponíveis na equipe de louvor (sem alteração).
- **Eventos**: Eventos de louvor com datas, músicas e membros escalados (sem alteração no model, apenas FKs atualizadas).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos integrantes existentes são preservados como users após a migração, sem perda de vínculos com eventos ou funções.
- **SC-002**: Todas as funcionalidades existentes (CRUD de membros, gerenciamento de funções, escalas de eventos, dashboard) continuam funcionando sem regressão.
- **SC-003**: Membros criados via `/api/integrantes` conseguem fazer login via `/api/sessions` com as credenciais fornecidas na criação.
- **SC-004**: A contagem de tabelas no banco reduz de 22 para 21 (remoção de `integrantes`; junction tables são renomeadas, não removidas).
- **SC-005**: Todos os testes existentes passam (com adaptações) após a unificação.
- **SC-006**: O email continua sendo único no sistema — não é possível criar dois users com o mesmo email (seja via `/api/users` ou `/api/integrantes`).

## Assumptions

- A senha legada dos integrantes (`senha`) não é utilizada para autenticação e pode ser descartada sem impacto.
- Integrantes sem user correspondente receberão um hash aleatório (UUID) como senha, impossível de adivinhar — deverão usar "Esqueci minha senha" para ativar seu acesso.
- O campo `telefone` será adicionado como nullable ao model `Users` — users existentes sem telefone terão `telefone = null`.
- Os endpoints `/api/integrantes` serão mantidos para retrocompatibilidade, operando sobre a tabela `users` com mapeamento de campos (name↔nome, password↔senha).
- A migração será implementada como uma Prisma migration com script de dados em transação única (`$transaction`), garantindo rollback total em caso de falha e que rode automaticamente em todos os ambientes.

## Clarifications

### Session 2026-03-15

- Q: Qual a senha padrão para integrantes migrados sem user correspondente? → A: Hash aleatório (UUID) — força reset via "Esqueci minha senha". Nenhuma credencial temporária previsível existirá no sistema.
- Q: Dashboard "Equipe" deve contar todos os users ou apenas membros ativos da equipe? → A: Contar apenas users com pelo menos uma função musical vinculada (`Users_Funcoes`).
- Q: O endpoint `/api/eventos/:eventoId/integrantes` deve ser renomeado para `/users`? → A: Manter `/api/eventos/:eventoId/integrantes` para retrocompatibilidade. Internamente opera sobre `Eventos_Users`.
- Q: Estratégia de rollback se a migração falhar no meio? → A: Transação única — rollback total em caso de falha, garantindo integridade dos dados.
- Q: `/api/integrantes` e `/api/users` (admin) mostram o mesmo pool após unificação? → A: Sim, intencional. Ambas as listagens mostram todos os users sem filtro. `/api/integrantes` é uma "view" com campos mapeados para português.

## Scope Exclusions

- **Não** será criado fluxo de auto-registro de membros (sign-up público). Membros continuam sendo criados por admins.
- **Não** será alterada a estrutura de roles/permissions. Membros criados via `/api/integrantes` não recebem roles automaticamente.
- **Não** será unificada a convenção de naming (português vs inglês) dos campos em toda a base. Apenas o model principal usa inglês; endpoints mantêm português.
