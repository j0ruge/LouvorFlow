# Data Model: Pipeline CI/CD Agnóstico para Organização

**Date**: 2026-03-18 | **Feature**: `002-agnostic-cicd-pipeline`

> Esta feature é de infraestrutura CI/CD e documentação. O "data model" descreve as entidades de configuração e seus relacionamentos, não entidades de banco de dados.

---

## Entities

### 1. Template (Pipeline Template)

Conjunto versionado de artefatos reutilizáveis que define o padrão CI/CD da organização.

| Field | Type | Description |
|-------|------|-------------|
| `version` | semver | Versão do template (MAJOR.MINOR.PATCH) |
| `changelog` | markdown | Histórico de mudanças entre versões |
| `workflow_templates` | files | Modelos de ci.yml, cd-staging.yml, cd-production.yml |
| `compose_templates` | files | Modelos de docker-compose.yml (API e frontend) |
| `quickstart` | markdown | Guia de adoção com checklist pré-deploy |
| `project_config_schema` | markdown | Schema de configuração por projeto |

### 2. Project Config (por repositório)

Arquivo de configuração que parametriza o template para um repositório específico.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `REPO_NAME` | string | Yes | Nome do repositório |
| `PACKAGE_MANAGER` | enum | Yes | `yarn` \| `npm` |
| `INSTALL_CMD` | string | Yes | Comando de instalação com lockfile |
| `LINTER` | string | Yes | Ferramenta de lint |
| `LINT_CMD` | string | Yes | Comando de lint (sem auto-fix) |
| `TEST_FRAMEWORK` | enum | Yes | `jest` \| `vitest` \| `none` |
| `TEST_CMD` | string | Conditional | Comando de teste |
| `DB_TYPE` | enum | Yes | `postgresql` \| `mssql` \| `none` |
| `DB_SERVICE_IMAGE` | string | Conditional | Imagem Docker para CI |
| `HAS_PRISMA` | boolean | Yes | Se utiliza Prisma |
| `PRISMA_MIGRATE` | boolean | Conditional | Se executa migrations no deploy |
| `COMPOSE_PATH` | path | Yes | Caminho do docker-compose |
| `DOCKERFILE_PATH` | path | Yes | Caminho do Dockerfile |
| `CONTAINER_NAME` | string | Yes | Nome do container Docker |
| `APP_PORT` | number | Yes | Porta da aplicação |
| `ENV_VARS` | list | Yes | Variáveis validadas pela app |
| `PROJECT_TYPE` | enum | Yes | `api` \| `frontend` |
| `TEMPLATE_VERSION` | semver | Yes | Versão do template adotada |
| `PATHS_FILTER` | list | No | Filtro de caminhos para trigger CI/CD (monorepo). Ex: `packages/backend/**` |
| `WORKING_DIR` | path | No | Diretório de trabalho do package (monorepo). Default: `.` |

### 3. Workflow (CI/CD Pipeline)

Arquivo declarativo que define o pipeline automatizado.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Nome do workflow (CI, CD Staging, CD Production) |
| `trigger` | event | Evento que dispara (push, pull_request, tags) |
| `concurrency` | group | Grupo de concorrência + cancel policy |
| `permissions` | object | Permissões (packages: write, contents: read) |
| `jobs` | object | Jobs encadeados (ci → build → deploy) |

**Instâncias**:

- `ci.yml` → trigger: `pull_request` em `develop`/`main`
- `cd-staging.yml` → trigger: `push` em `develop`
- `cd-production.yml` → trigger: `push tags` matching `v*`

### 4. Environment (Ambiente de Deploy)

Contexto de deployment com secrets e proteções.

| Field | Type | Description |
|-------|------|-------------|
| `name` | enum | `staging` \| `production` |
| `server` | string | Servidor alvo |
| `domain` | string | Domínio base |
| `runner_label` | string | Label do self-hosted runner |
| `secrets` | key-value | Variáveis de ambiente específicas |
| `image_tag` | string | Tag da imagem (`:staging`, `:v1.x.x`, `:latest`) |

### 5. Docker Compose Service

Definição declarativa do container de cada aplicação.

| Field | Type | Description |
|-------|------|-------------|
| `image` | string | `ghcr.io/<org>/<repo>:<tag>` |
| `container_name` | string | Nome único do container |
| `env_file` | string | Caminho para .env (API only) |
| `VIRTUAL_HOST` | string | Subdomínio para proxy routing |
| `VIRTUAL_PORT` | string | Porta do container (obrigatório se ≠ 80, API only) |
| `LETSENCRYPT_HOST` | string | Domínio para auto-SSL |
| `networks` | list | Rede externa do proxy reverso |
| `restart` | string | `unless-stopped` |

### 6. Self-Hosted Runner

Agente instalado no servidor local que executa jobs de deploy.

| Field | Type | Description |
|-------|------|-------------|
| `server` | string | IP/hostname do servidor |
| `labels` | list | `[self-hosted, linux, <environment>]` |
| `service_name` | string | Nome do systemd service |
| `install_dir` | path | Diretório de instalação |

---

## Relationships

**Nota (Monorepo)**: Em monorepos, um único repositório pode ter múltiplos Project Configs — um por package. Cada Project Config instancia seus próprios workflows e compose files, nomeados por package (ex: `ci-backend.yml`, `docker-compose-backend.yml`). Os campos `PATHS_FILTER` e `WORKING_DIR` garantem isolamento de triggers e contexto de build.

```text
Template ──versioned──> Project Config (TEMPLATE_VERSION)
    │                        │
    │ (workflow templates)    │ (parametrizes)
    │                        │
    └──instantiates──> Workflow ──triggers──> Environment
                          │                      │
                          │ (CI jobs)             │ (secrets, runner label)
                          │                      │
                          ├──needs──> Build ──pushes──> Docker Image (Registry)
                          │                                │
                          └──needs──> Deploy ──pulls──> Docker Compose Service
                                         │                      │
                                         │ (runs migration)      │ (VIRTUAL_HOST)
                                         │                      │
                                         └──on──> Self-Hosted Runner
```

---

## State Transitions

### Pipeline Execution

```text
Triggered → CI Running → CI Passed → Build Running → Build Pushed → Deploy Running → Deploy Complete
                │                          │                              │
                └→ CI Failed (STOP)        └→ Build Failed (STOP)        └→ Deploy Failed (ALERT)
```

### Template Adoption Lifecycle

```text
New Repo → Fill Project Config → Adapt Workflows → Configure Secrets → Validate Pre-Deploy Checklist → First Deploy
                                                                                                            │
                                                                                                    Template Update Available
                                                                                                            │
                                                                                         Check Changelog → Apply Changes → Update TEMPLATE_VERSION
```

---

## Conditional Rules (from Project Config)

| Condition | Effect on Workflow | Effect on Compose |
|-----------|-------------------|-------------------|
| `TEST_FRAMEWORK = none` | Omit test job in CI, omit test step in CD | — |
| `PRISMA_MIGRATE = false` | Omit migration step in deploy | — |
| `DB_SERVICE_IMAGE = (none)` | Omit services in CI test job | — |
| `PROJECT_TYPE = frontend` | Build-args for VITE_*, environment on build job | No `env_file`, no `VIRTUAL_PORT`, add healthcheck |
| `APP_PORT ≠ 80` | — | Add `VIRTUAL_PORT: ${APP_PORT}` |
