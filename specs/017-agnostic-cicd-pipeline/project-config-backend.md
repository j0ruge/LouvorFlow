# Project Configuration: CI/CD Pipeline — Backend

**Date**: 2026-03-20 | **Template Version**: 1.2.0

> Configuração do pipeline CI/CD para o package `packages/backend/` do monorepo LouvorFlow.

---

## Instância: LouvorFlow (backend)

| Key                | Valor                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REPO_NAME`        | `LouvorFlow`                                                                                                                                                        |
| `NODE_VERSION`     | `22`                                                                                                                                                                |
| `PACKAGE_MANAGER`  | `yarn`                                                                                                                                                              |
| `INSTALL_CMD`      | `yarn install --frozen-lockfile`                                                                                                                                    |
| `LINTER`           | `typescript`                                                                                                                                                        |
| `LINT_CMD`         | `yarn workspace backend run typecheck`                                                                                                                              |
| `TEST_FRAMEWORK`   | `vitest`                                                                                                                                                            |
| `TEST_CMD`         | `yarn workspace backend run test`                                                                                                                                   |
| `DB_TYPE`          | `postgresql`                                                                                                                                                        |
| `DB_SERVICE_IMAGE` | `postgres:17`                                                                                                                                                       |
| `HAS_PRISMA`       | `true`                                                                                                                                                              |
| `PRISMA_MIGRATE`   | `true`                                                                                                                                                              |
| `COMPOSE_PATH`     | `infra/backend`                                                                                                                                                     |
| `DOCKERFILE_PATH`  | `packages/backend/Dockerfile`                                                                                                                                       |
| `CONTAINER_NAME`   | `louvorflow-api`                                                                                                                                                    |
| `APP_PORT`         | `3000`                                                                                                                                                              |
| `ENV_VARS`         | `HOST, PORT, DB_URL, APP_SECRET, ACCESS_TOKEN_EXPIRES_IN, APP_SECRET_REFRESH_TOKEN, REFRESH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_DAYS, APP_API_URL, APP_WEB_URL, NODE_ENV, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS` |
| `PROJECT_TYPE`     | `api`                                                                                                                                                               |
| `TEMPLATE_VERSION` | `1.2.0`                                                                                                                                                             |
| `PATHS_FILTER`     | `packages/backend/**`                                                                                                                                               |
| `WORKING_DIR`      | `.`                                                                                                                                                                 |

---

## Regras Condicionais Aplicadas

| Condição                    | Resultado                                                                    |
| --------------------------- | ---------------------------------------------------------------------------- |
| `TEST_FRAMEWORK = vitest`   | Job `test` habilitado com service container `postgres:17`                    |
| `PRISMA_MIGRATE = true`     | Step de migration habilitado no deploy (`npx prisma migrate deploy`)         |
| `DB_SERVICE_IMAGE = postgres:17` | Service container no CI com health check                                |
| `PROJECT_TYPE = api`        | Com `env_file`, sem build-args VITE_*                                        |
| `APP_PORT = 3000 (≠ 80)`   | `VIRTUAL_PORT=3000` no compose                                               |

---

## Notas Monorepo

- **Install na raiz**: `yarn install --frozen-lockfile` roda na raiz do repo (yarn workspaces hoista dependências)
- **Lint/test via workspace**: `yarn workspace backend run <cmd>` executa no contexto do package
- **Build context Docker**: `context: .` (raiz) para acessar `yarn.lock`, `file: packages/backend/Dockerfile`
- **Path filter**: Apenas mudanças em `packages/backend/**` disparam CI/CD deste package
