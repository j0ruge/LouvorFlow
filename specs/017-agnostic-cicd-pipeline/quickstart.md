# Quickstart: Pipeline CI/CD Agnóstico

**Date**: 2026-03-20 | **Feature**: `017-agnostic-cicd-pipeline` | **Template Version**: 1.2.0

---

## Pré-requisitos

- [ ] Docker e docker compose instalados nos servidores de staging e produção
- [ ] Proxy reverso com auto-SSL (ex: nginx-proxy + acme-companion) rodando nos servidores
- [ ] Self-hosted runners instalados e online nos servidores (ver seção Runner Setup)
- [ ] Acesso admin aos repositórios para configurar Secrets e Environments
- [ ] Dockerfile funcional no repositório

---

## Adoção em Novo Repositório (< 1 hora)

### Step 1: Preencher Project Config (10 min)

Criar `specs/<FEATURE>/project-config.md` com os valores do projeto (ver schema no data-model.md).

**Campos obrigatórios**: `REPO_NAME`, `NODE_VERSION`, `PACKAGE_MANAGER`, `INSTALL_CMD`, `LINTER`, `LINT_CMD`, `TEST_FRAMEWORK`, `DB_TYPE`, `HAS_PRISMA`, `COMPOSE_PATH`, `DOCKERFILE_PATH`, `CONTAINER_NAME`, `APP_PORT`, `ENV_VARS`, `PROJECT_TYPE`, `TEMPLATE_VERSION`.

### Step 2: Adaptar Workflows (15 min)

Copiar os 3 workflow templates para `.github/workflows/` e substituir placeholders:

1. **ci.yml**: Substituir `<INSTALL_CMD>`, `<LINT_CMD>`, `<TEST_CMD>`. Se `TEST_FRAMEWORK = none`, remover job `test`.
2. **cd-staging.yml**: Substituir `<INSTALL_CMD>`, `<LINT_CMD>`, `<REPO_NAME>`, `<DOCKERFILE_PATH>`, `<COMPOSE_PATH>`, `ENV_VARS` no Generate .env.
3. **cd-production.yml**: Mesmo que staging, com trigger em tags e environment `production`.

### Step 3: Adaptar Docker Compose (10 min)

Atualizar `<COMPOSE_PATH>/docker-compose.yml` conforme Contract 4 (API) ou Contract 5 (Frontend).

**Para APIs** (`PROJECT_TYPE = api`):

- `image: ghcr.io/<ORG>/<REPO_NAME>:${IMAGE_TAG:-staging}`
- `env_file: .env`
- `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, `VIRTUAL_PORT` (se porta ≠ 80)
- Rede externa do proxy

**Para Frontends** (`PROJECT_TYPE = frontend`):

- Mesmo `image`, sem `env_file`, sem `VIRTUAL_PORT`, com `healthcheck`

### Step 4: Configurar GitHub Secrets (15 min)

1. Criar Environments `staging` e `production` no repo
2. Adicionar secrets conforme `ENV_VARS` do project-config
3. Adicionar `NGINX_NETWORK_NAME` e `VIRTUAL_HOST` em cada environment

### Step 5: Validação Pré-Deploy (10 min)

Executar o **Checklist Pré-Deploy** abaixo antes do primeiro deploy.

### Step 6: Primeiro Deploy

1. Criar branch `develop` (se não existir)
2. Fazer push para `develop` → pipeline de staging deve disparar
3. Validar que a aplicação está acessível via subdomínio de staging
4. Criar tag `v1.0.0` → pipeline de produção deve disparar
5. Validar que a aplicação está acessível via subdomínio de produção

---

## Checklist Pré-Deploy (11 validações)

> Execute **TODAS** as verificações antes do primeiro deploy em um novo repositório ou domínio. Cada item corresponde a uma lição aprendida da implementação-referência.

### Infraestrutura

- [ ] **1. DNS resolve para o servidor correto**

  ```bash
  dig <subdominio-staging> +short  # Deve resolver para IP do servidor de staging
  dig <subdominio-producao> +short  # Deve resolver para IP do servidor de produção
  ```

- [ ] **2. Nome da rede do proxy está correto**

  ```bash
  # No servidor:
  docker network ls | grep proxy
  # Comparar com o valor de NGINX_NETWORK_NAME no secret
  ```

- [ ] **3. Porta 80 acessível (Let's Encrypt HTTP-01)**

  ```bash
  curl -sv http://<subdominio> 2>&1 | head -5
  ```

### Secrets & Variáveis

- [ ] **4. Generate .env espelha validação de schema da app**
  - Comparar as variáveis no step "Generate .env" do workflow CD com as variáveis validadas em `src/env.ts` (ou equivalente)
  - Ambas as fontes devem estar em sincronia

- [ ] **5. Secrets URL incluem protocolo https://**
  - Verificar que secrets como `API_DSR`, `DSR_WEB_URL`, etc. incluem `https://`
  - Schema `z.string().url()` rejeita strings sem protocolo

- [ ] **6. Todas as variáveis do ENV_VARS têm secret correspondente**
  - Para cada variável listada em `ENV_VARS` do project-config, verificar que existe um secret no environment

### Docker & Compose

- [ ] **7. VIRTUAL_PORT configurado (se porta ≠ 80)**
  - APIs: verificar que `VIRTUAL_PORT=${APP_PORT_VAR}` está no compose
  - Frontends: NÃO precisa (nginx = porta 80)

- [ ] **8. Sem port mapping no compose de staging/produção**
  - Verificar que NÃO existe `ports:` no docker-compose.yml
  - Port mapping só deve existir em `docker-compose-dev.yml`

- [ ] **9. Runner user no grupo docker**

  ```bash
  # No servidor:
  groups $(whoami) | grep docker
  # Se não estiver: sudo usermod -aG docker $USER (requer re-login)
  ```

### CI

- [ ] **10. Lint e testes passam localmente**

  ```bash
  <INSTALL_CMD>
  <LINT_CMD>
  <TEST_CMD>  # Se TEST_FRAMEWORK ≠ none
  ```

- [ ] **11. Self-hosted runner consegue pull de imagem GHCR**

  ```bash
  # No servidor (como runner user):
  docker pull ghcr.io/<ORG>/<REPO_NAME>:staging
  # Se "unauthorized": verificar que o workflow inclui docker/login-action@v3 no job deploy
  ```

---

## Adoção em Monorepo

Para repositórios com múltiplos packages (ex: `packages/backend/` + `packages/frontend/`), siga o padrão multi-config:

### Step 1: Criar um Project Config por Package (10 min)

Criar um arquivo de configuração para cada package:

- `project-config-backend.md` — com `PATHS_FILTER: packages/backend/**` e `WORKING_DIR: packages/backend`
- `project-config-frontend.md` — com `PATHS_FILTER: packages/frontend/**` e `WORKING_DIR: packages/frontend`

### Step 2: Copiar e Renomear Workflows por Package (20 min)

Copiar os 3 workflow templates para `.github/workflows/` **uma vez por package**, renomeando:

| Package | CI | CD Staging | CD Production |
|---------|-------|------------|---------------|
| backend | `ci-backend.yml` | `cd-staging-backend.yml` | `cd-production-backend.yml` |
| frontend | `ci-frontend.yml` | `cd-staging-frontend.yml` | `cd-production-frontend.yml` |

### Step 3: Configurar Path Filters (5 min)

Em cada workflow, descomentar o bloco `paths:` e preencher com o `PATHS_FILTER` do project-config:

```yaml
on:
  pull_request:
    branches: [develop, main]
    paths:
      - 'packages/backend/**'
      - '.github/workflows/ci-backend.yml'
```

Para CD Production, usar tags prefixadas por package:

```yaml
on:
  push:
    tags:
      - 'backend-v*'
```

### Step 4: Cada Package com seu Dockerfile e Compose (15 min)

- Criar Dockerfile em cada package (ex: `packages/backend/Dockerfile`)
- Criar compose file em diretório separado (ex: `infra/backend/docker-compose.yml`)
- Ajustar `DOCKERFILE_PATH` e `COMPOSE_PATH` no project-config de cada package

### Step 5: Configurar Secrets (10 min)

- Secrets compartilhados: `NGINX_NETWORK_NAME` (mesmo valor para todos os packages)
- Secrets package-specific: `DATABASE_URL` (backend only), `VITE_API_URL` (frontend only)
- Cada workflow referencia apenas os secrets que precisa

### Step 6: Validar

Executar o Checklist Pré-Deploy acima **para cada package** individualmente.

---

## Runner Setup (por servidor)

```bash
# Download e instalação
mkdir -p /opt/actions-runner && cd /opt/actions-runner
curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64.tar.gz
# Nota: este exemplo usa o endpoint latest. Revise a release atual do runner se o nome do artefato mudar.
tar xzf actions-runner-linux-x64.tar.gz

# Configuração (staging)
./config.sh --url https://github.com/<ORG> --token <ORG_TOKEN> --labels staging

# Configuração (produção)
./config.sh --url https://github.com/<ORG> --token <ORG_TOKEN> --labels production

# Instalar como serviço
sudo ./svc.sh install && sudo ./svc.sh start

# Adicionar ao grupo docker
sudo usermod -aG docker $(whoami)
```

---

## Troubleshooting Rápido

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` | DNS não aponta para o servidor | `dig dominio +short` e corrigir DNS |
| `ERR_CONNECTION_REFUSED` (proxy OK) | `VIRTUAL_PORT` não definido | Adicionar VIRTUAL_PORT no compose |
| `ZodError: invalid_type` no container | Variável faltante no Generate .env | Comparar env.ts com step Generate .env |
| `ZodError: invalid_string` no container | Secret URL sem `https://` | Recriar secret com `https://` |
| `network not found` | NGINX_NETWORK_NAME errado | `docker network ls \| grep proxy` |
| `unauthorized` no docker pull | Auth em contexto errado (sudo) | Runner user no grupo docker |
| `unauthorized` no deploy pull | GHCR login ausente no deploy job | Adicionar `docker/login-action@v3` no job deploy |
| Container de outro serviço parou | `--remove-orphans` em runner compartilhado | Usar `docker compose -p <CONTAINER_NAME>` e remover `--remove-orphans` |
| nginx-proxy não roteia em staging | `NGINX_NETWORK_NAME`/`VIRTUAL_HOST` ausentes no .env | Incluir variáveis de proxy no Generate .env de staging |
| Build falha no CI | Lint/testes não passam | Rodar localmente primeiro |

---

## Rollback Manual

```bash
# 1. Pull imagem anterior
docker pull ghcr.io/<ORG>/<REPO>:<tag-anterior>

# 2. Recriar container
docker compose -p <CONTAINER_NAME> -f <COMPOSE_PATH>/docker-compose.yml up -d --force-recreate

# 3. Verificar
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

---

## Comandos Úteis

```bash
# Status do runner
sudo systemctl status actions.runner.*

# Containers rodando
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Logs de um container
docker compose -p <CONTAINER_NAME> -f <COMPOSE_PATH>/docker-compose.yml logs -f

# Limpeza manual de imagens
docker image prune -af
```
