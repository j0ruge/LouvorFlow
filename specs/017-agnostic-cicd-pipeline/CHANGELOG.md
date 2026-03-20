# Template Changelog

All notable changes to the CI/CD pipeline template will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/). Template versioning uses [Semantic Versioning](https://semver.org/).

- **MAJOR**: Breaking changes (new mandatory step, renamed project-config key)
- **MINOR**: New optional features (new optional field, new conditional rule)
- **PATCH**: Bug fixes, documentation corrections

---

## [1.2.0] - 2026-03-20

### Added

- **Suporte a monorepos via padrão multi-config**: Cada package de um monorepo é tratado como projeto independente com seu próprio project-config, workflows e compose files. Zero breaking changes — repos single-package não são afetados.
- **Campo `PATHS_FILTER`** (opcional): Lista de globs para restringir trigger de CI/CD ao package alterado. Ex: `packages/backend/**`. Adicionado ao schema do project-config e ao data-model.
- **Campo `WORKING_DIR`** (opcional, default `.`)**: Diretório de trabalho do package para install, lint, test e build context. Adicionado ao schema do project-config e ao data-model.
- **Contract 8: Padrão Multi-Config (Monorepo)**: Convenções de nomes, path filters, tags prefixadas, e gestão de secrets compartilhados vs package-specific (`workflow-contract.md`).
- **Seção "Adoção em Monorepo"** no quickstart.md: 6 passos para configurar CI/CD em monorepos.
- **Seção "Uso em Monorepo"** no templates/README.md: Convenção de nomes e referências.
- **Blocos `paths:` comentados** nos 3 workflow templates: Seções condicionais para monorepos, seguindo o padrão existente de seções condicionais comentadas.
- **Padrão de tags prefixadas** no cd-production.yml.template: Documentação para tags `<package>-v*` como alternativa em monorepos.
- **R-011** no research.md: Decisão de design — multi-config vs template rewrite, com justificativa e alternativas descartadas.

### Updated Files

- `spec.md` — Clarifications (Q&A monorepo), Out of Scope, Assumptions
- `data-model.md` — 2 campos opcionais, nota de relacionamento para monorepos
- `research.md` — R-011
- `templates/project-config-template.md` — PATHS_FILTER, WORKING_DIR, seção Multi-Config, version bump
- `templates/workflows/ci.yml.template` — bloco paths: comentado
- `templates/workflows/cd-staging.yml.template` — bloco paths: comentado, nota de rename
- `templates/workflows/cd-production.yml.template` — padrão de tags prefixadas
- `contracts/workflow-contract.md` — Contract 8
- `quickstart.md` — seção Adoção em Monorepo
- `templates/README.md` — seção Uso em Monorepo
- `CHANGELOG.md` — esta entrada

---

## [1.1.0] - 2026-03-20

### Bug Fixes

- **GHCR login no deploy job**: Adicionado step `docker/login-action@v3` no job `deploy` dos templates CD staging e production. Self-hosted runners não mantêm credenciais entre execuções e falhavam no pull de imagens privadas do GHCR.
- **Isolamento de compose em runners compartilhados**: Substituído `docker compose pull/up` por `docker compose -p <CONTAINER_NAME> pull/up` e removido `--remove-orphans`. Em runners que hospedam múltiplos serviços, `--remove-orphans` matava containers de outros projetos.
- **Variáveis de proxy no staging**: Adicionado `NGINX_NETWORK_NAME` e `VIRTUAL_HOST` no bloco Generate .env do template CD staging. Sem elas, nginx-proxy não roteava em staging.

### Improvements

- **Placeholder `<NODE_VERSION>`**: Substituído `node-version: 22` hardcoded por `<NODE_VERSION>` em todos os steps `setup-node` dos 3 workflow templates. Projetos com Node 18/20 não precisam mais editar manualmente.
- **Placeholder `<PACKAGE_MANAGER>`**: Substituído `cache: npm` hardcoded por `<PACKAGE_MANAGER>` nos mesmos templates. Projetos com yarn/pnpm não precisam mais editar manualmente.
- **Campo `NODE_VERSION` no project-config**: Adicionado campo obrigatório `NODE_VERSION` ao schema de configuração.
- **Placeholder `<CONTAINER_NAME>` nos comandos compose**: Documentado uso de `-p <CONTAINER_NAME>` na tabela de placeholders do README.

### Updated Files

- `templates/workflows/ci.yml.template` — IMP-1, IMP-2
- `templates/workflows/cd-staging.yml.template` — BUG-1, BUG-2, BUG-3, IMP-1, IMP-2
- `templates/workflows/cd-production.yml.template` — BUG-1, BUG-2, IMP-1, IMP-2
- `templates/project-config-template.md` — NODE_VERSION field, version bump
- `templates/README.md` — New placeholders documented
- `contracts/workflow-contract.md` — Contracts 2, 3, 6 updated
- `quickstart.md` — Checklist item 11, troubleshooting rows, -p flag in commands

---

## [1.0.0] - 2026-03-18

### Initial Release

Based on lessons learned from implementations in `digital_service_report_api` and `estimates_api`.

#### Added

- Project-config schema with 18 fields + conditional rules
- 3 workflow templates: `ci.yml`, `cd-staging.yml`, `cd-production.yml`
- 2 compose templates: API (Contract 4) and Frontend (Contract 5)
- Quickstart guide with 10-item pre-deploy checklist
- Support for conditional rules:
  - `TEST_FRAMEWORK = none` → omit test job
  - `PRISMA_MIGRATE = false` → omit migration step
  - `DB_SERVICE_IMAGE = (none)` → omit CI service container
  - `PROJECT_TYPE = frontend` → build-time VITE_* injection
  - `APP_PORT ≠ 80` → add VIRTUAL_PORT
- 10 lessons learned encoded as pre-deploy checklist items
- Template versioning via `TEMPLATE_VERSION` field in project-config

#### Validated Against

- `estimates_api` (api, npm, biome, mssql, no tests, no migrations)
- `digital_service_report_api` (api, yarn, eslint+prettier, postgresql, jest, prisma migrate)
