# dev.ps1 — Levanta toda a infra de dev do LouvorFlow (Windows/PowerShell)
#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# 1. Cores e funcoes de log
# ---------------------------------------------------------------------------
$DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition

function Write-Info  { param([string]$Msg) Write-Host "[INFO]  $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "[WARN]  $Msg" -ForegroundColor Yellow }
function Write-Erro  { param([string]$Msg) Write-Host "[ERRO]  $Msg" -ForegroundColor Red }
function Write-Db    { param([string]$Msg) Write-Host "[DB]    $Msg" -ForegroundColor Cyan }
function Write-Back  { param([string]$Msg) Write-Host "[BACK]  $Msg" -ForegroundColor Green }
function Write-Front { param([string]$Msg) Write-Host "[FRONT] $Msg" -ForegroundColor Blue }

# ---------------------------------------------------------------------------
# 2. Verificar Docker daemon
# ---------------------------------------------------------------------------
$oldPref = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
docker info 2>$null | Out-Null
$dockerExit = $LASTEXITCODE
$ErrorActionPreference = $oldPref

if ($dockerExit -ne 0) {
    Write-Erro "Docker nao esta rodando. Inicie o Docker Desktop e tente novamente."
    exit 1
}
Write-Info "Docker esta rodando."

# ---------------------------------------------------------------------------
# 3. Verificar/subir container PostgreSQL
# ---------------------------------------------------------------------------
$ContainerName = "louvorflow_db"

$runningContainers = docker ps --format '{{.Names}}' 2>$null
if ($runningContainers -match "^$ContainerName$") {
    Write-Info "Container $ContainerName ja esta rodando. Pulando docker compose."
} else {
    Write-Warn "Container $ContainerName nao encontrado. Subindo com docker compose..."
    docker compose -f "$DIR\infra\postgres\docker-compose.yml" `
        --env-file "$DIR\infra\postgres\.env" up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Erro "Falha ao iniciar container com docker compose."
        exit 1
    }
    Write-Info "Container $ContainerName iniciado."
}

# ---------------------------------------------------------------------------
# 4. Health check do banco (pg_isready via docker exec, timeout 30s)
# ---------------------------------------------------------------------------
$envFile = Get-Content "$DIR\infra\postgres\.env" -ErrorAction Stop
$dbUserLine = $envFile | Where-Object { $_ -match '^POSTGRES_USERNAME=' }
$DbUser = ($dbUserLine -split '=', 2)[1]

$Timeout = 30
$Elapsed = 0

Write-Db "Aguardando PostgreSQL aceitar conexoes (timeout: ${Timeout}s)..."

while ($true) {
    docker exec $ContainerName pg_isready -U $DbUser 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { break }

    if ($Elapsed -ge $Timeout) {
        Write-Erro "PostgreSQL nao ficou pronto em ${Timeout}s. Verifique o container."
        exit 1
    }
    Start-Sleep -Seconds 1
    $Elapsed++
}

Write-Db "PostgreSQL pronto! (${Elapsed}s)"

# ---------------------------------------------------------------------------
# 5. Instalar dependencias (npm workspaces)
# ---------------------------------------------------------------------------
Write-Info "Instalando dependencias (npm install)..."
Push-Location $DIR
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }
} catch {
    Write-Erro "Falha ao instalar dependencias."
    exit 1
} finally {
    Pop-Location
}
Write-Info "Dependencias instaladas."

# ---------------------------------------------------------------------------
# 5.5. Matar processos Node orfaos que travam a DLL do Prisma (porta 3000)
# ---------------------------------------------------------------------------
$staleProcs = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
        Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    } |
    Where-Object { $_.ProcessName -eq 'node' }

if ($staleProcs) {
    Write-Warn "Processos Node orfaos detectados na porta 3000. Encerrando..."
    $staleProcs | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Info "  Processo node (PID $($_.Id)) encerrado."
    }
    Start-Sleep -Seconds 1
}

# ---------------------------------------------------------------------------
# 6. Prisma generate + migrate (backend)
# ---------------------------------------------------------------------------
Write-Info "Gerando Prisma Client e aplicando migrations..."
Push-Location "$DIR\packages\backend"
try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) { throw "prisma generate falhou" }
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy falhou" }
} catch {
    Write-Erro "Falha ao configurar Prisma (generate/migrate)."
    exit 1
} finally {
    Pop-Location
}
Write-Info "Prisma Client gerado e migrations aplicadas."

# ---------------------------------------------------------------------------
# 7. Admin seed (idempotente — seguro re-executar)
# ---------------------------------------------------------------------------
Write-Info "Executando seed do admin..."
Push-Location "$DIR\packages\backend"
try {
    npx tsx seeds/admin.ts
    if ($LASTEXITCODE -ne 0) { throw "admin seed falhou" }
} catch {
    Write-Erro "Falha ao executar seed do admin."
    exit 1
} finally {
    Pop-Location
}
Write-Info "Seed do admin executado."

# ---------------------------------------------------------------------------
# 8 & 9. Iniciar backend e frontend em paralelo
# ---------------------------------------------------------------------------
$backProc  = $null
$frontProc = $null

try {
    Write-Info "Iniciando backend (packages/backend)..."
    $backProc = Start-Process -NoNewWindow -PassThru `
        -FilePath "cmd.exe" `
        -ArgumentList "/c","npm run dev" `
        -WorkingDirectory "$DIR\packages\backend"

    Write-Info "Iniciando frontend (packages/frontend)..."
    $frontProc = Start-Process -NoNewWindow -PassThru `
        -FilePath "cmd.exe" `
        -ArgumentList "/c","npm run dev" `
        -WorkingDirectory "$DIR\packages\frontend"

    Write-Host ""
    Write-Info "========================================="
    Write-Info " LouvorFlow dev environment rodando!"
    Write-Info " Backend:  http://localhost:3000"
    Write-Info " Frontend: http://localhost:8080"
    Write-Info " Ctrl+C para encerrar"
    Write-Info "========================================="
    Write-Host ""

    # Aguarda ambos os processos (bloqueante)
    while (-not $backProc.HasExited -or -not $frontProc.HasExited) {
        Start-Sleep -Milliseconds 500
    }
} finally {
    # ---------------------------------------------------------------------------
    # 10. Cleanup — encerrar processos filhos
    # ---------------------------------------------------------------------------
    Write-Host ""
    Write-Warn "Encerrando processos..."

    if ($backProc -and -not $backProc.HasExited) {
        Stop-Process -Id $backProc.Id -Force -ErrorAction SilentlyContinue
        # Encerrar arvore de processos filhos (npm spawna node)
        Get-CimInstance Win32_Process |
            Where-Object { $_.ParentProcessId -eq $backProc.Id } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Info "Backend encerrado."
    }

    if ($frontProc -and -not $frontProc.HasExited) {
        Stop-Process -Id $frontProc.Id -Force -ErrorAction SilentlyContinue
        # Encerrar arvore de processos filhos
        Get-CimInstance Win32_Process |
            Where-Object { $_.ParentProcessId -eq $frontProc.Id } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Info "Frontend encerrado."
    }

    Write-Info "Todos os processos encerrados. Container $ContainerName continua rodando."
}
