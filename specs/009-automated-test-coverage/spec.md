# Feature Specification: Cobertura de Testes Automatizados

**Feature Branch**: `009-automated-test-coverage`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "preciso adicionar no projeto cobertura de testes automatizados, tanto no frontend quanto no backend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurar infraestrutura de testes no frontend (Priority: P1)

Como desenvolvedor, quero que o pacote frontend tenha Vitest configurado como framework de teste unitário, para que eu consiga escrever e executar testes com o comando `npm run test`.

**Why this priority**: Sem a infraestrutura configurada, nenhum teste unitário pode ser escrito ou executado no frontend. Esta é uma dependência bloqueante para as demais user stories do frontend.

**Independent Test**: Pode ser verificado executando `npm run test` no pacote frontend e obtendo saída sem erros de configuração.

**Acceptance Scenarios**:

1. **Given** o pacote frontend sem configuração de testes unitários, **When** Vitest é configurado, **Then** `npm run test` executa com sucesso (sem erros de setup).
2. **Given** a configuração Vitest do frontend, **When** um arquivo de teste simples é criado, **Then** ele é encontrado e executado pelo runner.
3. **Given** o projeto frontend usa path aliases (`@/`), **When** testes importam módulos com alias, **Then** a resolução funciona corretamente.

---

### User Story 2 - Validar regras de negócio do backend com testes unitários (Priority: P1)

Como desenvolvedor, quero que cada serviço do backend possua testes unitários que validem suas regras de negócio (validação de campos obrigatórios, verificação de entidades existentes, formatação de dados), para que eu tenha confiança de que correções e novas features não quebram comportamento existente.

**Why this priority**: Os serviços concentram 100% da lógica de negócio do backend. Testar esta camada oferece o maior retorno de investimento porque protege contra regressões sem depender de infraestrutura externa.

**Independent Test**: Pode ser testado executando `npm run test` no pacote backend. Cada teste roda isoladamente com mocks da camada de repositório, sem necessidade de banco de dados.

**Acceptance Scenarios**:

1. **Given** um serviço que valida campos obrigatórios, **When** o campo nome é omitido na criação, **Then** o serviço lança um erro com código 400 e mensagem descritiva.
2. **Given** um serviço que verifica existência de entidades, **When** um ID de referência não existe, **Then** o serviço lança um erro com código 404 e mensagem descritiva.
3. **Given** um serviço que transforma dados brutos em formato normalizado, **When** dados brutos são fornecidos, **Then** o retorno possui a estrutura esperada com campos renomeados e relações achatadas.
4. **Given** qualquer teste unitário de serviço, **When** executado, **Then** não requer banco de dados, rede ou estado externo.

---

### User Story 3 - Validar schemas Zod do frontend com testes unitários (Priority: P2)

Como desenvolvedor, quero que os schemas Zod de validação do frontend possuam testes unitários cobrindo validações de campos, coerções de tipo e regras de validação cruzada, para garantir que formulários rejeitam dados inválidos e aceitam dados válidos de forma previsível.

**Why this priority**: Os schemas Zod são a primeira barreira de validação do frontend. Testes aqui são rápidos, sem dependência de DOM, e previnem regressões em regras de formulário que afetam diretamente a experiência do usuário.

**Independent Test**: Pode ser testado executando `npm run test` no pacote frontend. Cada teste chama `schema.safeParse()` com dados válidos e inválidos, verificando mensagens de erro e dados transformados.

**Acceptance Scenarios**:

1. **Given** um schema com campo obrigatório, **When** parse é chamado com campo vazio, **Then** o resultado contém erro com mensagem esperada no caminho do campo.
2. **Given** um schema com campo UUID opcional, **When** parse é chamado com string vazia, **Then** a validação aceita (por conta do `.or(z.literal(""))`).
3. **Given** um schema com validação cruzada (ex: artista obrigatório quando dados de versão presentes), **When** dados de versão são preenchidos sem artista, **Then** o resultado contém erro específico no campo artista.
4. **Given** um schema com coerção numérica (ex: BPM), **When** parse é chamado com string "120", **Then** o resultado contém o número 120.

---

### User Story 4 - Validar serviços HTTP do frontend com testes unitários (Priority: P3)

Como desenvolvedor, quero que as funções de serviço do frontend (camada de comunicação com a API) possuam testes unitários que verifiquem construção de requisições, tratamento de respostas e parsing Zod, para garantir que a comunicação entre frontend e backend funciona como esperado.

**Why this priority**: Os serviços do frontend são responsáveis por construir payloads, chamar endpoints corretos e parsear respostas. Erros nesta camada causam falhas silenciosas ou mensagens de erro confusas para o usuário.

**Independent Test**: Pode ser testado executando `npm run test` no pacote frontend. Cada teste mocka a função de fetch HTTP e verifica que o serviço chama o endpoint correto, envia o payload esperado e parseia a resposta.

**Acceptance Scenarios**:

1. **Given** uma função de serviço de criação, **When** chamada com dados válidos, **Then** envia POST para o endpoint correto com payload JSON adequado.
2. **Given** uma função de serviço que recebe resposta da API, **When** a resposta está no formato esperado, **Then** retorna dados parseados pelo schema Zod correspondente.
3. **Given** uma função de serviço, **When** a API retorna erro, **Then** a exceção é propagada com mensagem legível.

---

### Edge Cases

- O que acontece quando um mock de repositório retorna `null` para entidade esperada?
- Como os testes lidam com campos opcionais que podem ser `undefined`, `null` ou `""`?
- Como validar que os schemas Zod tratam corretamente valores na fronteira (BPM = 0, BPM = 1, strings vazias vs. undefined)?
- Como garantir que testes do frontend não dependem de ambiente DOM quando testam schemas e serviços?
- Como tratar transações Prisma (`$transaction`) em testes de serviço do backend?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O pacote backend DEVE possuir testes unitários para todos os serviços existentes (8 serviços: artistas, categorias, eventos, funcoes, integrantes, musicas, tipos-eventos, tonalidades).
- **FR-002**: Os testes de serviço do backend DEVEM mockar a camada de repositório, sem depender de banco de dados real.
- **FR-003**: Os testes de serviço do backend DEVEM cobrir: validação de campos obrigatórios, verificação de existência de entidades referenciadas, formatação/transformação de dados e códigos de erro retornados.
- **FR-004**: O pacote frontend DEVE possuir framework de teste unitário configurado com suporte a path aliases (`@/`).
- **FR-005**: O pacote frontend DEVE possuir testes unitários para todos os schemas Zod existentes (5 arquivos: artista, evento, integrante, musica, shared).
- **FR-006**: Os testes de schema do frontend DEVEM cobrir: campos obrigatórios, campos opcionais, coerções de tipo, validações cruzadas (superRefine) e valores de fronteira.
- **FR-007**: O pacote frontend DEVE possuir testes unitários para as funções de serviço HTTP existentes (5 arquivos: artistas, eventos, integrantes, musicas, support).
- **FR-008**: Os testes de serviço do frontend DEVEM mockar a camada de comunicação HTTP, sem depender de API real.
- **FR-009**: Todos os callbacks de teste (`describe`, `it`, `test`) DEVEM possuir docstrings JSDoc em português do Brasil, conforme regra do CLAUDE.md.
- **FR-010**: Todos os testes DEVEM poder ser executados via `npm run test` no respectivo pacote.
- **FR-011**: A suíte de testes de cada pacote DEVE executar de forma independente, sem dependência entre pacotes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos serviços do backend (8/8) possuem arquivos de teste correspondentes com cenários passando.
- **SC-002**: 100% dos schemas Zod do frontend (5/5) possuem arquivos de teste correspondentes com cenários passando.
- **SC-003**: 100% dos serviços HTTP do frontend (5/5) possuem arquivos de teste correspondentes com cenários passando.
- **SC-004**: `npm run test` executa com sucesso (exit code 0) em ambos os pacotes.
- **SC-005**: Nenhum teste depende de infraestrutura externa (banco de dados, API real, rede).
- **SC-006**: A suíte completa de testes de ambos os pacotes executa em menos de 30 segundos.

## Assumptions

- O Vitest 4 será usado como framework de teste em ambos os pacotes, conforme stack definida no CLAUDE.md.
- A configuração existente do Vitest no backend será mantida e usada como referência para o frontend.
- Testes de componentes React (renderização, interação DOM) estão fora do escopo desta feature — o foco é lógica pura (serviços e schemas).
- Testes E2E (Playwright) existentes no frontend não são afetados por esta feature.
- A cobertura mínima de código (coverage %) não é uma meta desta feature — o foco é na existência de testes para cenários de negócio relevantes.
- Testes de controllers e routes do backend estão fora do escopo — controllers são passthrough para serviços e seriam melhor cobertos por testes de integração em uma feature futura.
