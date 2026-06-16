# LouvorFlow — GitHub Actions Self-Hosted Runner

Runner dockerizado (`myoung34/github-runner`) que executa os jobs de deploy
(`runs-on: [self-hosted, <label>]`) dos workflows de CD. Replicar em cada servidor
(staging / production) variando apenas o `.env`.

| Item | Valor |
|------|-------|
| Imagem | `myoung34/github-runner:latest` (auto-update ligado — ver abaixo) |
| Credencial | `ACCESS_TOKEN` (PAT, escopo `repo`) — runner se auto-registra |
| Labels | `RUNNER_LABELS` (`staging` ou `production`) |
| Staging | servidor `192.168.0.6` (`louvorflow.chewiesoft.com`), compose em `/opt/louvorflow-runners/` |
| Config persistida | named volume `runner-config-louvorflow` (reuso de config ligado) |

## Bring-up

```bash
cp .env.example .env      # preencher ACCESS_TOKEN (PAT) e RUNNER_LABELS
docker compose up -d
docker compose logs -f    # esperado: "Listening for Jobs"
```

Confirmar registro no GitHub:

```bash
gh api /repos/j0ruge/LouvorFlow/actions/runners \
  --jq '.runners[] | {name, status, busy, labels: [.labels[].name]}'
# Esperado: status:online, labels inclui a RUNNER_LABELS
```

## Por que NÃO definimos `DISABLE_AUTO_UPDATE`

O compose **propositalmente não define** `DISABLE_AUTO_UPDATE`. O entrypoint do
`myoung34` trata **qualquer valor não-vazio** (até `"0"`) como "desligar o
auto-update". Sem a variável, o binário do runner se auto-atualiza quando o GitHub
exige — evitando o crashloop de versão deprecada (ver Modo de falha 2). Não pinar a
imagem por digest pelo mesmo motivo: o GitHub força currency de versão, e um digest
fixo congela o runner numa versão que será deprecada.

## Diagnóstico rápido

```bash
# Há runner registrado e online?
gh api /repos/j0ruge/LouvorFlow/actions/runners --jq '.runners[] | {name,status,busy}'
# total_count:0 ou status:offline + deploy "queued" → runner caído/crashloop.

# No host:
docker ps --filter name=louvorflow-runner --format '{{.Names}}\t{{.Status}}'
docker inspect louvorflow-runner --format 'RestartCount={{.RestartCount}}'   # alto = crashloop
docker logs --tail 40 louvorflow-runner
```

## Modos de falha conhecidos (e recovery)

### 1. Config stale → "registration has been deleted"

**Sintoma:** `RestartCount` alto + log `Failed to create a session. The runner
registration has been deleted from the server`. O GitHub apaga o registro de runners
offline por muito tempo; como o reuso de config está ligado, o entrypoint reaproveita
a credencial morta em vez de re-registrar.

**Recovery** (no host, em `/opt/louvorflow-runners`):

```bash
docker compose down
docker volume rm louvorflow-runners_runner-config-louvorflow   # apaga config stale
docker compose up -d                                           # re-registra fresco via PAT
```

### 2. Versão do runner deprecada → "cannot receive messages"

**Sintoma:** `RestartCount` alto + log `Runner version vX.Y.Z is deprecated and
cannot receive messages`. A imagem ficou stale (nunca re-puxada) e o GitHub passou a
recusar a versão antiga do binário.

**Recovery** (no host):

```bash
docker compose pull          # imagem fresca, binário de runner atual
docker compose up -d --force-recreate
docker logs --tail 10 louvorflow-runner   # confirmar "Listening for Jobs", sem "deprecated"
```

> Com auto-update ligado (este compose), o binário se atualiza sozinho em runtime e
> esse modo não deve recorrer. O `docker compose pull` periódico é cinto-e-suspensório.

### 3. Liberar deploy preso

O job `Deploy Staging`/`Deploy Production` em `queued` é **atribuído automaticamente**
assim que o runner volta a `online` — não precisa `gh run rerun`. Acompanhar:

```bash
gh run watch <run-id>
```

## Recomendação de hardening (pendente)

O `ACCESS_TOKEN` deve ser um **PAT dedicado** (clássico, escopo `repo`, ou fine-grained
1-repo com `Administration: R/W`). Um token OAuth do `gh auth token` (`gho_…`) acopla o
runner ao login do operador — re-autenticar/revogar o `gh` derruba o runner. `gh` não
cunha PAT; criar em `github.com/settings/tokens`.
