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

## Restore do Banco de Dados

```bash
cat escalacanto.sql | docker exec -i louvorflow_db psql --username=admin --dbname=louvorflow
```

:bulb: Recomendamos usar como cliente do banco de dados o [DBeaver](https://dbeaver.io/download/)
