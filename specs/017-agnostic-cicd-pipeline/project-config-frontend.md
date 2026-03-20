# Project Configuration: CI/CD Pipeline — Frontend

**Date**: 2026-03-20 | **Template Version**: 1.2.0

> Configuração do pipeline CI/CD para o package `packages/frontend/` do monorepo LouvorFlow.

---

## Instância: LouvorFlow (frontend)

| Key                | Valor                          |
| ------------------ | ------------------------------ |
| `REPO_NAME`        | `LouvorFlow`                   |
| `NODE_VERSION`     | `22`                           |
| `PACKAGE_MANAGER`  | `yarn`                         |
| `INSTALL_CMD`      | `yarn install --frozen-lockfile` |
| `LINTER`           | `eslint`                       |
| `LINT_CMD`         | `yarn workspace vite_react_shadcn_ts run lint` |
| `TEST_FRAMEWORK`   | `vitest`                       |
| `TEST_CMD`         | `yarn workspace vite_react_shadcn_ts run test` |
| `DB_TYPE`          | `none`                         |
| `DB_SERVICE_IMAGE` | `(none)`                       |
| `HAS_PRISMA`       | `false`                        |
| `PRISMA_MIGRATE`   | `false`                        |
| `COMPOSE_PATH`     | `infra/frontend`               |
| `DOCKERFILE_PATH`  | `packages/frontend/Dockerfile` |
| `CONTAINER_NAME`   | `louvorflow-web`               |
| `APP_PORT`         | `80`                           |
| `ENV_VARS`         | `VITE_API_BASE_URL`            |
| `PROJECT_TYPE`     | `frontend`                     |
| `TEMPLATE_VERSION` | `1.2.0`                        |
| `PATHS_FILTER`     | `packages/frontend/**`         |
| `WORKING_DIR`      | `.`                            |

---

## Regras Condicionais Aplicadas

| Condição                       | Resultado                                                    |
| ------------------------------ | ------------------------------------------------------------ |
| `TEST_FRAMEWORK = vitest`      | Job `test` habilitado, sem service container                 |
| `PRISMA_MIGRATE = false`       | Step de migration omitido                                    |
| `DB_SERVICE_IMAGE = (none)`    | Sem service container no CI                                  |
| `PROJECT_TYPE = frontend`      | Build-args para `VITE_API_BASE_URL`, `environment:` no build job |
| `APP_PORT = 80`                | Sem `VIRTUAL_PORT` no compose, sem `env_file`, com healthcheck |

---

## Notas Monorepo

- **Install na raiz**: `yarn install --frozen-lockfile` roda na raiz do repo (yarn workspaces hoista dependências)
- **Lint/test via workspace**: `yarn workspace vite_react_shadcn_ts run <cmd>` executa no contexto do package
- **Build context Docker**: `context: .` (raiz) para acessar `yarn.lock`, `file: packages/frontend/Dockerfile`
- **Build-args**: `VITE_API_BASE_URL` passado como Docker build-arg (embeddado no bundle em build-time)
- **Path filter**: Apenas mudanças em `packages/frontend/**` disparam CI/CD deste package
