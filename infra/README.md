# INFRA

## Postgres

1. Criar o arquivo `.env` confome o exemplo em  `env.docker_example`.

```bash
cp .env.example .env
```

:memo: Lembre de ajustar o `.env` de acordo com o ambiente, produção, homologação, desenvolvimento.

1. Dentro da pasta onde contém o arquivo `docker-compose.yml` do postgres execute.

```bash
docker compose up -d
```

---

## Deploy — Backend (CI/CD)

Compose file de deploy para o backend (API Express). Usado pelos workflows `cd-staging-backend.yml` e `cd-production-backend.yml`.

```text
infra/backend/
├── docker-compose.yml   # Compose de deploy (Contract 4)
└── .env.example         # Referência de variáveis (secrets no GitHub)
```

O arquivo `.env` é gerado automaticamente pelo pipeline a partir de GitHub Secrets e removido após o deploy.

---

## Deploy — Frontend (CI/CD)

Compose file de deploy para o frontend (Vite/React + nginx). Usado pelos workflows `cd-staging-frontend.yml` e `cd-production-frontend.yml`.

```text
infra/frontend/
├── docker-compose.yml   # Compose de deploy (Contract 5)
└── .env.example         # Referência de variáveis (proxy only)
```

Variáveis `VITE_*` são injetadas em build-time via Docker build-args, não em runtime.

---

## GitHub Actions Runner (Self-Hosted)

Runner dockerizado que executa os jobs de deploy (`runs-on: [self-hosted, <label>]`) dos workflows de CD. Roda no servidor de cada ambiente (staging: `192.168.0.6`).

```text
infra/runners/
├── docker-compose.yml   # Runner myoung34/github-runner (auto-update ligado)
├── .env.example         # Template: ACCESS_TOKEN (PAT) + RUNNER_LABELS
└── README.md            # Bring-up, diagnóstico e recovery (config stale / versão deprecada)
```

O runner se auto-registra via `ACCESS_TOKEN` (PAT, escopo `repo`). Se um deploy ficar `queued` indefinidamente, o runner provavelmente caiu — ver o runbook em `infra/runners/README.md`.

---

## Restore do Banco de Dados

```bash
cat escalacanto.sql | docker exec -i louvorflow_db psql --username=admin --dbname=louvorflow
```

:bulb: Recomendamos usar como cliente do banco de dados o [DBeaver](https://dbeaver.io/download/)
