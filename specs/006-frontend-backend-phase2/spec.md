# Feature Specification: Integração Frontend-Backend (Fase 2)

**Feature Branch**: `006-frontend-backend-phase2`
**Created**: 2026-02-17
**Status**: Draft
**Input**: Segunda fase de implementação da conexão frontend-backend — completar endpoints faltantes nos módulos de Músicas, Escalas e Integrantes, adicionar gerenciamento de entidades auxiliares (Artistas, Tags, Funções, Tonalidades, Tipos de Evento) e substituir dados fictícios no Dashboard.

## Clarifications

### Session 2026-02-17

- Q: A tela de detalhes da música deve ser uma página dedicada com rota própria ou um modal/drawer? → A: Página dedicada com rota própria (`/musicas/:id`), seguindo o mesmo padrão de `/escalas/:id` para consistência na aplicação.
- Q: A página de Artistas deve ser um item de navegação de primeiro nível ou ficar dentro de Configurações? → A: Dentro da página de Configurações, junto com Tags, Funções, Tonalidades e Tipos de Evento — Artistas são entidades de referência, não fluxo principal.
- Q: Como o usuário navega entre as 5 seções da página de Configurações? → A: Abas (tabs) horizontais — uma aba por entidade (Artistas, Tags, Funções, Tonalidades, Tipos de Evento), conteúdo troca sem recarregar a página.
- Q: Onde ocorre a gestão de funções do integrante (adicionar/remover)? → A: Dentro do dialog de edição existente do integrante, adicionando uma seção de funções com chips/badges e seletor no mesmo modal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerenciamento Completo de Músicas (Priority: P1)

Como líder de ministério, quero editar, excluir e gerenciar versões, tags e funções de músicas existentes, para manter o catálogo atualizado e organizado com todas as informações necessárias para a montagem de escalas.

**Why this priority**: A Fase 1 implementou apenas criação e listagem de músicas. Sem edição, exclusão e gestão das relações (versões por artista, tags, funções requeridas), o catálogo fica incompleto e inutilizável para montagem de repertório detalhado.

**Independent Test**: Pode ser testado na página de Músicas — editar nome/tonalidade deve persistir após recarregar; excluir deve remover da lista; versões, tags e funções devem ser gerenciáveis na tela de detalhes da música.

**Acceptance Scenarios**:

1. **Given** o líder acessa a página de Músicas, **When** ele clica em uma música, **Then** o sistema navega para a página de detalhes (`/musicas/:id`) exibindo todas as informações (nome, tonalidade, versões, tags, funções).
2. **Given** o líder está na tela de detalhes de uma música, **When** ele edita o nome ou tonalidade e confirma, **Then** o sistema atualiza a música e exibe notificação de sucesso.
3. **Given** o líder está na tela de detalhes de uma música, **When** ele clica em excluir e confirma a ação, **Then** o sistema remove a música e redireciona para a listagem.
4. **Given** o líder está na tela de detalhes de uma música, **When** ele adiciona uma versão (selecionando artista, informando BPM, cifras, letras, link), **Then** a versão aparece na lista de versões da música.
5. **Given** o líder está na tela de detalhes de uma música, **When** ele remove uma versão existente, **Then** a versão é removida da lista.
6. **Given** o líder está na tela de detalhes de uma música, **When** ele adiciona ou remove uma tag, **Then** a lista de tags é atualizada imediatamente.
7. **Given** o líder está na tela de detalhes de uma música, **When** ele adiciona ou remove uma função requerida, **Then** a lista de funções é atualizada imediatamente.

---

### User Story 2 - Gerenciamento Completo de Escalas/Eventos (Priority: P1)

Como líder de ministério, quero editar e excluir escalas existentes, para corrigir informações e remover eventos cancelados.

**Why this priority**: A Fase 1 implementou criação e visualização de escalas, mas sem edição e exclusão o líder fica impossibilitado de corrigir erros ou cancelar eventos, impactando diretamente a organização do ministério.

**Independent Test**: Pode ser testado na página de Escalas — editar descrição/data/tipo deve persistir; excluir deve remover da lista com confirmação.

**Acceptance Scenarios**:

1. **Given** o líder está na lista de escalas, **When** ele clica no botão "Editar" de uma escala, **Then** o sistema abre um formulário preenchido com os dados atuais da escala (data, tipo de evento, descrição).
2. **Given** o líder está editando uma escala, **When** ele altera a data, tipo de evento ou descrição e confirma, **Then** o sistema atualiza o evento e exibe notificação de sucesso.
3. **Given** o líder está na lista ou nos detalhes de uma escala, **When** ele clica em excluir e confirma a ação, **Then** o sistema remove a escala e redireciona para a listagem.

---

### User Story 3 - Atribuição de Funções aos Integrantes (Priority: P1)

Como administrador do sistema, quero atribuir e remover funções (instrumentos/papéis) dos integrantes, para que o sistema saiba quais membros podem tocar quais instrumentos na hora de montar escalas.

**Why this priority**: A Fase 1 implementou CRUD de integrantes, porém sem a gestão de funções associadas. A atribuição de funções é essencial para que a montagem de escalas considere as habilidades de cada membro.

**Independent Test**: Pode ser testado na página de Integrantes — ao editar um integrante deve ser possível adicionar/remover funções; as badges de funções devem refletir as alterações.

**Acceptance Scenarios**:

1. **Given** o administrador está editando um integrante, **When** ele visualiza a seção de funções, **Then** o sistema exibe as funções atualmente atribuídas ao integrante e uma forma de adicionar novas.
2. **Given** o administrador está editando um integrante, **When** ele seleciona uma nova função (ex.: "Guitarra") e confirma, **Then** a função é adicionada ao integrante e aparece como badge.
3. **Given** o administrador está editando um integrante, **When** ele remove uma função existente, **Then** a função é desvinculada do integrante.

---

### User Story 4 - Gerenciamento de Artistas (Priority: P2)

Como líder de ministério, quero cadastrar, editar e excluir artistas, para que ao adicionar versões de músicas eu possa selecionar o artista correto de uma lista existente.

**Why this priority**: Artistas são pré-requisito para o cadastro de versões de músicas. Sem gestão de artistas, o líder não consegue vincular versões a artistas específicos.

**Independent Test**: Pode ser testado acessando a seção de Artistas na página de Configurações — listar, criar, editar e excluir devem funcionar com persistência no servidor.

**Acceptance Scenarios**:

1. **Given** o líder acessa a página de Configurações, **When** ele navega até a seção de Artistas, **Then** o sistema exibe a lista de artistas cadastrados.
2. **Given** o líder está na seção de Artistas, **When** ele cria um novo artista informando o nome, **Then** o artista aparece na lista.
3. **Given** o líder tenta criar um artista com nome já existente, **When** ele confirma, **Then** o sistema exibe mensagem de erro de duplicidade.
4. **Given** o líder clica em editar um artista, **When** ele altera o nome e confirma, **Then** o nome é atualizado na lista.
5. **Given** o líder clica em excluir um artista, **When** ele confirma a exclusão, **Then** o artista é removido da lista.

---

### User Story 5 - Gerenciamento de Entidades Auxiliares (Priority: P2)

Como administrador do sistema, quero gerenciar as entidades auxiliares (Tags, Funções, Tonalidades, Tipos de Evento) através de uma interface dedicada, para manter as opções de seleção atualizadas sem depender de acesso direto ao banco de dados.

**Why this priority**: Essas entidades são usadas como referência em formulários e filtros de todo o sistema. Sem interface de gerenciamento, qualquer alteração requer acesso direto ao banco.

**Independent Test**: Pode ser testado em uma página de Configurações — cada seção de entidade auxiliar deve suportar CRUD completo.

**Acceptance Scenarios**:

1. **Given** o administrador acessa a página de Configurações, **When** ele navega até a seção de Tags, **Then** o sistema exibe a lista de tags com opções de criar, editar e excluir.
2. **Given** o administrador está na seção de Funções, **When** ele cria uma nova função (ex.: "Saxofone"), **Then** a função aparece na lista e fica disponível nos formulários de integrantes e músicas.
3. **Given** o administrador está na seção de Tonalidades, **When** ele cria, edita ou exclui uma tonalidade, **Then** a alteração reflete nos formulários de músicas.
4. **Given** o administrador está na seção de Tipos de Evento, **When** ele cria, edita ou exclui um tipo, **Then** a alteração reflete nos formulários de escalas.
5. **Given** o administrador tenta criar uma entidade com nome duplicado, **When** ele confirma, **Then** o sistema exibe mensagem de erro clara.

---

### User Story 6 - Dashboard com Dados Reais (Priority: P3)

Como líder de ministério, quero visualizar no painel principal estatísticas reais do sistema (total de músicas, escalas ativas, integrantes, próximos eventos), para ter uma visão geral da situação do ministério sem navegar por cada módulo individualmente.

**Why this priority**: O Dashboard é a porta de entrada do sistema, mas atualmente exibe dados fictícios. Substituir por dados reais completa a experiência de um sistema integrado, embora não seja bloqueante para as demais funcionalidades.

**Independent Test**: Pode ser testado acessando o Dashboard — os números e listas devem refletir os dados reais do banco, e qualquer adição/remoção em outro módulo deve atualizar o painel.

**Acceptance Scenarios**:

1. **Given** o líder acessa o Dashboard, **When** a página carrega, **Then** os cards de estatísticas (total de músicas, escalas, integrantes) exibem contagens reais vindas do servidor.
2. **Given** existem eventos futuros cadastrados, **When** o Dashboard carrega, **Then** a seção "Próximas Escalas" exibe os próximos eventos com data, tipo, músicas e integrantes associados.
3. **Given** um novo integrante é criado em outra página, **When** o líder retorna ao Dashboard, **Then** o total de integrantes reflete o novo valor.

---

### User Story 7 - Busca Funcional em Listagens (Priority: P3)

Como usuário do sistema, quero utilizar os campos de busca já presentes nas páginas de Músicas e Integrantes para filtrar resultados por nome, para encontrar rapidamente o registro desejado.

**Why this priority**: Os campos de busca já existem na interface mas não estão funcionais. Ativá-los melhora a usabilidade, especialmente à medida que a quantidade de registros cresce.

**Independent Test**: Pode ser testado digitando um termo no campo de busca — a lista deve filtrar conforme o texto digitado.

**Acceptance Scenarios**:

1. **Given** o usuário está na página de Músicas com vários registros, **When** ele digita um termo no campo de busca, **Then** a lista é filtrada exibindo apenas músicas cujo nome contenha o termo.
2. **Given** o usuário está na página de Integrantes, **When** ele digita um nome no campo de busca, **Then** a lista é filtrada exibindo apenas integrantes cujo nome contenha o termo.
3. **Given** o usuário limpa o campo de busca, **When** o campo fica vazio, **Then** a lista completa é restaurada.

---

### Edge Cases

- O que acontece quando o líder tenta excluir uma música que está associada a uma escala? O sistema deve exibir mensagem de erro indicando que a música está em uso e não pode ser excluída.
- O que acontece quando o líder tenta excluir um artista que possui versões vinculadas a músicas? O sistema deve exibir mensagem de erro indicando a dependência.
- O que acontece quando o administrador tenta excluir uma função atribuída a integrantes? O sistema deve exibir mensagem de erro indicando a dependência.
- O que acontece quando dois usuários editam a mesma escala simultaneamente? O último a salvar sobrescreve as alterações (otimista), e o sistema exibe os dados atualizados na tela.
- O que acontece quando a busca não encontra nenhum resultado? O sistema deve exibir um estado vazio amigável com a mensagem "Nenhum resultado encontrado para [termo]".
- O que acontece quando o usuário tenta adicionar uma versão de música sem selecionar um artista? O sistema deve bloquear o envio e indicar o campo obrigatório.

## Requirements *(mandatory)*

### Functional Requirements

#### Módulo de Músicas — Gestão Completa

- **FR-001**: O sistema DEVE permitir a edição do nome e da tonalidade de uma música existente.
- **FR-002**: O sistema DEVE permitir a exclusão de uma música, com diálogo de confirmação antes da remoção.
- **FR-003**: O sistema DEVE exibir uma página de detalhes da música com rota própria (`/musicas/:id`), contendo todas as suas relações (versões, tags, funções), seguindo o padrão de `/escalas/:id`.
- **FR-004**: O sistema DEVE permitir adicionar versões a uma música, informando artista, BPM (opcional), cifras (opcional), letras (opcional) e link da versão (opcional).
- **FR-005**: O sistema DEVE permitir editar e remover versões existentes de uma música.
- **FR-006**: O sistema DEVE permitir adicionar e remover tags de uma música, selecionando de uma lista existente.
- **FR-007**: O sistema DEVE permitir adicionar e remover funções requeridas de uma música, selecionando de uma lista existente.

#### Módulo de Escalas/Eventos — Gestão Completa

- **FR-008**: O sistema DEVE permitir a edição de uma escala existente (data, tipo de evento, descrição), com formulário preenchido com dados atuais.
- **FR-009**: O sistema DEVE permitir a exclusão de uma escala, com diálogo de confirmação antes da remoção.

#### Módulo de Integrantes — Funções

- **FR-010**: O sistema DEVE exibir as funções atribuídas a cada integrante no dialog de edição existente, em uma seção dedicada com chips/badges.
- **FR-011**: O sistema DEVE permitir adicionar funções a um integrante diretamente no dialog de edição, selecionando de uma lista existente via seletor.
- **FR-012**: O sistema DEVE permitir remover funções de um integrante diretamente no dialog de edição, clicando no badge/chip da função.

#### Módulo de Artistas

- **FR-013**: O sistema DEVE fornecer uma seção de Artistas dentro da página de Configurações para listar todos os artistas cadastrados.
- **FR-014**: O sistema DEVE permitir criar novos artistas com validação de nome único.
- **FR-015**: O sistema DEVE permitir editar o nome de um artista existente.
- **FR-016**: O sistema DEVE permitir excluir um artista, com diálogo de confirmação.

#### Módulo de Entidades Auxiliares (Configurações)

- **FR-017**: O sistema DEVE fornecer uma página de Configurações com abas horizontais para gerenciar Artistas, Tags, Funções, Tonalidades e Tipos de Evento, permitindo alternar entre seções sem recarregar a página.
- **FR-018**: O sistema DEVE permitir CRUD completo (criar, listar, editar, excluir) para cada entidade auxiliar.
- **FR-019**: O sistema DEVE validar unicidade de nomes ao criar ou editar entidades auxiliares.

#### Dashboard

- **FR-020**: O sistema DEVE exibir no Dashboard contagens reais de músicas, integrantes e escalas vindas do servidor.
- **FR-021**: O sistema DEVE exibir no Dashboard a lista de próximos eventos (ordenados por data) com informações resumidas.

#### Busca

- **FR-022**: O sistema DEVE filtrar a listagem de músicas conforme o texto digitado no campo de busca.
- **FR-023**: O sistema DEVE filtrar a listagem de integrantes conforme o texto digitado no campo de busca.

### Key Entities

- **Artista**: Intérprete ou banda que executa uma versão de uma música. Possui nome (único). Relaciona-se com versões de músicas.
- **Versão**: Interpretação de uma música por um artista específico. Possui BPM (opcional), cifras (opcional), letras (opcional), link para referência (opcional). Pertence a uma música e a um artista.
- **Tag**: Classificação temática ou funcional de uma música (ex.: adoração, celebração, comunhão). Possui nome (único).
- **Função**: Papel ou instrumento no ministério de louvor (ex.: vocal, guitarra, bateria). Possui nome (único). Relaciona-se com integrantes e com funções requeridas por músicas.
- **Tonalidade**: Tom musical (ex.: C, D, Em, G#). Possui tom (único). Referenciada pelas músicas.
- **Tipo de Evento**: Categoria do evento (ex.: culto de celebração, culto de oração, casamento). Possui nome (único). Referenciado pelos eventos/escalas.

## Assumptions

- A Fase 1 (005-frontend-backend-integration) está completa e estável — listagem e criação de integrantes, músicas e escalas funcionam corretamente.
- O backend possui todos os endpoints CRUD necessários já implementados e documentados na OpenAPI (confirmado: 64 endpoints, 14 recursos).
- Não há autenticação/autorização obrigatória nos endpoints nesta fase.
- O CORS está habilitado no servidor para desenvolvimento local.
- A busca por nome será implementada no lado do cliente (filtragem local) nesta fase, sem necessidade de endpoint dedicado de busca no backend.
- As estatísticas do Dashboard serão calculadas a partir dos endpoints de listagem existentes (contagem de registros retornados), sem necessidade de endpoints agregados no backend.
- Os endpoints de exclusão do backend retornam erro adequado (ex.: 409 Conflict) quando há dependências que impedem a remoção.

## Out of Scope

- Autenticação e autorização de usuários.
- Página de Relatórios com dados reais (requer endpoints de agregação não existentes).
- Página de Histórico com dados reais (requer lógica de eventos passados vs futuros).
- Seleção de versão específica ao associar música a uma escala (requer alteração no endpoint do backend).
- Upload de arquivos (cifras, letras em PDF).
- Notificações push ou em tempo real.
- Responsividade avançada para dispositivos móveis (manter nível atual).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos endpoints do backend para Músicas (CRUD + versões + tags + funções) estão conectados e utilizáveis pela interface.
- **SC-002**: 100% dos endpoints do backend para Escalas/Eventos (CRUD) estão conectados e utilizáveis pela interface.
- **SC-003**: Integrantes possuem gestão completa de funções (adicionar/remover) via interface.
- **SC-004**: As 4 entidades auxiliares (Tags, Funções, Tonalidades, Tipos de Evento) possuem CRUD funcional via interface.
- **SC-005**: Artistas possuem CRUD funcional via interface.
- **SC-006**: O Dashboard exibe exclusivamente dados reais do servidor — nenhum valor fictício permanece.
- **SC-007**: Os campos de busca nas páginas de Músicas e Integrantes filtram resultados conforme o texto digitado.
- **SC-008**: Todas as operações de exclusão exibem diálogo de confirmação antes de executar a ação.
- **SC-009**: Todas as operações de criação, edição e exclusão exibem notificação de sucesso ou erro ao usuário.
- **SC-010**: O sistema não apresenta tela em branco em nenhum cenário de erro — sempre exibe feedback visual adequado.
