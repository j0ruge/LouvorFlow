# Tasks: Pipeline CI/CD Agnóstico para Organização

**Input**: Design documents from `/specs/002-agnostic-cicd-pipeline/`
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

- [x] T001 Criar `specs/002-agnostic-cicd-pipeline/templates/` com subdiretórios `workflows/` e `compose/` para os templates agnósticos
- [x] T002 [P] Criar `specs/002-agnostic-cicd-pipeline/CHANGELOG.md` com entry v1.0.0 (baseline) conforme Contract 7 do workflow-contract.md

**Checkpoint**: Estrutura de templates pronta para receber os artefatos.

---

## Phase 2: Foundational (Project Config Schema)

**Purpose**: Definir o schema do project-config com TEMPLATE_VERSION e criar a instância para estimates_api

**⚠️ CRITICAL**: O project-config é o artefato central que parametriza todo o template

- [x] T003 Criar `specs/002-agnostic-cicd-pipeline/templates/project-config-template.md` com todos os campos do schema R-010 (incluindo `TEMPLATE_VERSION`), regras condicionais, e instruções de preenchimento, baseado no schema definido em research.md R-010 e data-model.md Entity 2
- [x] T004 Criar `specs/002-agnostic-cicd-pipeline/project-config.md` como instância preenchida para `estimates_api` (valores do 001 project-config + campo `TEMPLATE_VERSION: 1.0.0`), validando que todos os campos correspondem ao estado atual do repositório (package.json, src/env.ts, Dockerfile, infra/docker-compose.yml)

**Checkpoint**: Schema do project-config definido e instância para estimates_api preenchida.

---

## Phase 3: User Story 4 - Pipeline de CI em PRs (Priority: P2)

**Goal**: Validar que o workflow CI existente está em conformidade com Contract 1 e extrair template agnóstico.

**Independent Test**: Abrir PR contra `develop` ou `main` com erro de lint e verificar que o pipeline reporta a falha.

### Implementation for User Story 4

- [x] T005 [US4] Validar `.github/workflows/ci.yml` contra Contract 1 do workflow-contract.md: verificar trigger (`pull_request` em `develop`/`main`), job `lint` (checkout, setup-node, `npm ci`, `npx biome check .`), ausência de job `test` (pois `TEST_FRAMEWORK = none`), concurrency group com `cancel-in-progress: true`. Documentar desvios encontrados
- [x] T006 [US4] Criar `specs/002-agnostic-cicd-pipeline/templates/workflows/ci.yml.template` — versão agnóstica do ci.yml com placeholders `<INSTALL_CMD>`, `<LINT_CMD>`, `<TEST_CMD>`, comentários condicionais para `TEST_FRAMEWORK = none` e `DB_SERVICE_IMAGE`, baseado no Contract 1

**Checkpoint**: CI workflow validado e template agnóstico criado.

---

## Phase 4: User Story 2 - Deploy Automático em Staging (Priority: P1)

**Goal**: Validar que o workflow CD Staging existente está em conformidade com Contract 2 e extrair template agnóstico.

**Independent Test**: Fazer push na branch `develop` e verificar que o container atualizado está rodando no servidor de staging.

### Implementation for User Story 2

- [x] T007 [US2] Validar `.github/workflows/cd-staging.yml` contra Contract 2 do workflow-contract.md: verificar trigger (`push` em `develop`), 3 jobs encadeados (ci → build-and-push → deploy), permissions (`packages: write`), concurrency (`cancel-in-progress: false`), environment `staging`, Generate .env com TODAS as variáveis de `src/env.ts` + `IMAGE_TAG` + `NGINX_NETWORK_NAME` + `VIRTUAL_HOST`, cleanup `.env` com `if: always()`, `docker image prune -f`. Documentar desvios
- [x] T008 [US2] Criar `specs/002-agnostic-cicd-pipeline/templates/workflows/cd-staging.yml.template` — versão agnóstica com placeholders `<REPO_NAME>`, `<ORG>`, `<INSTALL_CMD>`, `<LINT_CMD>`, `<DOCKERFILE_PATH>`, `<COMPOSE_PATH>`, `<ENV_VARS>`, comentários condicionais para `PRISMA_MIGRATE` e `PROJECT_TYPE = frontend`, baseado no Contract 2

**Checkpoint**: CD Staging workflow validado e template agnóstico criado.

---

## Phase 5: User Story 3 - Deploy Automático em Produção (Priority: P1)

**Goal**: Validar que o workflow CD Production existente está em conformidade com Contract 3 e extrair template agnóstico.

**Independent Test**: Criar tag `v1.x.x` e verificar que o container atualizado está rodando no servidor de produção.

### Implementation for User Story 3

- [x] T009 [US3] Validar `.github/workflows/cd-production.yml` contra Contract 3 do workflow-contract.md: verificar trigger (`push tags` matching `v*`), 3 jobs encadeados, image tags com `${{ github.ref_name }}` e `:latest`, environment `production`, mesmas validações de .env/cleanup/prune que staging. Documentar desvios
- [x] T010 [US3] Criar `specs/002-agnostic-cicd-pipeline/templates/workflows/cd-production.yml.template` — versão agnóstica com mesmos placeholders do staging + tags de versão e latest, baseado no Contract 3

**Checkpoint**: CD Production workflow validado e template agnóstico criado.

---

## Phase 6: User Story 1 - Adoção do Pipeline em Novo Repositório (Priority: P1) 🎯 MVP

**Goal**: Consolidar todos os templates e documentação para que um novo repositório possa adotar o pipeline em menos de 1 hora.

**Independent Test**: Verificar que o quickstart cobre todos os passos, que o project-config template tem todos os campos, que os workflow templates são parametrizáveis, e que o checklist pré-deploy cobre os 10 erros mais comuns.

### Implementation for User Story 1

- [x] T011 [US1] Criar `specs/002-agnostic-cicd-pipeline/templates/compose/docker-compose-api.yml.template` — template de compose para APIs conforme Contract 4 (image GHCR, env_file, VIRTUAL_HOST, VIRTUAL_PORT, rede externa, sem ports)
- [x] T012 [P] [US1] Criar `specs/002-agnostic-cicd-pipeline/templates/compose/docker-compose-frontend.yml.template` — template de compose para frontends conforme Contract 5 (sem env_file, sem VIRTUAL_PORT, com healthcheck)
- [x] T013 [P] [US1] Validar `infra/docker-compose.yml` contra Contract 4: verificar image GHCR com `${IMAGE_TAG:-staging}`, sem `ports:`, `VIRTUAL_HOST`, `VIRTUAL_PORT=${API_PORT}`, `LETSENCRYPT_HOST`, rede externa com `${NGINX_NETWORK_NAME}`, `restart: unless-stopped`. Documentar desvios
- [x] T014 [P] [US1] Validar `infra/.env.example` contra `src/env.ts`: verificar que todas as variáveis do Zod schema (API_PORT, DATABASE_URL, HOST_API, NODE_ENV, DSR_WEB_URL, API_DSR, JWT_SECRET) estão documentadas, mais variáveis de CI/CD (IMAGE_TAG, NGINX_NETWORK_NAME, VIRTUAL_HOST). Documentar desvios
- [x] T015 [P] [US1] Validar `Dockerfile` para compatibilidade CI/CD: verificar multi-stage build, sem `COPY .env`, sem `COPY node_modules`, `npm ci` no builder, copy apenas dist/prisma/package.json para runtime, non-root user, `CMD ["node", "dist/server.js"]`. Documentar desvios
- [x] T016 [US1] Revisar `specs/002-agnostic-cicd-pipeline/quickstart.md` para garantir que o checklist pré-deploy cobre os 10 erros do Lessons Learned (DNS, rede proxy, .env vs schema, URLs sem protocolo, VIRTUAL_PORT, port mapping, auth registry, lint local, service container images, VITE_* build-time) e que os steps de adoção estão claros e completos

**Checkpoint**: Todos os templates e documentação de adoção prontos. Um novo repositório pode seguir o quickstart para adotar o pipeline.

---

## Phase 7: User Story 5 - Configuração Segura de Credenciais e Imagens (Priority: P2)

**Goal**: Validar que a configuração de segurança está em conformidade com os contracts e spec.

**Independent Test**: Verificar que .env é limpo após deploy, que não há secrets no código, e que as imagens estão privadas.

### Implementation for User Story 5

- [x] T017 [US5] Validar que TODOS os workflows CD (`cd-staging.yml`, `cd-production.yml`) possuem step de cleanup `.env` com `if: always()`, que nenhum secret é logado (sem `echo` de secrets), e que `permissions: packages: write, contents: read` está definido
- [x] T018 [P] [US5] Verificar que o repositório `estimates_api` e suas imagens no GHCR estão configurados como privados. Documentar procedimento de verificação em `specs/002-agnostic-cicd-pipeline/quickstart.md` se não estiver

**Checkpoint**: Configuração de segurança validada.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Correções de desvios encontrados, documentação final e validação

- [x] T019 Aplicar correções em artefatos existentes para desvios documentados nas validações (T005, T007, T009, T013, T014, T015, T017). Se nenhum desvio encontrado, marcar como N/A
- [x] T020 [P] Criar `specs/002-agnostic-cicd-pipeline/templates/README.md` com índice dos templates, instruções de uso, e link para quickstart.md
- [x] T021 [P] Atualizar `CLAUDE.md` seção "Active Technologies" com informações finais do template CI/CD v1.0.0
- [x] T022 Executar validação completa seguindo `specs/002-agnostic-cicd-pipeline/quickstart.md` checklist pré-deploy para `estimates_api`: verificar DNS, rede proxy, .env vs env.ts, URLs com protocolo, VIRTUAL_PORT, sem port mapping, runner no grupo docker, lint local

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — project-config schema needed before validation
- **US4 - CI (Phase 3)**: Depends on Phase 2 — pode rodar em paralelo com Phases 4, 5
- **US2 - CD Staging (Phase 4)**: Depends on Phase 2 — pode rodar em paralelo com Phases 3, 5
- **US3 - CD Production (Phase 5)**: Depends on Phase 2 — pode rodar em paralelo com Phases 3, 4
- **US1 - Adoção (Phase 6)**: Depends on Phases 3, 4, 5 (precisa dos workflow templates criados)
- **US5 - Segurança (Phase 7)**: Depends on Phase 4 e 5 (valida workflows CD)
- **Polish (Phase 8)**: Depends on all previous phases

### User Story Dependencies

- **US4 (P2)**: Foundational only — independente dos demais
- **US2 (P1)**: Foundational only — independente dos demais
- **US3 (P1)**: Foundational only — independente dos demais
- **US1 (P1)**: Depends on US4, US2, US3 (precisa dos templates de workflow)
- **US5 (P2)**: Depends on US2, US3 (valida workflows CD)

### Within Each User Story

- Validação antes de criação de template
- Template antes de documentação

### Parallel Opportunities

- T001 e T002 podem rodar em paralelo (Setup)
- T005/T006 (US4), T007/T008 (US2), T009/T010 (US3) podem rodar em paralelo entre stories (diferentes arquivos)
- T011 e T012 podem rodar em paralelo (compose templates — diferentes arquivos)
- T013, T014, T015 podem rodar em paralelo (validações de arquivos independentes — agora marcados [P])
- T017 e T018 podem rodar em paralelo (Security)
- T020 e T021 podem rodar em paralelo (Polish)

---

## Parallel Example: Phases 3 + 4 + 5

```bash
# Launch US4, US2, US3 validation in parallel (independent workflows):
Task: "T005 [US4] Validar .github/workflows/ci.yml contra Contract 1"
Task: "T007 [US2] Validar .github/workflows/cd-staging.yml contra Contract 2"
Task: "T009 [US3] Validar .github/workflows/cd-production.yml contra Contract 3"

# After validation, launch template creation in parallel:
Task: "T006 [US4] Criar ci.yml.template"
Task: "T008 [US2] Criar cd-staging.yml.template"
Task: "T010 [US3] Criar cd-production.yml.template"
```

---

## Implementation Strategy

### MVP First (US4 + US2 + US3 + US1)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phases 3-5 in parallel: Validate + create workflow templates (T005-T010)
4. Complete Phase 6: US1 — compose templates + validações + quickstart review (T011-T016)
5. **STOP and VALIDATE**: Verificar que todos os templates estão completos e o quickstart é seguível
6. Complete Phase 7: US5 — Security validation (T017-T018)
7. Complete Phase 8: Polish (T019-T022)

### Incremental Delivery

1. Setup + Foundational → Project-config schema e changelog prontos
2. US4 + US2 + US3 → Workflow templates criados e validados
3. US1 → Template system completo (MVP!)
4. US5 → Segurança validada
5. Polish → Correções, documentação final, validação completa

### Single Developer Strategy

Execução sequencial recomendada: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8

Com as Phases 3-5 podendo ser feitas em paralelo se desejado.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Esta feature é de validação + extração de templates — não altera código-fonte em `src/`
- Desvios encontrados nas validações são documentados e corrigidos em T019 (Polish)
- Se nenhum desvio for encontrado, T019 é marcado como N/A
- Os artefatos do plan (quickstart.md, contracts, data-model.md) já existem e servem como referência
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
