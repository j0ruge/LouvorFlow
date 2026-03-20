# Research: Pipeline CI/CD Agnóstico para Organização

**Date**: 2026-03-18 | **Feature**: `002-agnostic-cicd-pipeline`

> Consolidação das decisões da implementação-referência (001) com extensões para o template agnóstico.

---

## R-001: Autenticação no Registry — Token Automático vs PAT

**Decision**: Utilizar token automático do provedor CI/CD (ex: `GITHUB_TOKEN`) com permissões de escrita no registry.

**Rationale**: Token automático é escopado ao repositório (least-privilege), sem necessidade de rotação manual. Funciona nativamente com actions de login do registry. PAT só seria necessário para acesso cross-repo.

**Alternatives considered**:

- **PAT (Personal Access Token)**: Necessário apenas para cenários cross-repo. Adiciona complexidade de rotação. Descartado.

---

## R-002: Estratégia de Workflow — Arquivo único vs Separados

**Decision**: Três workflows separados: `ci.yml`, `cd-staging.yml`, `cd-production.yml`.

**Rationale**: Separar CI de CD permite que CI rode independente em PRs sem acionar build/deploy. Separar staging de produção facilita manutenção, triggers distintos e concurrency controls independentes. Reduz complexidade condicional.

**Alternatives considered**:

- **Workflow único com condicionais**: Menor duplicação mas dificulta leitura e manutenção. Descartado.
- **Reusable workflows (`workflow_call`)**: Boa prática para DRY. Pode ser adotado em v2 como refactoring se duplicação se tornar problemática.

---

## R-003: Injeção de Secrets via .env Temporário

**Decision**: Gerar `.env` a partir de secrets no step de deploy, com cleanup `if: always()`.

**Rationale**: Projetos já utilizam `env_file: .env` nos compose files. Gerar a partir de secrets mantém compatibilidade. O cleanup `if: always()` permanece obrigatório para remoção ao final do job, e é complementado por hardening defensivo para reduzir risco em cenários de crash/force-kill.

**Hardening obrigatório**:

- Criar `.env` com permissão restrita antes de escrever secrets (ex.: `touch .env && chmod 600 .env`, ou `umask 077`).
- Preferir workspace em tmpfs/ramdisk no runner para evitar persistência em disco.
- Documentar para administradores dos runners a limpeza automática do workspace entre jobs.

**Alternatives considered**:

- **Step-level `env:` vars inline**: Inviável com 15+ variáveis.
- **Docker secrets (Swarm mode)**: Requer Swarm ou alterações na app. Over-engineering.

---

## R-004: Concurrency Control

**Decision**: `cancel-in-progress: true` para CI (PRs), `cancel-in-progress: false` para CD (deploys).

**Rationale**: CI: cancelar runs anteriores economiza recursos em novos pushes. CD: não cancelar evita estados inconsistentes (container parado no meio de pull).

---

## R-005: Deploy Command

**Decision**: `docker compose pull && docker compose up -d --remove-orphans --force-recreate`, seguido de limpeza de imagens com escopo de projeto (sem prune global do host).

**Rationale**: `--force-recreate` garante recreação quando apenas a tag mudou. `--remove-orphans` limpa containers de serviços removidos. Em runners compartilhados, `docker image prune -f` é perigoso por afetar todo o host.

**Diretriz de limpeza**:

- Preferir prune filtrado por label de projeto (ex.: `docker image prune -f --filter label=org.opencontainers.image.source=https://github.com/<ORG>/<REPO_NAME>`).
- Alternativamente, remover essa limpeza do pipeline e executar prune host-level em job/cron separado com escopo e permissões adequados.

---

## R-006: Migrations como Step Separado

**Decision**: `docker compose run --rm app npx prisma migrate deploy` antes do `docker compose up -d`. Skip quando `PRISMA_MIGRATE = false`.

**Rationale**: Step isolado permite detectar falhas antes de derrubar container principal. `prisma migrate deploy` é seguro para produção (aplica apenas pendentes, não gera novas).

**Failure handling e rollback**:

- Se `docker compose run --rm app npx prisma migrate deploy` falhar (e `PRISMA_MIGRATE` não for `false`), o pipeline deve falhar imediatamente e NÃO executar `docker compose up`.
- Definir caminho manual de rollback com `prisma migrate resolve` + restauração do schema anterior/backup + restore do banco.
- Exigir migrations backward-compatible; quando não forem, marcar deploy como manutenção planejada (downtime).
- Recomendar validação prévia em staging com `npx prisma migrate create --create-only` (ou equivalente) para detectar problemas antes da produção.

---

## R-007: Self-Hosted Runner — Organização com Labels

**Decision**: Um runner por servidor, registrado na organização com labels de ambiente (`staging`, `production`). Instalado como systemd service.

**Rationale**: Registro na organização permite que múltiplos repositórios compartilhem runners. Labels direcionam jobs. Systemd garante reconexão automática.

---

## R-008: Template Versioning Strategy (NOVO)

**Decision**: Versionamento semântico do template (`TEMPLATE_VERSION` no project-config) com changelog mantido no diretório de specs.

**Rationale**: Permite que repos rastreiem qual versão adotaram e apliquem atualizações consultando o diff no changelog. v1.0.0 = template inicial baseado nas implementações de `digital_service_report_api` e `estimates_api`. Mudanças breaking incrementam MAJOR.

**Versioning rules**:

- MAJOR: Mudanças breaking (ex: novo step obrigatório, renomeação de key no project-config)
- MINOR: Novas features opcionais (ex: novo campo opcional no project-config)
- PATCH: Correções de bug ou documentação

**Alternatives considered**:

- **Sem versionamento**: Repos não saberiam se estão desatualizados. Descartado.
- **Shared reusable workflows**: Propaga automaticamente, mas adiciona coupling entre repos e reduz flexibilidade. Candidato para v2.

---

## R-009: Frontend Build-Time Secrets (NOVO — consolidado de 001 R-017)

**Decision**: Para frontends Vite/React, variáveis `VITE_*` são passadas como Docker `ARG`/`ENV` no build stage. O job `build-and-push` precisa de `environment:` para acessar secrets.

**Security warning (crítico)**: valores `VITE_*` são embeddados no bundle cliente em build-time e ficam visíveis no frontend. Nunca usar `VITE_*` para segredos sensíveis (API keys privadas, tokens de autenticação, credenciais). Use `VITE_*` apenas para configuração pública (ex.: URL pública de API, flags públicas, analytics ID).

**Rationale**: Vite embeds `import.meta.env.VITE_*` no bundle JS durante build. Após build, valores estão hardcoded. Env vars no container nginx não têm efeito. Imagens são environment-specific.

**Implications**:

- Staging e produção são imagens diferentes (não é possível promover imagem entre ambientes)
- Sem `VIRTUAL_PORT` (nginx = porta 80 = default do proxy)
- Sem `env_file` (runtime não precisa de env vars)
- Healthcheck via wget no index.html
- Para segredos reais, usar backend proxy ou serviço de configuração/segredos por ambiente.

---

## R-010: Project-Config Schema Design (NOVO)

**Decision**: Schema com 16 campos parametrizáveis + regras condicionais documentadas. Formato: tabela markdown em `project-config.md`.

**Rationale**: Markdown é legível por humanos e parseável por scripts. Tabela key-value é simples de preencher. Regras condicionais documentadas junto ao schema orientam decisões de adaptação.

**Schema keys**:

| Key | Required | Description |
|-----|----------|-------------|
| `REPO_NAME` | Yes | Nome do repositório |
| `PACKAGE_MANAGER` | Yes | `yarn` \| `npm` |
| `INSTALL_CMD` | Yes | Comando de instalação com lockfile |
| `LINTER` | Yes | Ferramenta de lint |
| `LINT_CMD` | Yes | Comando de lint (sem auto-fix) |
| `TEST_FRAMEWORK` | Yes | Framework de testes ou `none` |
| `TEST_CMD` | Conditional | Comando de teste (skip se `none`) |
| `DB_TYPE` | Yes | Tipo de banco ou `none` |
| `DB_SERVICE_IMAGE` | Conditional | Imagem Docker para CI service container |
| `HAS_PRISMA` | Yes | Se utiliza Prisma |
| `PRISMA_MIGRATE` | Conditional | Se executa migrations no deploy |
| `COMPOSE_PATH` | Yes | Caminho do docker-compose |
| `DOCKERFILE_PATH` | Yes | Caminho do Dockerfile |
| `CONTAINER_NAME` | Yes | Nome do container Docker |
| `APP_PORT` | Yes | Porta da aplicação |
| `ENV_VARS` | Yes | Lista de variáveis validadas pela app |
| `PROJECT_TYPE` | Yes | `api` \| `frontend` |
| `TEMPLATE_VERSION` | Yes | Versão do template adotada |

**Conditional rules**:

- `TEST_FRAMEWORK = none` → omitir job test no CI, omitir step test no CD
- `PRISMA_MIGRATE = false` → omitir step migration no deploy
- `DB_SERVICE_IMAGE = (none)` → omitir services no CI
- `PROJECT_TYPE = frontend` → build-args para VITE_*, sem VIRTUAL_PORT, sem env_file
- `APP_PORT ≠ 80` → adicionar VIRTUAL_PORT no compose

---

## R-011: Suporte a Monorepos — Padrão Multi-Config

**Decision**: Adotar o padrão multi-config para suporte a monorepos. Cada package do monorepo é tratado como um "projeto virtual" independente com seu próprio project-config, workflows e compose files. Zero mudanças nos templates de workflow/compose existentes — apenas adições documentais e 2 campos opcionais no schema (`PATHS_FILTER`, `WORKING_DIR`).

**Rationale**: O padrão multi-config é a abordagem mais simples e backward-compatible para suportar monorepos:

- **Backward-compatible**: Os 2 novos campos são opcionais. Repos single-package (como `estimates_api`) não precisam de nenhuma alteração.
- **Zero mudanças em templates**: Os workflow templates e compose templates permanecem idênticos. Apenas são instanciados uma vez por package.
- **Isolamento natural**: Cada package tem seu próprio CI trigger (via `paths:` filter), build, e deploy — exatamente como repos separados.
- **Escalável**: Funciona para 2 packages (ex: backend + frontend) ou N packages.

**Alternatives considered**:

- **Template rewrite com suporte nativo a monorepo**: Adicionar lógica condicional nos templates para detectar e iterar sobre packages. Descartado por complexidade excessiva, acoplamento entre packages, e quebra de backward-compatibility.
- **GitHub Actions matrix strategy**: Usar matrix para gerar jobs por package. Descartado por adicionar complexidade nos templates e dificultar debug de pipelines package-specific.
- **Nx/Turborepo integration**: Usar ferramentas de monorepo para orquestrar CI. Descartado por adicionar dependência externa e estar fora do escopo de "pipeline agnóstico".

**Convenções para monorepos**:

- Workflows nomeados por package: `ci-backend.yml`, `cd-staging-frontend.yml`
- Project configs nomeados por package: `project-config-backend.md`, `project-config-frontend.md`
- Path filters isolam triggers: `packages/backend/**` para backend, `packages/frontend/**` para frontend
- `WORKING_DIR` define o contexto de build (ex: `packages/backend`)
- Secrets podem ser compartilhados (ex: `NGINX_NETWORK_NAME`) ou package-specific (ex: `DATABASE_URL` só para backend)
- Tags de produção prefixadas por package: `backend-v1.0.0`, `frontend-v1.0.0`
