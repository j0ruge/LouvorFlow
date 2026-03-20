# Workflow Contracts: Pipeline CI/CD Agnóstico

**Date**: 2026-03-20 | **Feature**: `017-agnostic-cicd-pipeline` | **Template Version**: 1.2.0

> Define a estrutura esperada dos workflows e docker-compose files. Usa placeholders `<PLACEHOLDER>` que são substituídos pelos valores do `project-config.md` de cada repositório.

---

## Contract 1: CI Workflow (`ci.yml`)

**Trigger**: `pull_request` em branches `develop` e `main`
**Runner**: GitHub-hosted (`ubuntu-latest`)

### Jobs

| Job | Steps | Runs-on | Depends on |
|-----|-------|---------|------------|
| `lint` | checkout, setup-node, `<INSTALL_CMD>`, `<LINT_CMD>` | ubuntu-latest | — |
| `test` | checkout, setup-node, `<INSTALL_CMD>`, [service container se `DB_SERVICE_IMAGE`], [prisma generate se `HAS_PRISMA`], `<TEST_CMD>` | ubuntu-latest | — |

> **Regra:** Se `TEST_FRAMEWORK = none` → omitir job `test` inteiramente.
> **Regra:** Se `DB_SERVICE_IMAGE = (none)` → omitir bloco `services:` no job `test`.

### Concurrency

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

### Inputs/Outputs

- **Input**: Push event em PR contra `develop` ou `main`
- **Output**: Status check (passed/failed) visível no PR

---

## Contract 2: CD Staging Workflow (`cd-staging.yml`)

**Trigger**: `push` na branch `develop`
**Runner**: CI em `ubuntu-latest`, Deploy em `[self-hosted, staging]`

### Jobs

| Job | Steps | Runs-on | Depends on |
|-----|-------|---------|------------|
| `ci` | checkout, setup-node, `<INSTALL_CMD>`, lint, test (se aplicável) | ubuntu-latest | — |
| `build-and-push` | checkout, login registry, docker build, push tag `:staging` | ubuntu-latest | `ci` |
| `deploy` | checkout, GHCR login, generate .env (incl. `NGINX_NETWORK_NAME`, `VIRTUAL_HOST`), `compose -p <CONTAINER_NAME> pull`, migration (se `PRISMA_MIGRATE`), `compose -p <CONTAINER_NAME> up -d --force-recreate`, prune, cleanup .env | [self-hosted, staging] | `build-and-push` |

> **Regra (frontend):** Se `PROJECT_TYPE = frontend` → job `build-and-push` precisa de `environment: staging` para acessar VITE_* secrets como `build-args`.
> **Regra (deploy):** O job `deploy` DEVE incluir `docker/login-action@v3` para autenticação no GHCR, pois self-hosted runners não mantêm credenciais entre execuções.
> **Regra (compose):** Usar `docker compose -p <CONTAINER_NAME>` para isolar serviços em runners compartilhados. NÃO usar `--remove-orphans`.

### Image Tagging

```text
ghcr.io/<ORG>/<REPO_NAME>:staging
```

### Concurrency

```yaml
concurrency:
  group: deploy-staging-<REPO_NAME>
  cancel-in-progress: false
```

### Permissions

```yaml
permissions:
  packages: write
  contents: read
```

---

## Contract 3: CD Production Workflow (`cd-production.yml`)

**Trigger**: `push tags` matching `v*` (ex: `v1.5.0`)
**Runner**: CI em `ubuntu-latest`, Deploy em `[self-hosted, production]`

### Jobs

| Job | Steps | Runs-on | Depends on |
|-----|-------|---------|------------|
| `ci` | checkout, setup-node, `<INSTALL_CMD>`, lint, test (se aplicável) | ubuntu-latest | — |
| `build-and-push` | checkout, login registry, docker build, push tags `:v1.x.x` + `:latest` | ubuntu-latest | `ci` |
| `deploy` | checkout, GHCR login, generate .env, `compose -p <CONTAINER_NAME> pull`, migration (se `PRISMA_MIGRATE`), `compose -p <CONTAINER_NAME> up -d --force-recreate`, prune, cleanup .env | [self-hosted, production] | `build-and-push` |

> **Regra (frontend):** Se `PROJECT_TYPE = frontend` → job `build-and-push` precisa de `environment: production` para acessar VITE_* secrets como `build-args`.
> **Regra (deploy):** O job `deploy` DEVE incluir `docker/login-action@v3` para autenticação no GHCR, pois self-hosted runners não mantêm credenciais entre execuções.
> **Regra (compose):** Usar `docker compose -p <CONTAINER_NAME>` para isolar serviços em runners compartilhados. NÃO usar `--remove-orphans`.

### Image Tagging

```text
ghcr.io/<ORG>/<REPO_NAME>:<TAG_VERSION>
ghcr.io/<ORG>/<REPO_NAME>:latest
```

### Concurrency

```yaml
concurrency:
  group: deploy-production-<REPO_NAME>
  cancel-in-progress: false
```

---

## Contract 4: Docker Compose — API

**Location**: `<COMPOSE_PATH>/docker-compose.yml`

```yaml
services:
  <SERVICE_NAME>:
    image: ghcr.io/<ORG>/<REPO_NAME>:${IMAGE_TAG:-staging}
    container_name: <CONTAINER_NAME>
    restart: unless-stopped
    env_file: .env
    environment:
      - VIRTUAL_HOST=${VIRTUAL_HOST}
      - LETSENCRYPT_HOST=${VIRTUAL_HOST}
      - VIRTUAL_PORT=${<APP_PORT_VAR>}  # Obrigatório se APP_PORT ≠ 80

networks:
  default:
    name: ${NGINX_NETWORK_NAME}
    external: true
```

> **Regra:** Sem `ports:` — proxy reverso roteia internamente pela rede Docker.
> **Regra:** `VIRTUAL_PORT` obrigatório quando `APP_PORT ≠ 80`.

### Required Secrets (API)

Conforme `ENV_VARS` do project-config, mais:

| Secret | Description |
|--------|-------------|
| `NGINX_NETWORK_NAME` | Nome da rede Docker do proxy (verificar com `docker network ls`) |
| `VIRTUAL_HOST` | Subdomínio para routing |
| `IMAGE_TAG` | Tag da imagem (gerada pelo pipeline) |

> **Regra:** Secrets URL devem incluir protocolo (`https://`).

---

## Contract 5: Docker Compose — Frontend

**Location**: `<COMPOSE_PATH>/docker-compose.yml`

```yaml
services:
  <SERVICE_NAME>:
    image: ghcr.io/<ORG>/<REPO_NAME>:${IMAGE_TAG:-staging}
    container_name: <CONTAINER_NAME>
    restart: unless-stopped
    environment:
      - VIRTUAL_HOST=${VIRTUAL_HOST}
      - LETSENCRYPT_HOST=${VIRTUAL_HOST}
    healthcheck:
      test: ['CMD-SHELL', 'wget -qO- http://localhost:80/index.html || exit 1']
      interval: 30s
      timeout: 3s
      retries: 3

networks:
  default:
    name: ${NGINX_NETWORK_NAME}
    external: true
```

**Diferenças do Contract 4 (API):**

- Sem `VIRTUAL_PORT` (nginx = porta 80 = default do proxy)
- Sem `env_file` (VITE_* já embeddados no JS bundle)
- Com `healthcheck` (wget no index.html)

### Required Secrets (Frontend)

**Build-time:** Todos os `VITE_*` secrets (passados como Docker build-args)
**Deploy-time:** `NGINX_NETWORK_NAME`, `VIRTUAL_HOST`

---

## Contract 6: GitHub Secrets & Environments

### Environments

| Environment | Runner Label | Image Tag | Protection Rules |
|-------------|-------------|-----------|-----------------|
| `staging` | `[self-hosted, staging]` | `:staging` | Nenhuma (deploy automático) |
| `production` | `[self-hosted, production]` | `:<TAG_VERSION>` + `:latest` | Opcional (required reviewers, wait timer) |

### Secrets por Environment

Secrets devem conter TODAS as variáveis listadas em `ENV_VARS` do project-config, mais `NGINX_NETWORK_NAME` e `VIRTUAL_HOST`. Estas variáveis de proxy (`NGINX_NETWORK_NAME`, `VIRTUAL_HOST`) são obrigatórias em **ambos** os environments (staging e production).

> **Lição 3:** O step "Generate .env" DEVE espelhar a validação de schema da aplicação. Variáveis faltantes causam crash na inicialização.
> **Lição 4:** Secrets URL DEVEM incluir protocolo `https://`.

---

## Contract 8: Padrão Multi-Config (Monorepo)

**Escopo**: Define convenções para adoção do template em repositórios monorepo com múltiplos packages.

### Convenção de Nomes

| Artefato | Single-repo | Monorepo (por package) |
|----------|-------------|------------------------|
| Project Config | `project-config.md` | `project-config-<package>.md` (ex: `project-config-backend.md`) |
| CI Workflow | `ci.yml` | `ci-<package>.yml` (ex: `ci-backend.yml`) |
| CD Staging | `cd-staging.yml` | `cd-staging-<package>.yml` (ex: `cd-staging-backend.yml`) |
| CD Production | `cd-production.yml` | `cd-production-<package>.yml` (ex: `cd-production-frontend.yml`) |
| Compose | `docker-compose.yml` | `docker-compose.yml` em diretório separado (ex: `infra/backend/docker-compose.yml`) |
| Dockerfile | `Dockerfile` | `packages/<package>/Dockerfile` ou `infra/<package>/Dockerfile` |

### Path Filters

Cada workflow DEVE incluir `paths:` no trigger para restringir execução ao package correspondente:

```yaml
on:
  pull_request:
    branches: [develop, main]
    paths:
      - 'packages/backend/**'
      - '.github/workflows/ci-backend.yml'
```

> **Regra:** Incluir o próprio workflow no path filter para que mudanças no workflow também disparem CI.
> **Regra:** `PATHS_FILTER` no project-config define os globs. O workflow do package próprio é adicionado manualmente.

### Tags de Produção

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Single-repo | `v*` | `v1.5.0` |
| Monorepo | `<package>-v*` | `backend-v1.5.0`, `frontend-v2.0.0` |

### Secrets

| Tipo | Escopo | Exemplos |
|------|--------|----------|
| Compartilhados | Mesmo valor em todos os packages | `NGINX_NETWORK_NAME`, `VIRTUAL_HOST` (se mesmo domínio) |
| Package-specific | Valor único por package | `DATABASE_URL` (backend only), `VITE_API_URL` (frontend only), `APP_PORT` |

> **Regra:** Secrets compartilhados são configurados uma vez no environment. Secrets package-specific devem ser nomeados sem ambiguidade (o nome do secret no GitHub não precisa de prefixo, pois cada workflow acessa apenas os secrets que referencia).

### Campos Opcionais no Project Config

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `PATHS_FILTER` | list | (não definido) | Globs para trigger. Se ausente, workflow dispara para qualquer mudança |
| `WORKING_DIR` | path | `.` | Diretório de trabalho do package para install, lint, test e build context |

> **Regra:** Repos single-package NÃO precisam definir esses campos. Backward-compatible.

---

## Contract 7: Template Changelog

**Location**: `specs/017-agnostic-cicd-pipeline/CHANGELOG.md`

### Format

```markdown
# Template Changelog

## [1.0.0] - 2026-03-18
### Initial Release
- Template base para APIs Node.js (npm/yarn)
- Template base para frontends Vite/React
- Project-config schema com 17 campos + regras condicionais
- Quickstart com checklist pré-deploy (10 validações)
- 3 workflow templates: ci.yml, cd-staging.yml, cd-production.yml
- 2 compose templates: API (Contract 4) e Frontend (Contract 5)
```
