#!/usr/bin/env bash
# dev.sh — Levanta toda a infra de dev do LouvorFlow
set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Cores e prefixos para output
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PREFIX_DB="${CYAN}[DB]${NC}"
PREFIX_BACK="${GREEN}[BACK]${NC}"
PREFIX_FRONT="${BLUE}[FRONT]${NC}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERRO]${NC}  $1"; }

# ---------------------------------------------------------------------------
# 2. Verificar Docker daemon
# ---------------------------------------------------------------------------
if ! docker info > /dev/null 2>&1; then
  log_error "Docker não está rodando. Inicie o Docker Desktop e tente novamente."
  exit 1
fi
log_info "Docker está rodando."

# ---------------------------------------------------------------------------
# 3. Verificar/subir container PostgreSQL
# ---------------------------------------------------------------------------
CONTAINER_NAME="louvorflow_db"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log_info "Container ${CONTAINER_NAME} já está rodando. Pulando docker compose."
else
  log_warn "Container ${CONTAINER_NAME} não encontrado. Subindo com docker compose..."
  docker compose -f "${DIR}/infra/postgres/docker-compose.yml" \
    --env-file "${DIR}/infra/postgres/.env" up -d
  log_info "Container ${CONTAINER_NAME} iniciado."
fi

# ---------------------------------------------------------------------------
# 4. Health check do banco (pg_isready via docker exec, timeout 30s)
# ---------------------------------------------------------------------------
DB_USER=$(grep '^POSTGRES_USERNAME=' "${DIR}/infra/postgres/.env" | cut -d'=' -f2)
TIMEOUT=30
ELAPSED=0

echo -e "${PREFIX_DB} Aguardando PostgreSQL aceitar conexões (timeout: ${TIMEOUT}s)..."

while ! docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" > /dev/null 2>&1; do
  if [ "${ELAPSED}" -ge "${TIMEOUT}" ]; then
    log_error "PostgreSQL não ficou pronto em ${TIMEOUT}s. Verifique o container."
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo -e "${PREFIX_DB} PostgreSQL pronto! (${ELAPSED}s)"

# ---------------------------------------------------------------------------
# 5. Instalar dependencias (npm workspaces)
# ---------------------------------------------------------------------------
log_info "Instalando dependencias (npm install)..."
if ! (cd "${DIR}" && npm install); then
  log_error "Falha ao instalar dependencias."
  exit 1
fi
log_info "Dependencias instaladas."

# ---------------------------------------------------------------------------
# 5.5. Matar processos Node orfaos que travam a porta 3000
# ---------------------------------------------------------------------------
STALE_PID=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "${STALE_PID}" ]; then
    log_warn "Processos orfaos detectados na porta 3000 (PID: ${STALE_PID}). Encerrando..."
    echo "${STALE_PID}" | xargs kill -9 2>/dev/null || true
    sleep 1
    log_info "Processos orfaos encerrados."
fi

# ---------------------------------------------------------------------------
# 6. Prisma generate + migrate (backend)
# ---------------------------------------------------------------------------
log_info "Gerando Prisma Client e aplicando migrations..."
if ! (cd "${DIR}/packages/backend" && npx prisma generate && npx prisma migrate deploy); then
  log_error "Falha ao configurar Prisma (generate/migrate)."
  exit 1
fi
log_info "Prisma Client gerado e migrations aplicadas."

# ---------------------------------------------------------------------------
# 7. Admin seed (idempotente — seguro re-executar)
# ---------------------------------------------------------------------------
log_info "Executando seed do admin..."
if ! (cd "${DIR}/packages/backend" && npx tsx seeds/admin.ts); then
  log_error "Falha ao executar seed do admin."
  exit 1
fi
log_info "Seed do admin executado."

# ---------------------------------------------------------------------------
# 8 & 9. Iniciar backend e frontend em paralelo
# ---------------------------------------------------------------------------
BACK_PID=""
FRONT_PID=""

cleanup() {
  echo ""
  log_warn "Encerrando processos..."
  [ -n "${BACK_PID}" ]  && kill "${BACK_PID}"  2>/dev/null && log_info "Backend encerrado."
  [ -n "${FRONT_PID}" ] && kill "${FRONT_PID}" 2>/dev/null && log_info "Frontend encerrado."
  wait 2>/dev/null
  log_info "Todos os processos encerrados. Container ${CONTAINER_NAME} continua rodando."
}

# ---------------------------------------------------------------------------
# 10. Trap SIGINT/SIGTERM para matar processos filhos
# ---------------------------------------------------------------------------
trap cleanup EXIT

log_info "Iniciando backend (packages/backend)..."
(cd "${DIR}/packages/backend" && npm run dev 2>&1) | sed -u "s/^/$(echo -e "${PREFIX_BACK}") /" &
BACK_PID=$!

log_info "Iniciando frontend (packages/frontend)..."
(cd "${DIR}/packages/frontend" && npm run dev 2>&1) | sed -u "s/^/$(echo -e "${PREFIX_FRONT}") /" &
FRONT_PID=$!

echo ""
log_info "========================================="
log_info " LouvorFlow dev environment rodando!"
log_info " Backend:  http://localhost:3000"
log_info " Frontend: http://localhost:8080"
log_info " Ctrl+C para encerrar"
log_info "========================================="
echo ""

# ---------------------------------------------------------------------------
# 11. Wait nos processos
# ---------------------------------------------------------------------------
wait
