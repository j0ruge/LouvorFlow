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

## Resiliência de rede no GHCR (retry/backoff)

Os self-hosted runners sofrem `net/http: TLS handshake timeout` intermitente contra o
`ghcr.io` (causa raiz típica: MTU reduzido em VPN/overlay). Sem retry, um hiccup transitório
aborta o passo de deploy e deixa o container na **imagem antiga** — e como backend e frontend
deployam em workflows independentes (path filters), o frontend pode avançar enquanto o backend
fica para trás, fazendo features novas "não terem efeito". Para mitigar, todo acesso ao registry
nos jobs de deploy passa por composite actions com retry exponencial + backoff e timeout por
tentativa:

```text
.github/actions/
├── ghcr-login/   # docker login ghcr.io com retry (3x, backoff, timeout 30s/tentativa)
└── docker-pull/  # docker pull / docker compose pull com retry (3x, backoff, timeout 300s/tentativa)
```

Ambas são usadas pelos 4 workflows de CD (`cd-{staging,production}-{backend,frontend}.yml`).
Diagnóstico rápido de deploy parcial: se uma feature funciona local mas não em homologação, comparar
o comportamento da API real (`https://api.louvorflow.chewiesoft.com/api`) e checar o histórico em
`gh run list --workflow=cd-staging-backend.yml`; destravar um deploy que falhou no pull com
`gh run rerun --failed <runId>` (a imagem já está buildada no ghcr).

---

## Detecção de deploy parcial (health + smoke test + notificação)

Camadas que tornam um deploy stale/parcial **visível** — antes a falha passava
despercebida e deixava o frontend à frente do backend:

- **`GET /api/health`** (público, sem auth) retorna `{ status, sha, timestamp }`. O `sha`
  vem da env `GIT_SHA`, injetada em build-time pelo Dockerfile do backend (build-arg
  `GIT_SHA=${{ github.sha }}`). Responde "qual commit está no ar?" com um curl.
- **Smoke test pós-deploy** (job `deploy` dos backends): após `compose up`, o CI faz polling
  em `${APP_API_URL}/api/health` e **falha o run** se o `sha` no ar não bater com `github.sha`
  — pega exatamente o caso de container não atualizado.
- **Healthcheck do container** (`infra/backend/docker-compose.yml`): marca o container como
  `unhealthy` se `/api/health` não responder 200 (usa o `node` da imagem; alpine não traz curl).
- **Notificação de falha** (job `notify-failure`, nos 4 workflows): abre uma issue com label
  `deploy-failure` quando qualquer job falha. Roda em `ubuntu-latest` (não no runner
  self-hosted) para disparar mesmo se o runner estiver offline. Para trocar por Slack/Discord,
  substituir o passo `actions/github-script` por um POST ao webhook.

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
