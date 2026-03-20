# Tasks: Pipeline CI/CD Agnóstico para Organização

**Input**: Design documents from `/specs/017-agnostic-cicd-pipeline/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/workflow-contract.md, quickstart.md

**Tests**: Não incluídos — feature de infraestrutura/documentação. Validação via quickstart.md checklist pré-deploy na fase final.

**Organization**: Tasks agrupadas por user story. US4, US2, US3 são validações de artefatos existentes e podem rodar em paralelo. US1 é o core (template reutilizável). US5 é validação de segurança.

**Scope**: O repositório `estimates_api` já possui CI/CD funcional. Esta feature extrai padrões em templates agnósticos e valida conformidade.

**Phase Ordering**: Fases seguem o grafo de dependências, não a prioridade das user stories. US4 (P2) é implementada antes de US1 (P1) porque US1 depende dos workflow templates criados nas Phases 3-5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Template Structure)

**Purpose**: Criar a estrutura de diretórios e arquivos base do template agnóstico

- [x] T001 Criar `specs/017-agnostic-cicd-pipeline/templates/` com subdiretórios `workflows/` e `compose/` para os templates agnósticos
- [x] T002 [P] Criar `specs/017-agnostic-cicd-pipeline/CHANGELOG.md` com entry v1.0.0 (baseline) conforme Contract 7 do workflow-contract.md

**Checkpoint**: Estrutura de templates pronta para receber os artefatos.

---

## Phase 2: Foundational (Project Config Schema)

**Purpose**: Definir o schema do project-config com TEMPLATE_VERSION e criar a instância para estimates_api

**⚠️ CRITICAL**: O project-config é o artefato central que parametriza todo o template

- [x] T003 Criar `specs/017-agnostic-cicd-pipeline/templates/project-config-template.md` com todos os campos do schema R-010 (incluindo `TEMPLATE_VERSION`), regras condicionais, e instruções de preenchimento, baseado no schema definido em research.md R-010 e data-model.md Entity 2
- [x] T004 Criar `specs/017-agnostic-cicd-pipeline/project-config.md` como instância preenchida para `estimates_api` (valores do 001 project-config + campo `TEMPLATE_VERSION: 1.0.0`), validando que todos os campos correspondem ao estado atual do repositório (package.json, src/env.ts, Dockerfile, infra/docker-compose.yml)

**Checkpoint**: Schema do project-config definido e instância para estimates_api preenchida.

---

## Phase 3: User Story 4 - Pipeline de CI em PRs (Priority: P2)

**Goal**: Validar que o workflow CI existente está em conformidade com Contract 1 e extrair template agnóstico.

**Independent Test**: Abrir PR contra `develop` ou `main` com erro de lint e verificar que o pipeline reporta a falha.

### Implementation for User Story 4

- [x] T005 [US4] Validar `.github/workflows/ci.yml` contra Contract 1 do workflow-contract.md: verificar trigger (`pull_request` em `develop`/`main`), job `lint` (checkout, setup-node, `npm ci`, `npx biome check .`), ausência de job `test` (pois `TEST_FRAMEWORK = none`), concurrency group com `cancel-in-progress: true`. Documentar desvios encontrados
- [x] T006 [US4] Criar `specs/017-agnostic-cicd-pipeline/templates/workflows/ci.yml.template` — versão agnóstica do ci.yml com placeholders `<INSTALL_CMD>`, `<LINT_CMD>`, `<TEST_CMD>`, comentários condicionais para `TEST_FRAMEWORK = none` e `DB_SERVICE_IMAGE`, baseado no Contract 1

**Checkpoint**: CI workflow validado e template agnóstico criado.

---

## Phase 4: User Story 2 - Deploy Automático em Staging (Priority: P1)

**Goal**: Validar que o workflow CD Staging existente está em conformidade com Contract 2 e extrair template agnóstico.

**Independent Test**: Fazer push na branch `develop` e verificar que o container atualizado está rodando no servidor de staging.

### Implementation for User Story 2

- [x] T007 [US2] Validar `.github/workflows/cd-staging.yml` contra Contract 2 do workflow-contract.md: verificar trigger (`push` em `develop`), 3 jobs encadeados (ci → build-and-push → deploy), permissions (`packages: write`), concurrency (`cancel-in-progress: false`), environment `staging`, Generate .env com TODAS as variáveis de `src/env.ts` + `IMAGE_TAG` + `NGINX_NETWORK_NAME` + `VIRTUAL_HOST`, cleanup `.env` com `if: always()`, `docker image prune -f`. Documentar desvios
- [x] T008 [US2] Criar `specs/017-agnostic-cicd-pipeline/templates/workflows/cd-staging.yml.template` — versão agnóstica com placeholders `<REPO_NAME>`, `<ORG>`, `<INSTALL_CMD>`, `<LINT_CMD>`, `<DOCKERFILE_PATH>`, `<COMPOSE_PATH>`, `<ENV_VARS>`, comentários condicionais para `PRISMA_MIGRATE` e `PROJECT_TYPE = frontend`, baseado no Contract 2

**Checkpoint**: CD Staging workflow validado e template agnóstico criado.

---

## Phase 5: User Story 3 - Deploy Automático em Produção (Priority: P1)

**Goal**: Validar que o workflow CD Production existente está em conformidade com Contract 3 e extrair template agnóstico.

**Independent Test**: Criar tag `v1.x.x` e verificar que o container atualizado está rodando no servidor de produção.

### Implementation for User Story 3

- [x] T009 [US3] Validar `.github/workflows/cd-production.yml` contra Contract 3 do workflow-contract.md: verificar trigger (`push tags` matching `v*`), 3 jobs encadeados, image tags com `${{ github.ref_name }}` e `:latest`, environment `production`, mesmas validações de .env/cleanup/prune que staging. Documentar desvios
- [x] T010 [US3] Criar `specs/017-agnostic-cicd-pipeline/templates/workflows/cd-production.yml.template` — versão agnóstica com mesmos placeholders do staging + tags de versão e latest, baseado no Contract 3

**Checkpoint**: CD Production workflow validado e template agnóstico criado.

---

## Phase 6: User Story 1 - Adoção do Pipeline em Novo Repositório (Priority: P1) 🎯 MVP

**Goal**: Consolidar todos os templates e documentação para que um novo repositório possa adotar o pipeline em menos de 1 hora.

**Independent Test**: Verificar que o quickstart cobre todos os passos, que o project-config template tem todos os campos, que os workflow templates são parametrizáveis, e que o checklist pré-deploy cobre os 10 erros mais comuns.

### Implementation for User Story 1

- [x] T011 [US1] Criar `specs/017-agnostic-cicd-pipeline/templates/compose/docker-compose-api.yml.template` — template de compose para APIs conforme Contract 4 (image GHCR, env_file, VIRTUAL_HOST, VIRTUAL_PORT, rede externa, sem ports)
- [x] T012 [P] [US1] Criar `specs/017-agnostic-cicd-pipeline/templates/compose/docker-compose-frontend.yml.template` — template de compose para frontends conforme Contract 5 (sem env_file, sem VIRTUAL_PORT, com healthcheck)
- [x] T013 [P] [US1] Validar `infra/docker-compose.yml` contra Contract 4: verificar image GHCR com `${IMAGE_TAG:-staging}`, sem `ports:`, `VIRTUAL_HOST`, `VIRTUAL_PORT=${API_PORT}`, `LETSENCRYPT_HOST`, rede externa com `${NGINX_NETWORK_NAME}`, `restart: unless-stopped`. Documentar desvios
- [x] T014 [P] [US1] Validar `infra/.env.example` contra `src/env.ts`: verificar que todas as variáveis do Zod schema (API_PORT, DATABASE_URL, HOST_API, NODE_ENV, DSR_WEB_URL, API_DSR, JWT_SECRET) estão documentadas, mais variáveis de CI/CD (IMAGE_TAG, NGINX_NETWORK_NAME, VIRTUAL_HOST). Documentar desvios
- [x] T015 [P] [US1] Validar `Dockerfile` para compatibilidade CI/CD: verificar multi-stage build, sem `COPY .env`, sem `COPY node_modules`, `npm ci` no builder, copy apenas dist/prisma/package.json para runtime, non-root user, `CMD ["node", "dist/server.js"]`. Documentar desvios
- [x] T016 [US1] Revisar `specs/017-agnostic-cicd-pipeline/quickstart.md` para garantir que o checklist pré-deploy cobre os 10 erros do Lessons Learned (DNS, rede proxy, .env vs schema, URLs sem protocolo, VIRTUAL_PORT, port mapping, auth registry, lint local, service container images, VITE_* build-time) e que os steps de adoção estão claros e completos

**Checkpoint**: Todos os templates e documentação de adoção prontos. Um novo repositório pode seguir o quickstart para adotar o pipeline.

---

## Phase 7: User Story 5 - Configuração Segura de Credenciais e Imagens (Priority: P2)

**Goal**: Validar que a configuração de segurança está em conformidade com os contracts e spec.

**Independent Test**: Verificar que .env é limpo após deploy, que não há secrets no código, e que as imagens estão privadas.

### Implementation for User Story 5

- [x] T017 [US5] Validar que TODOS os workflows CD (`cd-staging.yml`, `cd-production.yml`) possuem step de cleanup `.env` com `if: always()`, que nenhum secret é logado (sem `echo` de secrets), e que `permissions: packages: write, contents: read` está definido
- [x] T018 [P] [US5] Verificar que o repositório `estimates_api` e suas imagens no GHCR estão configurados como privados. Documentar procedimento de verificação em `specs/017-agnostic-cicd-pipeline/quickstart.md` se não estiver

**Checkpoint**: Configuração de segurança validada.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Correções de desvios encontrados, documentação final e validação

- [x] T019 Aplicar correções em artefatos existentes para desvios documentados nas validações (T005, T007, T009, T013, T014, T015, T017). Se nenhum desvio encontrado, marcar como N/A
- [x] T020 [P] Criar `specs/017-agnostic-cicd-pipeline/templates/README.md` com índice dos templates, instruções de uso, e link para quickstart.md
- [x] T021 [P] Atualizar `CLAUDE.md` seção "Active Technologies" com informações finais do template CI/CD v1.0.0
- [x] T022 Executar validação completa seguindo `specs/017-agnostic-cicd-pipeline/quickstart.md` checklist pré-deploy para `estimates_api`: verificar DNS, rede proxy, .env vs env.ts, URLs com protocolo, VIRTUAL_PORT, sem port mapping, runner no grupo docker, lint local

---

## Phase 9: Setup — Infraestrutura CI/CD no LouvorFlow (Monorepo)

**Purpose**: Criar a estrutura de diretórios e artefatos base para CI/CD no monorepo LouvorFlow, seguindo o padrão multi-config (Contract 8).

- [x] T023 Criar `specs/017-agnostic-cicd-pipeline/project-config-backend.md` — instância do project-config-template.md para `packages/backend/` com valores: `REPO_NAME=LouvorFlow`, `NODE_VERSION=22`, `PACKAGE_MANAGER=yarn`, `INSTALL_CMD=yarn install --frozen-lockfile`, `LINTER=typescript`, `LINT_CMD=yarn workspace backend run typecheck`, `TEST_FRAMEWORK=vitest`, `TEST_CMD=yarn workspace backend run test`, `DB_TYPE=postgresql`, `DB_SERVICE_IMAGE=postgres:17`, `HAS_PRISMA=true`, `PRISMA_MIGRATE=true`, `COMPOSE_PATH=infra/backend`, `DOCKERFILE_PATH=packages/backend/Dockerfile`, `CONTAINER_NAME=louvorflow-api`, `APP_PORT=3000`, `PROJECT_TYPE=api`, `TEMPLATE_VERSION=1.2.0`, `PATHS_FILTER=packages/backend/**`, `WORKING_DIR=.` (raiz — yarn workspaces instala na raiz), `ENV_VARS=HOST,PORT,DB_URL,APP_SECRET,ACCESS_TOKEN_EXPIRES_IN,APP_SECRET_REFRESH_TOKEN,REFRESH_TOKEN_EXPIRES_IN,REFRESH_TOKEN_EXPIRES_DAYS,APP_API_URL,APP_WEB_URL,NODE_ENV,ADMIN_EMAIL,ADMIN_PASSWORD,ADMIN_NAME,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS`
- [x] T024 [P] Criar `specs/017-agnostic-cicd-pipeline/project-config-frontend.md` — instância do project-config-template.md para `packages/frontend/` com valores: `REPO_NAME=LouvorFlow`, `NODE_VERSION=22`, `PACKAGE_MANAGER=yarn`, `INSTALL_CMD=yarn install --frozen-lockfile`, `LINTER=eslint`, `LINT_CMD=yarn workspace vite_react_shadcn_ts run lint`, `TEST_FRAMEWORK=vitest`, `TEST_CMD=yarn workspace vite_react_shadcn_ts run test`, `DB_TYPE=none`, `DB_SERVICE_IMAGE=(none)`, `HAS_PRISMA=false`, `PRISMA_MIGRATE=false`, `COMPOSE_PATH=infra/frontend`, `DOCKERFILE_PATH=packages/frontend/Dockerfile`, `CONTAINER_NAME=louvorflow-web`, `APP_PORT=80`, `PROJECT_TYPE=frontend`, `TEMPLATE_VERSION=1.2.0`, `PATHS_FILTER=packages/frontend/**`, `WORKING_DIR=.` (raiz — yarn workspaces instala na raiz), `ENV_VARS=VITE_API_BASE_URL`

**Checkpoint**: Project configs preenchidos e validados para ambos os packages.

---

## Phase 10: Foundational — Dockerfiles (Bloqueante)

**Purpose**: Criar Dockerfiles multi-stage para ambos os packages. Pré-requisito para todos os workflows.

**⚠️ CRITICAL**: Sem Dockerfiles, nenhum workflow de build/deploy funciona.

- [x] T025 Criar `packages/backend/Dockerfile` — multi-stage build para yarn workspaces: (1) builder: `node:22-alpine`, `WORKDIR /app`, copiar `package.json` + `yarn.lock` da raiz + `packages/backend/package.json`, `yarn install --frozen-lockfile`, copiar `packages/backend/prisma/`, `yarn workspace backend run prisma generate` (ou `npx prisma generate`), copiar `packages/backend/` sources, `yarn workspace backend run build`; (2) runtime: `node:22-alpine`, copiar `packages/backend/dist/`, `packages/backend/prisma/`, `node_modules/` do builder, non-root user, `EXPOSE 3000`, `CMD ["node", "packages/backend/dist/index.js"]`. Nota: o Dockerfile fica em `packages/backend/` mas o contexto de build deve ser a raiz do repo (`context: .`) para acessar `yarn.lock`
- [x] T026 [P] Criar `packages/frontend/Dockerfile` — multi-stage build para yarn workspaces: (1) builder: `node:22-alpine`, `WORKDIR /app`, copiar `package.json` + `yarn.lock` da raiz + `packages/frontend/package.json`, `yarn install --frozen-lockfile`, aceitar build-args `VITE_API_BASE_URL`, copiar `packages/frontend/` sources, `yarn workspace vite_react_shadcn_ts run build`; (2) runtime: `nginx:alpine`, copiar `packages/frontend/dist/` para `/usr/share/nginx/html/`, copiar nginx.conf customizado, `EXPOSE 80`, healthcheck via `wget -qO- http://localhost:80/index.html`. Nota: mesmo padrão — contexto de build na raiz do repo
- [x] T027 [P] Criar `packages/frontend/nginx.conf` — configuração nginx para SPA: `try_files $uri $uri/ /index.html` (fallback para client-side routing), gzip habilitado, cache de assets estáticos

**Checkpoint**: Ambos os Dockerfiles funcionais. Validar com `docker build` local.

---

## Phase 11: Compose Files

**Purpose**: Criar docker-compose files de deploy para cada package, conforme Contracts 4 e 5.

- [x] T028 Criar diretório `infra/backend/` e `infra/backend/docker-compose.yml` — conforme Contract 4 (API): image `ghcr.io/j0ruge/louvorflow-api:${IMAGE_TAG:-staging}`, `container_name: louvorflow-api`, `env_file: .env`, `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, `VIRTUAL_PORT=3000`, rede externa `${NGINX_NETWORK_NAME}`, `restart: unless-stopped`, sem `ports:`
- [x] T029 [P] Criar diretório `infra/frontend/` e `infra/frontend/docker-compose.yml` — conforme Contract 5 (Frontend): image `ghcr.io/j0ruge/louvorflow-web:${IMAGE_TAG:-staging}`, `container_name: louvorflow-web`, `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, sem `env_file`, sem `VIRTUAL_PORT` (nginx=80), healthcheck wget, rede externa, `restart: unless-stopped`, sem `ports:`

**Checkpoint**: Compose files conformes com Contracts 4 e 5.

---

## Phase 12: Workflows — CI (User Story 4)

**Purpose**: Instanciar workflows de CI a partir do ci.yml.template para ambos os packages.

**Goal**: PRs disparam lint + testes automaticamente, com path filters para isolamento de packages.

**Independent Test**: Abrir PR com alteração em `packages/backend/` e verificar que apenas o CI do backend dispara.

- [x] T030 [US4] Criar `.github/workflows/ci-backend.yml` — instanciar ci.yml.template com: `NODE_VERSION=22`, `PACKAGE_MANAGER=yarn`, `INSTALL_CMD=yarn install --frozen-lockfile` (na raiz do repo), `LINT_CMD=yarn workspace backend run typecheck`, descomentar job `test` com `TEST_CMD=yarn workspace backend run test`, descomentar `paths:` com `packages/backend/**` e `.github/workflows/ci-backend.yml`, adicionar service container `postgres:17` no job test com health check e `DB_URL` env. Nota: install na raiz, lint/test via `yarn workspace`
- [x] T031 [P] [US4] Criar `.github/workflows/ci-frontend.yml` — instanciar ci.yml.template com: `NODE_VERSION=22`, `PACKAGE_MANAGER=yarn`, `INSTALL_CMD=yarn install --frozen-lockfile` (na raiz do repo), `LINT_CMD=yarn workspace vite_react_shadcn_ts run lint`, descomentar job `test` com `TEST_CMD=yarn workspace vite_react_shadcn_ts run test`, descomentar `paths:` com `packages/frontend/**` e `.github/workflows/ci-frontend.yml`, sem service container (DB_TYPE=none). Nota: install na raiz, lint/test via `yarn workspace`

**Checkpoint**: PRs contra develop/main disparam CI do package correto.

---

## Phase 13: Workflows — CD Staging (User Story 2)

**Purpose**: Instanciar workflows de CD Staging para deploy automático ao mergear na develop.

**Goal**: Push na develop dispara build + deploy em staging, isolado por package via path filters.

**Independent Test**: Fazer push na develop com alteração no backend e verificar que apenas o container do backend é atualizado no servidor de staging.

- [x] T032 [US2] Criar `.github/workflows/cd-staging-backend.yml` — instanciar cd-staging.yml.template com: placeholders do project-config-backend (yarn), descomentar `paths:` com `packages/backend/**`, `context: .` (raiz — yarn workspaces) e `file: packages/backend/Dockerfile` no build step, `working-directory: infra/backend` no deploy, `INSTALL_CMD=yarn install --frozen-lockfile`, `ENV_VARS_BLOCK` com: `HOST,PORT,DB_URL,APP_SECRET,ACCESS_TOKEN_EXPIRES_IN,APP_SECRET_REFRESH_TOKEN,REFRESH_TOKEN_EXPIRES_IN,REFRESH_TOKEN_EXPIRES_DAYS,APP_API_URL,APP_WEB_URL,NODE_ENV,ADMIN_EMAIL,ADMIN_PASSWORD,ADMIN_NAME,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS`, `PRISMA_MIGRATE=true` (descomentar step de migration com `DB_URL`), concurrency group `deploy-staging-louvorflow-backend`
- [x] T033 [P] [US2] Criar `.github/workflows/cd-staging-frontend.yml` — instanciar cd-staging.yml.template com: placeholders do project-config-frontend (yarn), descomentar `paths:` com `packages/frontend/**`, `context: .` (raiz — yarn workspaces) e `file: packages/frontend/Dockerfile` no build step, adicionar `build-args: VITE_API_BASE_URL=${{ secrets.VITE_API_BASE_URL }}` (PROJECT_TYPE=frontend), `working-directory: infra/frontend` no deploy, `INSTALL_CMD=yarn install --frozen-lockfile`, `ENV_VARS_BLOCK` apenas proxy vars, concurrency group `deploy-staging-louvorflow-frontend`

**Checkpoint**: Deploy automático em staging funcional para ambos os packages.

---

## Phase 14: Workflows — CD Production (User Story 3)

**Purpose**: Instanciar workflows de CD Production para deploy via tags prefixadas por package.

**Goal**: Tag `backend-v*` dispara deploy do backend em produção; `frontend-v*` dispara deploy do frontend.

**Independent Test**: Criar tag `backend-v1.0.0` e verificar deploy isolado do backend em produção.

- [x] T034 [US3] Criar `.github/workflows/cd-production-backend.yml` — instanciar cd-production.yml.template com: trigger `tags: ['backend-v*']`, mesmos placeholders de staging-backend (yarn, `context: .`), image tags `ghcr.io/j0ruge/louvorflow-api:${{ github.ref_name }}` + `:latest`, environment `production`, concurrency group `deploy-production-louvorflow-backend`
- [x] T035 [P] [US3] Criar `.github/workflows/cd-production-frontend.yml` — instanciar cd-production.yml.template com: trigger `tags: ['frontend-v*']`, mesmos placeholders de staging-frontend (yarn, `context: .`), build-args para VITE_*, image tags `ghcr.io/j0ruge/louvorflow-web:${{ github.ref_name }}` + `:latest`, environment `production`, concurrency group `deploy-production-louvorflow-frontend`

**Checkpoint**: Deploy automático em produção funcional via tags prefixadas.

---

## Phase 15: Segurança & Validação (User Story 5)

**Purpose**: Validar conformidade de segurança e executar checklist pré-deploy para o LouvorFlow.

- [x] T036 [US5] Validar que todos os 6 workflows criados (T030-T035) possuem: `permissions: packages: write, contents: read`, cleanup `.env` com `if: always()`, sem `echo` de secrets, `docker/login-action@v3` no job deploy
- [x] T037 [P] [US5] Criar `.env.example` em `infra/backend/` e `infra/frontend/` com lista de variáveis esperadas para referência (sem valores reais), documentando quais são secrets de environment no GitHub
- [x] T038 [US5] Executar checklist pré-deploy do quickstart.md para o LouvorFlow: verificar DNS (quando configurado), rede proxy, .env vs env validation, URLs com protocolo, VIRTUAL_PORT, sem port mapping, lint local (`yarn workspace backend run typecheck`, `yarn workspace vite_react_shadcn_ts run lint`), testes locais (`yarn workspace backend run test`, `yarn workspace vite_react_shadcn_ts run test`)

**Checkpoint**: Configuração de segurança validada para o monorepo.

---

## Phase 16: Polish & Documentação Final

**Purpose**: Atualização de documentação e validação cruzada.

- [x] T039 Atualizar `infra/README.md` com instruções para os novos compose files de deploy (backend e frontend), diferenciando do compose de desenvolvimento (postgres)
- [x] T040 [P] Verificar que `CHANGELOG.md` da spec reflete todas as adições feitas na implementação. Se necessário, adicionar entry v1.2.1 com ajustes encontrados durante implementação
- [x] T041 Validação cruzada final: verificar que os 6 workflows instanciados estão conformes com os Contracts 1-5 e 8 do workflow-contract.md, que os project-configs estão completos, e que os Dockerfiles são buildáveis localmente com `docker build`

**Checkpoint**: Implementação completa. LouvorFlow tem CI/CD funcional para ambos os packages.

---

## Dependencies & Execution Order

### Phase Dependencies (Template — Phases 1-8, COMPLETAS)

- **Setup (Phase 1)**: ✅ Completa
- **Foundational (Phase 2)**: ✅ Completa
- **US4 - CI (Phase 3)**: ✅ Completa
- **US2 - CD Staging (Phase 4)**: ✅ Completa
- **US3 - CD Production (Phase 5)**: ✅ Completa
- **US1 - Adoção (Phase 6)**: ✅ Completa
- **US5 - Segurança (Phase 7)**: ✅ Completa
- **Polish (Phase 8)**: ✅ Completa

### Phase Dependencies (LouvorFlow — Phases 9-16, PENDENTES)

- **Setup LouvorFlow (Phase 9)**: Depends on Phase 8 (templates completos) — pode começar imediatamente
- **Dockerfiles (Phase 10)**: Depends on Phase 9 (project-configs definem paths) — BLOQUEANTE
- **Compose Files (Phase 11)**: Depends on Phase 10 (imagens referenciadas no compose) — pode rodar em paralelo com Phase 12
- **CI Workflows (Phase 12)**: Depends on Phase 10 (Dockerfiles necessários para build) — pode rodar em paralelo com Phase 11
- **CD Staging (Phase 13)**: Depends on Phases 10, 11, 12 (precisa de Dockerfiles, compose e CI validado)
- **CD Production (Phase 14)**: Depends on Phase 13 (mesma estrutura, triggers diferentes)
- **Segurança (Phase 15)**: Depends on Phases 12, 13, 14 (valida todos os workflows)
- **Polish (Phase 16)**: Depends on all previous phases

### Parallel Opportunities (LouvorFlow)

- T023 e T024 podem rodar em paralelo (project-configs — arquivos independentes)
- T025, T026, T027 podem rodar em paralelo (Dockerfiles + nginx.conf — arquivos independentes)
- T028 e T029 podem rodar em paralelo (compose files — diretórios separados)
- T030 e T031 podem rodar em paralelo (CI workflows — arquivos independentes)
- T032 e T033 podem rodar em paralelo (CD staging workflows — arquivos independentes)
- T034 e T035 podem rodar em paralelo (CD production workflows — arquivos independentes)
- T036 e T037 podem rodar em paralelo (validação + .env.example — escopo diferente)
- T039 e T040 podem rodar em paralelo (documentação — arquivos independentes)

---

## Parallel Example: Phases 12 + 13

```bash
# Launch CI workflows in parallel (independent files):
Task: "T030 Criar .github/workflows/ci-backend.yml"
Task: "T031 Criar .github/workflows/ci-frontend.yml"

# After CI, launch CD Staging in parallel:
Task: "T032 Criar .github/workflows/cd-staging-backend.yml"
Task: "T033 Criar .github/workflows/cd-staging-frontend.yml"
```

---

## Implementation Strategy

### Fases 1-8: Template (COMPLETAS ✅)

Todas as 22 tasks de extração de templates do estimates_api estão concluídas.

### Fases 9-16: LouvorFlow (PENDENTES)

#### MVP First (CI funcional — Phases 9-12)

1. Complete Phase 9: Project Configs (T023-T024)
2. Complete Phase 10: Dockerfiles (T025-T027) — **BLOQUEANTE**
3. Complete Phases 11+12 em paralelo: Compose files + CI workflows (T028-T031)
4. **STOP and VALIDATE**: Abrir PR e verificar que CI dispara corretamente para cada package

#### Full Pipeline (Phases 13-16)

5. Complete Phase 13: CD Staging (T032-T033) — deploy automático em staging
6. Complete Phase 14: CD Production (T034-T035) — deploy via tags
7. Complete Phase 15: Segurança (T036-T038) — validação completa
8. Complete Phase 16: Polish (T039-T041) — documentação e validação final

### Single Developer Strategy

Execução sequencial: Phase 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

Com paralelismo dentro de cada fase (backend + frontend em paralelo).

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Phases 1-8: Extração de templates — completas, não alteram `src/`
- Phases 9-16: Implementação no LouvorFlow — criam artefatos de infra (Dockerfiles, workflows, compose)
- `<ORG>` = `j0ruge` (GitHub org) — já resolvido nas tasks T028-T035
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
