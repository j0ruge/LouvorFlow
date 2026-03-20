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

## Restore do Banco de Dados

```bash
cat escalacanto.sql | docker exec -i louvorflow_db psql --username=admin --dbname=louvorflow
```

:bulb: Recomendamos usar como cliente do banco de dados o [DBeaver](https://dbeaver.io/download/)
