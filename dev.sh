#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# LouvorFlow - Development Script
# Manages: PostgreSQL, Backend API, Frontend SPA
# =============================================================================

# Resolve the absolute directory of this script in a portable way.
# Strategy:
#   1. realpath   — available on Linux and macOS (coreutils / brew)
#   2. readlink -f — available on Linux and GNU readlink
#   3. POSIX cd/pwd-P fallback — always available; handles symlinks via the kernel
resolve_script_dir() {
  local src="${BASH_SOURCE[0]}"
  local dir

  if command -v realpath >/dev/null 2>&1; then
    dir="$(dirname "$(realpath "$src")")"
  elif readlink -f "$src" >/dev/null 2>&1; then
    dir="$(dirname "$(readlink -f "$src")")"
  else
    # POSIX-safe fallback: no external tools needed
    dir="$(cd "$(dirname "$src")" && pwd -P)"
  fi

  echo "$dir"
}

DIR="$(resolve_script_dir)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Prefixes
PREFIX_DB="${CYAN}[POSTGRES]${NC}"
PREFIX_BACK="${GREEN}[BACKEND]${NC}"
PREFIX_FRONT="${BLUE}[FRONTEND]${NC}"

# Constants
BACKEND_PORT=3000
FRONTEND_PORT=8080
BACKEND_DIR="$DIR/packages/backend"
FRONTEND_DIR="$DIR/packages/frontend"
INFRA_DIR="$DIR/infra/postgres"

# PIDs for cleanup
PIDS=()

# Flags
WITH_DOCKER=true

# =============================================================================
# Logging functions
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC}  $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC}  $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC}  $1"
}

log_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

# =============================================================================
# Version helper
# =============================================================================

get_version() {
    local dir="$1"
    if [[ -f "$dir/package.json" ]]; then
        local ver
        ver=$(grep -o '"version": *"[^"]*"' "$dir/package.json" | head -1 | cut -d'"' -f4)
        echo "${ver#v}"
    else
        echo "?.?.?"
    fi
}

# Project versions
BACKEND_VERSION="$(get_version "$BACKEND_DIR")"
FRONTEND_VERSION="$(get_version "$FRONTEND_DIR")"

# =============================================================================
# Parse arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --with-docker)
                WITH_DOCKER=true
                shift
                ;;
            --no-docker)
                WITH_DOCKER=false
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --with-docker    Start PostgreSQL container (default)"
                echo "  --no-docker      Skip Docker/PostgreSQL startup"
                echo "  -h, --help       Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# Cleanup function
# =============================================================================

cleanup() {
    echo ""
    log_warn "Encerrando serviços..."

    # Pass 1: graceful kill
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    # Wait for processes to terminate
    sleep 1

    # Pass 2: force kill if still running
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    done

    log_info "Todos os serviços encerrados. Container PostgreSQL continua rodando."
    exit 0
}

trap cleanup EXIT SIGINT SIGTERM

# =============================================================================
# Check Docker
# =============================================================================

check_docker() {
    log_step "Verificando Docker..."

    if ! command -v docker &>/dev/null; then
        log_error "Docker não está instalado."
        exit 1
    fi

    if ! docker info &>/dev/null; then
        log_error "Docker daemon não está rodando. Inicie o Docker e tente novamente."
        exit 1
    fi

    log_info "Docker está rodando."
}

# =============================================================================
# Port helpers
# =============================================================================

# Procura uma porta livre a partir de base_port, tentando até max_tries vezes.
find_available_port() {
    local base_port="$1"
    local max_tries="${2:-10}"
    local port="$base_port"
    local attempt=0

    while [[ $attempt -lt $max_tries ]]; do
        if ! ss -tlnp 2>/dev/null | grep -q ":${port} "; then
            echo "$port"
            return 0
        fi
        ((port++))
        ((attempt++))
    done

    return 1
}

# Atualiza a porta do PostgreSQL nos arquivos .env de infra e backend.
update_port_in_env_files() {
    local new_port="$1"
    local infra_env="$INFRA_DIR/.env"
    local backend_env="$BACKEND_DIR/.env"

    sed -i "s/^POSTGRES_LOCAL_PORT=.*/POSTGRES_LOCAL_PORT=${new_port}/" "$infra_env"
    log_info "Atualizado POSTGRES_LOCAL_PORT=${new_port} em ${infra_env}"

    if [[ -f "$backend_env" ]]; then
        sed -i "s/^DB_PORT=.*/DB_PORT=${new_port}/" "$backend_env"
        sed -i "s|\(localhost:\)[0-9]\{1,5\}\(/\)|\1${new_port}\2|" "$backend_env"
        log_info "Atualizado DB_PORT=${new_port} e DB_URL em ${backend_env}"
    fi
}

# =============================================================================
# Start PostgreSQL
# =============================================================================

start_postgres() {
    log_step "Iniciando PostgreSQL..."

    local compose_file="$INFRA_DIR/docker-compose.yml"
    local env_file="$INFRA_DIR/.env"
    local env_example="$INFRA_DIR/.env.example"

    # Create .env from example if not exists
    if [[ ! -f "$env_file" ]]; then
        if [[ -f "$env_example" ]]; then
            cp "$env_example" "$env_file"
            log_info ".env criado a partir de .env.example"
        else
            log_error "Arquivo .env não encontrado e .env.example não disponível."
            exit 1
        fi
    fi

    # Read container name from .env
    local container_name
    container_name=$(grep -E "^CONTAINER_NAME=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    container_name="${container_name:-louvorflow_db}"

    # Check if our container is already running (identity-based, not port-based)
    if docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null | grep -q "true"; then
        log_info "Container PostgreSQL '${container_name}' já está rodando."
        return 0
    fi

    # Read configured port
    local pg_port
    pg_port=$(grep -E "^POSTGRES_LOCAL_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    pg_port="${pg_port:-35432}"

    # Check if port is occupied by another process
    if ss -tlnp 2>/dev/null | grep -q ":${pg_port} "; then
        log_warn "Porta ${pg_port} está em uso por outro processo."

        local new_port
        new_port=$(find_available_port "$((pg_port + 1))") || {
            log_error "Não foi possível encontrar uma porta disponível (tentou ${pg_port}–$((pg_port + 10)))."
            exit 1
        }

        log_warn "Usando porta alternativa: ${new_port}"
        update_port_in_env_files "$new_port"
        pg_port="$new_port"
    fi

    # Start container
    docker compose --env-file "$env_file" -f "$compose_file" up -d

    log_info "Container PostgreSQL iniciado na porta ${pg_port}."
}

# =============================================================================
# Health check PostgreSQL
# =============================================================================

healthcheck_postgres() {
    log_step "Aguardando PostgreSQL ficar pronto..."

    local env_file="$INFRA_DIR/.env"

    local container_name
    container_name=$(grep -E "^CONTAINER_NAME=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    container_name="${container_name:-louvorflow_db}"

    local db_user
    db_user=$(grep -E "^POSTGRES_USERNAME=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    db_user="${db_user:-admin}"

    local pg_port
    pg_port=$(grep -E "^POSTGRES_LOCAL_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    pg_port="${pg_port:-35432}"

    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if docker exec "$container_name" pg_isready -U "$db_user" &>/dev/null; then
            log_info "PostgreSQL pronto! (porta $pg_port)"
            return 0
        fi

        echo -ne "\r  Tentativa $attempt/$max_attempts..."
        sleep 1
        ((attempt++))
    done

    echo ""
    log_error "PostgreSQL não ficou pronto na porta $pg_port após ${max_attempts}s."
    exit 1
}

# =============================================================================
# Install dependencies
# =============================================================================

install_deps() {
    log_step "Verificando dependências..."

    if [[ -d "$DIR/node_modules" ]]; then
        log_info "Dependências já instaladas (node_modules existe)."
    else
        log_info "Instalando dependências (yarn install)..."
        (cd "$DIR" && yarn install)
        log_info "Dependências instaladas."
    fi
}

# =============================================================================
# Prisma generate
# =============================================================================

prisma_generate() {
    log_step "Gerando Prisma Client..."

    if [[ -f "$BACKEND_DIR/prisma/schema.prisma" ]]; then
        (cd "$BACKEND_DIR" && yarn prisma generate)
        log_info "Prisma Client gerado."
    fi
}

# =============================================================================
# Prisma migrate
# =============================================================================

prisma_migrate() {
    log_step "Aplicando migrations do Prisma..."

    if [[ -f "$BACKEND_DIR/prisma/schema.prisma" ]]; then
        (cd "$BACKEND_DIR" && yarn prisma migrate deploy)
        log_info "Migrations aplicadas."
    fi
}

# =============================================================================
# Seed admin
# =============================================================================

seed_admin() {
    log_step "Executando seed do admin..."

    if [[ -f "$BACKEND_DIR/seeds/admin.ts" ]]; then
        (cd "$BACKEND_DIR" && yarn tsx seeds/admin.ts)
        log_info "Seed do admin executado."
    else
        log_warn "Arquivo seeds/admin.ts não encontrado. Pulando seed."
    fi
}

# =============================================================================
# Kill stale processes on service ports
# =============================================================================

kill_stale_ports() {
    log_step "Verificando processos órfãos nas portas de serviço..."

    local ports=("$BACKEND_PORT" "$FRONTEND_PORT")

    for port in "${ports[@]}"; do
        local pid
        pid=$(ss -tlnp "sport = :$port" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1 || true)

        if [[ -n "$pid" ]]; then
            log_warn "Porta $port em uso pelo PID $pid — encerrando..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            log_info "Porta $port liberada."
        fi
    done
}

# =============================================================================
# Start services
# =============================================================================

start_services() {
    log_step "Iniciando serviços de desenvolvimento..."

    echo ""

    # Backend
    (cd "$BACKEND_DIR" && yarn dev 2>&1 | sed -u "s/^/$(echo -e "$PREFIX_BACK") /") &
    PIDS+=($!)

    # Frontend
    (cd "$FRONTEND_DIR" && yarn dev 2>&1 | sed -u "s/^/$(echo -e "$PREFIX_FRONT") /") &
    PIDS+=($!)
}

# =============================================================================
# Print summary
# =============================================================================

print_summary() {
    echo ""
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}  LouvorFlow - Development Mode${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo -e "  ${GREEN}Backend${NC}   → http://localhost:${BACKEND_PORT}  ${YELLOW}(v${BACKEND_VERSION})${NC}"
    echo -e "  ${BLUE}Frontend${NC}  → http://localhost:${FRONTEND_PORT}  ${YELLOW}(v${FRONTEND_VERSION})${NC}"
    echo ""
    echo -e "  Pressione ${YELLOW}Ctrl+C${NC} para encerrar todos os serviços"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    parse_args "$@"

    echo -e "${CYAN}"
    echo "  _                            _____ _"
    echo " | |    ___  _   ___   _____  |  ___| | _____      __"
    echo " | |   / _ \| | | \ \ / / _ \ | |_  | |/ _ \ \ /\ / /"
    echo " | |__| (_) | |_| |\ V / (_) ||  _| | | (_) \ V  V /"
    echo " |_____\___/ \__,_| \_/ \___/ |_|   |_|\___/ \_/\_/"
    echo -e "${NC}"
    echo -e "  ${YELLOW}Development Mode${NC}"
    echo ""

    if [[ "$WITH_DOCKER" == true ]]; then
        check_docker
        start_postgres
        healthcheck_postgres
    else
        log_info "Pulando Docker/PostgreSQL (--no-docker)"
    fi

    install_deps
    prisma_generate

    if [[ "$WITH_DOCKER" == true ]]; then
        prisma_migrate
    fi

    seed_admin
    kill_stale_ports
    print_summary
    start_services

    # Wait for all background processes
    wait
}

main "$@"
