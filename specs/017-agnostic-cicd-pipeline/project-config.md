# Project Configuration: CI/CD Pipeline

**Date**: 2026-03-18 | **Template Version**: 1.1.0

> Instância preenchida para `estimates_api`. Validada contra o estado atual do repositório.

---

## Instância: estimates_api

| Key | Valor |
|-----|-------|
| `REPO_NAME` | `estimates_api` |
| `NODE_VERSION` | `22` |
| `PACKAGE_MANAGER` | `npm` |
| `INSTALL_CMD` | `npm ci` |
| `LINTER` | `biome` |
| `LINT_CMD` | `npx biome check .` |
| `TEST_FRAMEWORK` | `none` |
| `TEST_CMD` | `(skip)` |
| `DB_TYPE` | `mssql` (externo, sem service container) |
| `DB_SERVICE_IMAGE` | `(none)` |
| `HAS_PRISMA` | `true` (generate only) |
| `PRISMA_MIGRATE` | `false` (schema read-only do ERP) |
| `COMPOSE_PATH` | `infra` |
| `DOCKERFILE_PATH` | `Dockerfile` |
| `CONTAINER_NAME` | `estimates-api` |
| `APP_PORT` | `9997` |
| `ENV_VARS` | `API_PORT, DATABASE_URL, HOST_API, NODE_ENV, DSR_WEB_URL, API_DSR, JWT_SECRET` |
| `PROJECT_TYPE` | `api` |
| `TEMPLATE_VERSION` | `1.1.0` |

---

## Regras Condicionais Aplicadas

| Condição | Aplicável? | Efeito |
|----------|-----------|--------|
| `TEST_FRAMEWORK = none` | Sim | Job `test` omitido no CI. Step de teste omitido no CD. |
| `PRISMA_MIGRATE = false` | Sim | Step de migration omitido no deploy. |
| `DB_SERVICE_IMAGE = (none)` | Sim | Sem service container no CI. |
| `PROJECT_TYPE = frontend` | Não | — |
| `APP_PORT ≠ 80` | Sim | `VIRTUAL_PORT=${API_PORT}` no docker-compose.yml. |

---

## Validação contra Estado Atual do Repositório

| Artefato | Status | Notas |
|----------|--------|-------|
| `package.json` | `npm` confirmado (sem yarn.lock) | `PACKAGE_MANAGER = npm` correto |
| `biome.jsonc` | Existe com ultracite preset | `LINTER = biome` correto |
| `src/env.ts` | Valida 7 variáveis via Zod | `ENV_VARS` lista 7 variáveis — match |
| `Dockerfile` | Multi-stage, node:22-alpine, `npm ci` | `DOCKERFILE_PATH = Dockerfile` correto |
| `infra/docker-compose.yml` | image GHCR, VIRTUAL_HOST, VIRTUAL_PORT | `COMPOSE_PATH = infra` correto |
| `.github/workflows/ci.yml` | Lint only, sem test job | `TEST_FRAMEWORK = none` correto |
| `.github/workflows/cd-staging.yml` | Sem migration step | `PRISMA_MIGRATE = false` correto |
