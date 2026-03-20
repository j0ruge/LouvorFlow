# Feature Specification: Pipeline CI/CD Agnóstico para Organização

**Feature Branch**: `017-agnostic-cicd-pipeline`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Pipeline CI/CD agnóstico e reutilizável para qualquer repositório Node/React da organização, baseado nas lições aprendidas da implementação-referência"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adoção do Pipeline em Novo Repositório (Priority: P1)

Como desenvolvedor responsável por um novo repositório da organização, quero adotar o pipeline CI/CD preenchendo apenas um arquivo de configuração por projeto, para que em menos de 1 hora eu tenha CI (lint + testes) em PRs e CD (build + deploy) automático em staging e produção, sem precisar entender os detalhes internos dos workflows.

**Why this priority**: Esta é a proposta de valor central — transformar a adoção de CI/CD de um processo manual de dias (como na implementação-referência) em um processo guiado de menos de 1 hora. Sem isso, cada novo repositório repete os mesmos erros e retrabalho.

**Independent Test**: Pode ser testado criando um repositório de exemplo, preenchendo o arquivo de configuração (`project-config.md`), seguindo o quickstart, e verificando que PRs disparam CI e merges na develop disparam deploy em staging.

**Acceptance Scenarios**:

1. **Given** um repositório novo da organização com Dockerfile funcional, **When** o desenvolvedor preenche o `project-config.md` com os valores do projeto e segue o quickstart, **Then** os 3 workflows (CI, CD staging, CD production) estão configurados e operacionais em menos de 1 hora.
2. **Given** o `project-config.md` indica `TEST_FRAMEWORK = none`, **When** os workflows são adaptados, **Then** o job de testes é omitido automaticamente, sem necessidade de edição manual.
3. **Given** o `project-config.md` indica `PRISMA_MIGRATE = false`, **When** o workflow de CD executa, **Then** o step de migration é omitido, sem erro no pipeline.
4. **Given** o desenvolvedor comete um erro no `project-config.md` (ex: variável faltante em `ENV_VARS`), **When** o container tenta iniciar, **Then** o erro é detectável pelo checklist de validação pré-deploy documentado no quickstart.

---

### User Story 2 - Deploy Automático em Staging ao Mergear na Develop (Priority: P1)

Como desenvolvedor, quero que ao fazer push/merge na branch `develop` de qualquer repositório configurado, o sistema automaticamente execute validações de qualidade, construa a imagem Docker e faça deploy no servidor de staging, para que eu possa validar as alterações sem intervenção manual.

**Why this priority**: Esta é a funcionalidade central que elimina trabalho manual repetitivo. Staging é o ambiente mais utilizado durante desenvolvimento ativo e onde o ciclo de feedback precisa ser mais rápido.

**Independent Test**: Pode ser testado fazendo push na branch `develop` de qualquer repositório configurado e verificando que o container atualizado está rodando no servidor de staging com a versão correta.

**Acceptance Scenarios**:

1. **Given** um desenvolvedor faz merge na `develop` de um repositório configurado, **When** o pipeline é acionado, **Then** executa lint, testes (se configurado), build da imagem Docker com tag `:staging`, push para o registry privado, e deploy automático no servidor de staging.
2. **Given** o pipeline de CI detecta falhas no lint ou testes, **When** o job de CI falha, **Then** o build e deploy NÃO são executados e o desenvolvedor recebe notificação da falha.
3. **Given** o deploy em staging é concluído com sucesso, **When** o container novo está rodando, **Then** a aplicação está acessível via subdomínio configurado para o ambiente de staging.

---

### User Story 3 - Deploy Automático em Produção via Tag/Release (Priority: P1)

Como líder técnico, quero que ao criar uma tag/release de qualquer repositório configurado, o sistema automaticamente construa e faça deploy da versão estável no servidor de produção, para garantir que apenas código validado chegue aos usuários finais.

**Why this priority**: Produção atende os usuários finais. A automação garante consistência e elimina erros humanos em deploys críticos.

**Independent Test**: Pode ser testado criando uma tag (ex: `v1.5.0`) e verificando que o container atualizado está rodando no servidor de produção.

**Acceptance Scenarios**:

1. **Given** uma tag `v1.5.0` é criada em um repositório configurado, **When** o pipeline é acionado, **Then** executa CI completo, build da imagem com tags de versão e latest, push para o registry, e deploy no servidor de produção.
2. **Given** o CI falha durante o fluxo de produção, **When** os testes não passam, **Then** nenhuma imagem é publicada e nenhum deploy é realizado.
3. **Given** o deploy em produção é concluído, **When** o container novo está rodando, **Then** a aplicação está acessível via subdomínio configurado para o ambiente de produção.

---

### User Story 4 - Pipeline de CI com Qualidade de Código em PRs (Priority: P2)

Como desenvolvedor, quero que o pipeline de CI execute lint e testes automaticamente em cada PR, para que eu tenha feedback rápido sobre a qualidade do código antes do merge.

**Why this priority**: É a barreira de qualidade que sustenta a confiabilidade dos deploys automáticos. Garante que nenhum código quebrado entre nas branches protegidas.

**Independent Test**: Pode ser testado abrindo um PR com código que falha no lint e verificando que o pipeline reporta a falha como status check.

**Acceptance Scenarios**:

1. **Given** um desenvolvedor abre um PR contra `develop` ou `main`, **When** o pipeline é acionado, **Then** executa checkout, instalação de dependências, lint e testes (se configurado).
2. **Given** o código contém erros de lint, **When** o CI roda, **Then** o pipeline falha e reporta os erros.
3. **Given** todos os checks passam, **When** o CI é concluído, **Then** o status do PR é atualizado como "checks passed".

---

### User Story 5 - Configuração Segura de Credenciais e Imagens (Priority: P2)

Como responsável pela segurança, quero que todas as credenciais sejam gerenciadas via secrets do provedor CI/CD e que as imagens Docker sejam privadas, para que nenhum artefato ou segredo seja exposto.

**Why this priority**: Segurança é fundamental, mas a configuração é pontual e não bloqueia o fluxo principal de desenvolvimento.

**Independent Test**: Pode ser testado verificando que as imagens no registry estão privadas e que tentativas de pull sem autenticação falham.

**Acceptance Scenarios**:

1. **Given** o pipeline gera um arquivo `.env` temporário a partir de secrets, **When** o deploy termina (sucesso ou falha), **Then** o arquivo `.env` é removido do disco do runner.
2. **Given** um usuário sem permissão tenta fazer pull de uma imagem, **When** executa pull sem autenticação, **Then** recebe erro de autenticação.
3. **Given** as variáveis de ambiente são validadas na inicialização da aplicação, **When** uma variável está faltante ou malformada no `.env` gerado, **Then** o container falha imediatamente com mensagem de erro clara.

---

### Edge Cases

- **Runner offline durante push**: O job fica em fila e executa quando o runner reconectar. Runners instalados como serviço de sistema garantem reconexão automática.
- **Build Docker falha**: O pipeline falha no job de build, nenhum deploy é realizado, desenvolvedor é notificado.
- **Disco cheio no servidor**: O pull falha, o pipeline reporta erro. Limpeza automática de imagens dangling após cada deploy previne acúmulo.
- **Deploys simultâneos no mesmo ambiente**: Controle de concorrência garante processamento sequencial — um job por vez por ambiente.
- **Container novo falha ao iniciar (crash loop)**: O container antigo já foi removido. Rollback manual via pull de tag anterior e recreate. Procedimento documentado no quickstart.
- **Variável de ambiente faltante no .env gerado**: A validação de schema na inicialização da aplicação rejeita e o container crashloop é detectável via logs. O checklist de validação pré-deploy mitiga esse cenário.
- **URL em secret sem protocolo**: Validações de schema que exigem URL rejeitam strings sem protocolo. Documentado como regra no quickstart.
- **Nome da rede do proxy incorreto**: Container falha ao conectar na rede. Checklist pré-deploy inclui verificação com `docker network ls`.
- **DNS não aponta para o servidor correto**: Certificado SSL não é emitido, resultando em erro de conexão. Verificação de DNS é pré-requisito documentado.
- **Porta da aplicação diferente de 80 sem VIRTUAL_PORT**: O proxy encaminha para porta errada, resultando em conexão recusada. Regra condicional no project-config garante configuração correta.

## Clarifications

### Session 2026-03-18

- Q: Os workflows devem ser copiados manualmente ou gerados por uma ferramenta CLI? → A: Na v1, copiados manualmente a partir de templates e adaptados via project-config. Geração automatizada (CLI/script) é evolução futura (v2).
- Q: O pipeline suporta monorepos? → A: Sim, via padrão multi-config — um project-config por package, workflows nomeados por package (ex: `ci-backend.yml`, `cd-staging-frontend.yml`). Cada package é tratado como projeto independente com seu próprio Dockerfile, compose file e project-config. Os templates de workflow/compose não mudam; apenas são instanciados uma vez por package.
- Q: Qual a estratégia de notificação para falhas? → A: Notificações nativas do provedor CI/CD (email + status checks na UI). Zero configuração adicional.
- Q: Qual a estratégia de rollback? → A: Rollback manual via pull de tag anterior + recreate. Rollback automatizado está fora do escopo.
- Q: Como o pipeline trata projetos frontend (ex: Vite/React) onde variáveis de configuração são injetadas no build, não no runtime? → A: Frontends requerem variáveis de configuração (ex: VITE_*) como build args do Docker, produzindo imagens específicas por ambiente. O job de build precisa de acesso aos secrets do ambiente. Isso é coberto por um FR explícito (FR-016).
- Q: Como repos que já adotaram o template recebem atualizações quando o template evolui? → A: Manter um changelog versionado das mudanças no template. Cada repo rastreia qual versão do template adotou (campo no project-config). Atualizações são aplicadas manualmente consultando o changelog. Automação via CLI é evolução futura (v2).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE definir um schema de configuração por projeto (`project-config.md`) que parametrize todos os valores variáveis entre repositórios (nome, gerenciador de pacotes, comandos de lint/teste, tipo de banco, caminhos, variáveis de ambiente).
- **FR-002**: O sistema DEVE executar pipeline de CI (checkout, dependências, lint, testes) automaticamente em cada PR contra branches protegidas (`develop`, `main`) para cada repositório configurado.
- **FR-003**: O sistema DEVE construir imagens Docker e publicar no registry privado da organização após o CI passar com sucesso.
- **FR-004**: O sistema DEVE fazer deploy automático no ambiente de staging quando há push/merge na branch `develop`, usando tag de staging.
- **FR-005**: O sistema DEVE fazer deploy automático no ambiente de produção quando uma tag de versão é criada, usando tags de versão e latest.
- **FR-006**: O sistema DEVE utilizar self-hosted runners instalados nos servidores locais para executar os jobs de deploy, sem necessidade de acesso SSH externo.
- **FR-007**: O sistema DEVE injetar variáveis de ambiente nos containers via secrets do provedor CI/CD, com geração temporária de arquivo de configuração e limpeza automática pós-deploy (inclusive em caso de falha).
- **FR-008**: O pipeline DEVE falhar e impedir o deploy caso qualquer etapa de CI (lint ou testes) falhe.
- **FR-009**: O sistema DEVE suportar regras condicionais baseadas no project-config: omitir testes quando `TEST_FRAMEWORK = none`, omitir migrations quando `PRISMA_MIGRATE = false`, omitir service container de banco quando `DB_SERVICE_IMAGE = none`.
- **FR-010**: O sistema DEVE garantir controle de concorrência: cancelar CI anterior em PRs (feedback rápido) e não cancelar deploys em progresso (evitar estados inconsistentes).
- **FR-011**: O sistema DEVE executar migrations de banco de dados como step separado antes do deploy, quando configurado (`PRISMA_MIGRATE = true`), garantindo que a migration complete antes da aplicação iniciar.
- **FR-012**: O sistema DEVE documentar um quickstart com checklist de validação pré-deploy cobrindo: DNS, rede do proxy, variáveis de ambiente vs schema de validação, portas, e formato de secrets URL.
- **FR-013**: O sistema DEVE executar limpeza automática de imagens dangling após cada deploy bem-sucedido.
- **FR-014**: Para aplicações com porta diferente de 80, o sistema DEVE configurar a variável de porta virtual para roteamento correto pelo proxy reverso.
- **FR-015**: O deploy DEVE utilizar compose pull + recreate forçado para garantir atualização mesmo quando apenas a tag da imagem mudou.
- **FR-016**: Para projetos do tipo frontend (`PROJECT_TYPE = frontend`), o sistema DEVE injetar variáveis de configuração do cliente (ex: prefixadas com `VITE_*`) como build args do Docker durante o build da imagem, pois essas variáveis são embutidas no bundle estático em tempo de build e não podem ser configuradas em runtime. Isso implica que imagens frontend são específicas por ambiente (staging e produção são imagens distintas).
- **FR-017**: O sistema DEVE manter um changelog versionado do template de pipeline. Cada `project-config.md` DEVE incluir um campo `TEMPLATE_VERSION` indicando qual versão do template foi adotada. O changelog documenta as mudanças entre versões para que repos existentes possam aplicar atualizações manualmente.

### Key Entities

- **Project Config**: Arquivo de configuração por repositório que parametriza o pipeline. Contém: nome do repo, gerenciador de pacotes, comandos de lint/teste, tipo de banco, caminhos de Dockerfile/compose, variáveis de ambiente, tipo de projeto, e versão do template adotada (`TEMPLATE_VERSION`).
- **Pipeline**: Fluxo automatizado composto por jobs de CI e CD, disparado por eventos Git. Possui status (running, passed, failed), duração e logs.
- **Ambiente (Environment)**: Contexto de execução (staging ou produção) com servidor, domínio, secrets e runner específico.
- **Imagem Docker**: Artefato de build versionado, armazenado em registry privado. Identificada por tags (staging, versão, latest).
- **Self-Hosted Runner**: Agente instalado no servidor local que executa jobs de deploy. Identificado por labels de ambiente.
- **Container**: Instância em execução de uma imagem Docker, com variáveis injetadas e roteamento via proxy reverso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desenvolvedores não precisam acessar servidores manualmente para realizar deploys em nenhum dos projetos configurados (zero deploy manual).
- **SC-002**: O tempo entre um merge na branch de desenvolvimento e a aplicação atualizada rodando em staging é inferior a 10 minutos.
- **SC-003**: O tempo entre a criação de uma tag e a aplicação atualizada rodando em produção é inferior a 15 minutos.
- **SC-004**: 100% dos deploys em produção passam por validação de qualidade (lint e testes) antes da publicação.
- **SC-005**: Nenhuma credencial ou segredo é exposta no código-fonte ou nos logs do pipeline.
- **SC-006**: Um novo repositório pode ser integrado ao pipeline em menos de 1 hora seguindo o quickstart e o project-config.
- **SC-007**: O sistema suporta deploys independentes — atualizar um repositório não afeta os containers dos outros.
- **SC-008**: Em caso de falha no CI, o deploy é bloqueado e o desenvolvedor é notificado em menos de 5 minutos via notificações nativas do provedor CI/CD.
- **SC-009**: O checklist de validação pré-deploy previne os 10 erros mais comuns identificados na implementação-referência (DNS, rede proxy, variáveis faltantes, URLs sem protocolo, porta virtual, port mapping, auth GHCR, etc.).

## Assumptions

- Os servidores de staging e produção já possuem Docker e docker compose instalados e operacionais.
- Já existe um proxy reverso configurado nos servidores que detecta containers automaticamente via Docker socket.
- Os repositórios estão hospedados em um provedor Git que suporta CI/CD com workflows declarativos (ex: GitHub Actions, GitLab CI).
- Cada repositório já possui um Dockerfile funcional para build de produção.
- DNS já está configurado apontando para os respectivos servidores (deve ser verificado como pré-requisito antes de cada deploy em novo domínio).
- Os runners serão instalados nos servidores com labels de ambiente para roteamento correto dos jobs.
- Cada aplicação roda em seu próprio container Docker isolado.
- Para monorepos, cada package DEVE ter seu próprio Dockerfile, compose file e project-config. Path filters nos workflows garantem que apenas o package alterado dispara CI/CD.

## Out of Scope

- Configuração inicial de DNS e certificados SSL (assume-se proxy reverso com auto-SSL já operacional).
- Monitoramento e alertas de saúde dos containers (pode usar ferramentas existentes como Portainer).
- Estratégias de rollback automatizado (rollback é manual via tag anterior).
- Configuração de banco de dados nos servidores (assume-se bancos já operacionais).
- Testes end-to-end (E2E) no pipeline — apenas lint e testes unitários/integração existentes.
- CI/CD para infraestrutura (IaC) — apenas para código das aplicações.
- Monorepos são suportados via padrão multi-config (ver Clarifications). Orquestração cross-package (ex: build condicional baseado em dependências entre packages) está fora do escopo.
- Geração automatizada de workflows via CLI/script (v1 é manual com templates; automação é evolução futura).
- Suporte a projetos que não sejam Node.js/React (adaptação para outras stacks é evolução futura).

## Dependencies

- Provedor de CI/CD com suporte a workflows declarativos e self-hosted runners (ex: GitHub Actions).
- Registry de containers privado (ex: GitHub Container Registry, GitLab Container Registry).
- Acesso administrativo aos servidores para instalação dos runners.
- Acesso administrativo aos repositórios para configuração de secrets e environments.
- DNS interno configurado para os domínios de staging e produção.

---

## Lessons Learned (da implementação-referência)

> As seguintes lições foram capturadas durante a implementação nos repositórios `digital_service_report_api` e `estimates_api`. Elas informam os requisitos e o checklist de validação desta spec.

| #  | Lição                                                        | Impacto         | Requisito Relacionado |
| -- | ------------------------------------------------------------ | --------------- | --------------------- |
| 1  | Verificar DNS antes do primeiro deploy em novo domínio       | SSL falha       | FR-012                |
| 2  | Nome da rede do proxy varia por instalação                   | Deploy falha    | FR-012                |
| 3  | Generate .env deve espelhar validação de schema da aplicação | Container crash | FR-007, FR-012        |
| 4  | Secrets URL devem incluir protocolo https://                 | Container crash | FR-007, FR-012        |
| 5  | VIRTUAL_PORT obrigatório quando porta da app diferente de 80 | App inacessível | FR-014                |
| 6  | Port mapping desnecessário com proxy reverso                 | Risco segurança | FR-015                |
| 7  | Auth do registry: contexto sudo vs user                      | Deploy falha    | FR-006                |
| 8  | Rodar lint + testes localmente antes do primeiro push        | CI falha        | FR-002                |
| 9  | Imagens de service container podem ser descontinuadas        | CI bloqueado    | FR-009                |
| 10 | Frontends Vite: variáveis VITE_* são build-time, não runtime | App sem config  | FR-016                |
