# CI/CD Pipeline Templates — v1.2.0

Templates reutilizáveis para configurar pipelines CI/CD em repositórios Node.js/React da organização.

## Contents

```text
templates/
├── README.md                          # This file
├── project-config-template.md         # Schema de configuração por projeto
├── workflows/
│   ├── ci.yml.template                # CI: lint + testes em PRs
│   ├── cd-staging.yml.template        # CD: build + deploy em staging
│   └── cd-production.yml.template     # CD: build + deploy em produção
└── compose/
    ├── docker-compose-api.yml.template      # Compose para APIs (backend)
    └── docker-compose-frontend.yml.template # Compose para frontends (Vite/React)
```

## Quick Start

1. Preencha o `project-config-template.md` com os valores do seu projeto
2. Copie os workflow templates para `.github/workflows/` e substitua os placeholders
3. Adapte o compose template (API ou Frontend) para `<COMPOSE_PATH>/docker-compose.yml`
4. Configure GitHub Secrets conforme `ENV_VARS` do project-config
5. Execute o checklist pré-deploy do [quickstart.md](../quickstart.md)

## Placeholders

| Placeholder         | Source         | Description                                                                                                            |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `<REPO_NAME>`       | project-config | Nome do repositório                                                                                                    |
| `<ORG>`             | GitHub org     | Nome da organização (ex: `jrc-brasil`)                                                                                 |
| `<NODE_VERSION>`    | project-config | Versão do Node.js (ex: `22`, `20`, `18`)                                                                               |
| `<PACKAGE_MANAGER>` | project-config | Gerenciador de pacotes para cache (ex: `npm`, `yarn`, `pnpm`)                                                          |
| `<INSTALL_CMD>`     | project-config | Comando de instalação (ex: `npm ci`)                                                                                   |
| `<LINT_CMD>`        | project-config | Comando de lint (ex: `npx biome check .`)                                                                              |
| `<TEST_CMD>`        | project-config | Comando de teste (ex: `npm test`)                                                                                      |
| `<DOCKERFILE_PATH>` | project-config | Caminho do Dockerfile                                                                                                  |
| `<COMPOSE_PATH>`    | project-config | Caminho do docker-compose                                                                                              |
| `<CONTAINER_NAME>`  | project-config | Nome do container Docker. Usado em `docker compose -p <CONTAINER_NAME>` para isolar serviços em runners compartilhados |
| `<ENV_VARS_BLOCK>`  | project-config | Bloco de variáveis no Generate .env                                                                                    |
| `<SERVICE_NAME>`    | project-config | Nome do serviço no compose                                                                                             |
| `<APP_PORT_VAR>`    | project-config | Nome da variável de porta (ex: `API_PORT`)                                                                             |

## Conditional Rules

See `project-config-template.md` for the full list of conditional rules that affect which sections of the templates to include or remove.

## Uso em Monorepo

Para monorepos com múltiplos packages, cada package é tratado como projeto independente:

1. **Um project-config por package**: `project-config-backend.md`, `project-config-frontend.md`
2. **Workflows renomeados por package**: `ci-backend.yml`, `cd-staging-frontend.yml`, etc.
3. **Path filters**: Descomentar bloco `paths:` nos workflows e preencher com `PATHS_FILTER` do project-config
4. **Tags prefixadas**: CD Production usa `backend-v*` ou `frontend-v*` em vez de `v*`
5. **Compose/Dockerfile separados**: Cada package em seu próprio diretório (ex: `infra/backend/`, `packages/backend/Dockerfile`)

### Convenção de Nomes

| Artefato | Single-repo | Monorepo |
|----------|-------------|----------|
| Project Config | `project-config.md` | `project-config-<package>.md` |
| Workflows | `ci.yml`, `cd-staging.yml` | `ci-<package>.yml`, `cd-staging-<package>.yml` |
| Compose | `<COMPOSE_PATH>/docker-compose.yml` | `infra/<package>/docker-compose.yml` |

> Ver [quickstart.md](../quickstart.md) seção "Adoção em Monorepo" para passos detalhados.
> Ver [workflow-contract.md](../contracts/workflow-contract.md) Contract 8 para convenções completas.

## Versioning

Check [CHANGELOG.md](../CHANGELOG.md) for template version history. Each project-config tracks its adopted version via `TEMPLATE_VERSION`.
