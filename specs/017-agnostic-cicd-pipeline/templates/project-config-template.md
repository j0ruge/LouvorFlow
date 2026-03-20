# Project Configuration: CI/CD Pipeline

**Date**: [DATE] | **Template Version**: 1.1.0

> Preencha esta configuração para adaptar o pipeline CI/CD ao seu repositório.
> Consulte o quickstart.md para instruções completas de adoção.

---

## Schema de Configuração

| Key | Descrição | Valores possíveis | Obrigatório |
|-----|-----------|-------------------|-------------|
| `REPO_NAME` | Nome do repositório (exato, case-sensitive) | string | Sim |
| `NODE_VERSION` | Versão do Node.js | `22` \| `20` \| `18` | Sim |
| `PACKAGE_MANAGER` | Gerenciador de pacotes | `yarn` \| `npm` \| `pnpm` | Sim |
| `INSTALL_CMD` | Comando de instalação com lockfile | `yarn install --frozen-lockfile` \| `npm ci` | Sim |
| `LINTER` | Ferramenta de lint | `eslint+prettier` \| `biome` \| outro | Sim |
| `LINT_CMD` | Comando de lint (CI, sem auto-fix) | ex: `npx biome check .` \| `npx eslint src/ --max-warnings 0` | Sim |
| `TEST_FRAMEWORK` | Framework de testes | `jest` \| `vitest` \| `none` | Sim |
| `TEST_CMD` | Comando de teste | ex: `yarn test` \| `npm test` \| `(skip)` | Se TEST_FRAMEWORK ≠ none |
| `DB_TYPE` | Tipo de banco de dados | `postgresql` \| `mssql` \| `none` | Sim |
| `DB_SERVICE_IMAGE` | Imagem Docker para service container no CI | ex: `postgres:17` \| `(none)` | Se DB_TYPE ≠ none e ≠ mssql |
| `HAS_PRISMA` | Se utiliza Prisma ORM | `true` \| `false` | Sim |
| `PRISMA_MIGRATE` | Se executa migrations no deploy | `true` \| `false` | Se HAS_PRISMA = true |
| `COMPOSE_PATH` | Caminho do docker-compose (relativo à raiz) | ex: `infra` \| `infra/nodejs` | Sim |
| `DOCKERFILE_PATH` | Caminho do Dockerfile (relativo à raiz) | ex: `Dockerfile` \| `infra/nodejs/Dockerfile` | Sim |
| `CONTAINER_NAME` | Nome do container Docker | ex: `estimates-api` | Sim |
| `APP_PORT` | Porta da aplicação | ex: `9997` \| `3003` \| `80` | Sim |
| `ENV_VARS` | Lista de variáveis validadas pela app (env.ts/env.js) | lista separada por vírgula | Sim |
| `PROJECT_TYPE` | Tipo de projeto | `api` \| `frontend` | Sim |
| `TEMPLATE_VERSION` | Versão do template adotada | semver (ex: `1.0.0`) | Sim |

---

## Instância: [REPO_NAME]

| Key | Valor |
|-----|-------|
| `REPO_NAME` | `` |
| `NODE_VERSION` | `` |
| `PACKAGE_MANAGER` | `` |
| `INSTALL_CMD` | `` |
| `LINTER` | `` |
| `LINT_CMD` | `` |
| `TEST_FRAMEWORK` | `` |
| `TEST_CMD` | `` |
| `DB_TYPE` | `` |
| `DB_SERVICE_IMAGE` | `` |
| `HAS_PRISMA` | `` |
| `PRISMA_MIGRATE` | `` |
| `COMPOSE_PATH` | `` |
| `DOCKERFILE_PATH` | `` |
| `CONTAINER_NAME` | `` |
| `APP_PORT` | `` |
| `ENV_VARS` | `` |
| `PROJECT_TYPE` | `` |
| `TEMPLATE_VERSION` | `1.1.0` |

---

## Regras Condicionais

| Condição | Ação no Workflow | Ação no Compose |
|----------|-----------------|-----------------|
| `TEST_FRAMEWORK = none` | Omitir job `test` no CI e step de teste no CD | — |
| `PRISMA_MIGRATE = false` | Omitir step de migration no deploy | — |
| `DB_SERVICE_IMAGE = (none)` | Omitir `services:` (service container) no job de CI | — |
| `PROJECT_TYPE = frontend` | Build-args para VITE_*, `environment:` no build job | Sem `env_file`, sem `VIRTUAL_PORT`, com healthcheck |
| `APP_PORT ≠ 80` | — | Adicionar `VIRTUAL_PORT: ${APP_PORT_VAR}` |

---

## Como Usar

1. Copie este arquivo para `specs/<feature>/project-config.md` do seu repositório
2. Preencha a tabela "Instância" com os valores do projeto
3. Aplique as regras condicionais aos workflow templates
4. Configure GitHub Secrets conforme `ENV_VARS` + `NGINX_NETWORK_NAME` + `VIRTUAL_HOST`
5. Execute o checklist pré-deploy do quickstart.md antes do primeiro deploy
6. Consulte o CHANGELOG.md para atualizações de template
