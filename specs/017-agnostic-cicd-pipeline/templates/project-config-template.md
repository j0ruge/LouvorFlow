# Project Configuration: CI/CD Pipeline

**Date**: [DATE] | **Template Version**: 1.2.0

> Preencha esta configuração para adaptar o pipeline CI/CD ao seu repositório.
> Consulte o quickstart.md para instruções completas de adoção.

---

## Schema de Configuração

| Key                | Descrição                                             | Valores possíveis                                                                | Obrigatório                 |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| `REPO_NAME`        | Nome do repositório (exato, case-sensitive)           | string                                                                           | Sim                         |
| `NODE_VERSION`     | Versão do Node.js                                     | `22` \| `20` \| `18`                                                             | Sim                         |
| `PACKAGE_MANAGER`  | Gerenciador de pacotes                                | `yarn` \| `npm` \| `pnpm`                                                        | Sim                         |
| `INSTALL_CMD`      | Comando de instalação com lockfile                    | `yarn install --frozen-lockfile` \| `npm ci` \| `pnpm install --frozen-lockfile` | Sim                         |
| `LINTER`           | Ferramenta de lint                                    | `eslint+prettier` \| `biome` \| outro                                            | Sim                         |
| `LINT_CMD`         | Comando de lint (CI, sem auto-fix)                    | ex: `npx biome check .` \| `npx eslint src/ --max-warnings 0`                    | Sim                         |
| `TEST_FRAMEWORK`   | Framework de testes                                   | `jest` \| `vitest` \| `none`                                                     | Sim                         |
| `TEST_CMD`         | Comando de teste                                      | ex: `yarn test` \| `npm test`                                                    | Se TEST_FRAMEWORK ≠ none    |
| `DB_TYPE`          | Tipo de banco de dados                                | `postgresql` \| `mssql` \| `none`                                                | Sim                         |
| `DB_SERVICE_IMAGE` | Imagem Docker para service container no CI            | ex: `postgres:17` \| `(none)`                                                    | Se DB_TYPE ≠ none e ≠ mssql |
| `HAS_PRISMA`       | Se utiliza Prisma ORM                                 | `true` \| `false`                                                                | Sim                         |
| `PRISMA_MIGRATE`   | Se executa migrations no deploy                       | `true` \| `false`                                                                | Se HAS_PRISMA = true        |
| `COMPOSE_PATH`     | Caminho do docker-compose (relativo à raiz)           | ex: `infra` \| `infra/nodejs`                                                    | Sim                         |
| `DOCKERFILE_PATH`  | Caminho do Dockerfile (relativo à raiz)               | ex: `Dockerfile` \| `infra/nodejs/Dockerfile`                                    | Sim                         |
| `CONTAINER_NAME`   | Nome do container Docker                              | ex: `estimates-api`                                                              | Sim                         |
| `APP_PORT`         | Porta da aplicação                                    | ex: `9997` \| `3003` \| `80`                                                     | Sim                         |
| `ENV_VARS`         | Lista de variáveis validadas pela app (env.ts/env.js) | lista separada por vírgula                                                       | Sim                         |
| `PROJECT_TYPE`     | Tipo de projeto                                       | `api` \| `frontend`                                                              | Sim                         |
| `TEMPLATE_VERSION` | Versão do template adotada                            | semver (ex: `1.0.0`)                                                             | Sim                         |
| `PATHS_FILTER`     | Filtro de caminhos para trigger CI/CD (monorepo only)  | lista de globs (ex: `packages/backend/**`)                                       | Não (monorepo only)         |
| `WORKING_DIR`      | Diretório de trabalho do package (monorepo only)       | path relativo (ex: `packages/backend`). Default: `.`                             | Não (monorepo only)         |

---

## Instância: [REPO_NAME]

| Key                | Valor   |
| ------------------ | ------- |
| `REPO_NAME`        | ``      |
| `NODE_VERSION`     | ``      |
| `PACKAGE_MANAGER`  | ``      |
| `INSTALL_CMD`      | ``      |
| `LINTER`           | ``      |
| `LINT_CMD`         | ``      |
| `TEST_FRAMEWORK`   | ``      |
| `TEST_CMD`         | ``      |
| `DB_TYPE`          | ``      |
| `DB_SERVICE_IMAGE` | ``      |
| `HAS_PRISMA`       | ``      |
| `PRISMA_MIGRATE`   | ``      |
| `COMPOSE_PATH`     | ``      |
| `DOCKERFILE_PATH`  | ``      |
| `CONTAINER_NAME`   | ``      |
| `APP_PORT`         | ``      |
| `ENV_VARS`         | ``      |
| `PROJECT_TYPE`     | ``      |
| `TEMPLATE_VERSION` | `1.2.0` |
| `PATHS_FILTER`     | ``      |
| `WORKING_DIR`      | ``      |

---

## Regras Condicionais

| Condição                                    | Ação no Workflow                                      | Ação no Compose                                                            |
| ------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `TEST_FRAMEWORK = none`                     | Omitir job `test` no CI e step de teste no CD         | —                                                                          |
| `PRISMA_MIGRATE = false`                    | Omitir step de migration no deploy                    | —                                                                          |
| `DB_SERVICE_IMAGE = (none)`                 | Omitir `services:` (service container) no job de CI   | —                                                                          |
| `PROJECT_TYPE = frontend` e `APP_PORT = 80` | Build-args para VITE\_\*, `environment:` no build job | Sem `env_file`, sem `VIRTUAL_PORT`, com healthcheck                        |
| `PROJECT_TYPE = frontend` e `APP_PORT ≠ 80` | Build-args para VITE\_\*, `environment:` no build job | Sem `env_file`, adicionar `VIRTUAL_PORT: ${APP_PORT}` e manter healthcheck |
| `PROJECT_TYPE = api` e `APP_PORT ≠ 80`      | —                                                     | Com `env_file`, adicionar `VIRTUAL_PORT: ${APP_PORT}`                      |

---

## Padrão Multi-Config (Monorepo)

Para monorepos com múltiplos packages (ex: `packages/backend/` + `packages/frontend/`), cada package é tratado como um projeto independente:

1. **Um project-config por package**: `project-config-backend.md`, `project-config-frontend.md`
2. **Workflows nomeados por package**: `ci-backend.yml`, `cd-staging-backend.yml`, `cd-production-frontend.yml`
3. **PATHS_FILTER**: Lista de globs que restringe o trigger do workflow ao package. Ex: `packages/backend/**` garante que mudanças no frontend não disparam CI do backend
4. **WORKING_DIR**: Diretório raiz do package. Usado como contexto de build Docker e diretório de trabalho para install/lint/test. Ex: `packages/backend`
5. **Compose files separados**: Cada package tem seu próprio compose file (ex: `infra/backend/docker-compose.yml`)
6. **Dockerfile por package**: Cada package DEVE ter seu próprio Dockerfile
7. **Tags de produção prefixadas**: Em CD production, usar padrão `<package>-v*` (ex: `backend-v1.0.0`, `frontend-v1.0.0`)
8. **Secrets**: Podem ser compartilhados (ex: `NGINX_NETWORK_NAME`) ou package-specific (ex: `DATABASE_URL` só para backend)

> **Nota**: Repos single-package ignoram `PATHS_FILTER` e `WORKING_DIR` — backward-compatible.

---

## Como Usar

1. Copie este arquivo para `specs/<feature>/project-config.md` do seu repositório (um por package em monorepos)
2. Preencha a tabela "Instância" com os valores do projeto
3. Aplique as regras condicionais aos workflow templates
4. Configure GitHub Secrets conforme `ENV_VARS` + `NGINX_NETWORK_NAME` + `VIRTUAL_HOST`
5. Execute o checklist pré-deploy do quickstart.md antes do primeiro deploy
6. Consulte o CHANGELOG.md para atualizações de template
