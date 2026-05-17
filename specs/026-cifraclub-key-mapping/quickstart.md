# Phase 1 — Quickstart: 026 CifraClub Key Mapping

**Branch**: `026-cifraclub-key-mapping` · **Date**: 2026-05-17

Roteiro de validação manual da feature. Divide-se em (1) smoke test pré-implementação e (2) cenário fim-a-fim pós-implementação.

---

## 1. Smoke test pré-implementação (validar hipótese H2)

**Quando**: ANTES de escrever qualquer código. Bloqueador para o restante das tasks.
**Quem**: dev responsável pela 026.
**Tempo estimado**: 30 minutos.
**Saída esperada**: confirmar ou refutar a tabela cromática absoluta da §3 de research.md.

### Cifras de teste (3 tons-base distintos)

| Música | URL | Tom catalogado pelo CifraClub |
|---|---|---|
| "Sublime" — Florianópolis House of Prayer | `https://www.cifraclub.com.br/florianopolis-house-of-prayer/sublime/` | D (confirmado via fetch) |
| "Rendido Estou" — Aline Barros | `https://www.cifraclub.com.br/aline-barros/rendido-estou/` | a confirmar (esperado G ou A) |
| "Bondade de Deus" — Isaías Saad | `https://www.cifraclub.com.br/isaias-saad/bondade-de-deus/` | a confirmar |

### Protocolo de teste

Para cada uma das 3 cifras, repetir para cada `N ∈ {0, 1, 5, 7, 11}` (5 valores):

1. Abrir a URL no navegador desktop com `#key=N` no final. Exemplo: `…/sublime/#key=5`.
2. Anotar qual tom o CifraClub exibe no header da cifra ("Tom: X").
3. Comparar com a tabela esperada (`N=0→A, N=1→Bb, N=5→D, N=7→E, N=11→Ab`).

### Resultado esperado (H2 confirmada)

| N | Tom esperado | Tom observado | OK? |
|---|---|---|---|
| 0 | A | | |
| 1 | Bb | | |
| 5 | D | | |
| 7 | E | | |
| 11 | Ab | | |

**Critério de aceite do smoke test**: para as 3 músicas × 5 valores = 15 observações, **todas** devem bater com a tabela. Se houver inconsistência, retornar para `/speckit.clarify` e reabrir Q1.

### Resultado alternativo (H1 detectada)

Se o tom exibido depender do tom-base catalogado de cada música (ex: para "Sublime" base=D, `#key=0` mostra D em vez de A), então H1 é a hipótese correta — abortar a implementação atual, voltar à spec e reabrir Q1.

---

## 2. Cenário fim-a-fim pós-implementação

**Quando**: após implementação completa (backend + frontend + tests).
**Quem**: dev + revisor (smoke test antes do merge).
**Tempo estimado**: 15 minutos.
**Saída esperada**: validar que o fluxo do líder ao músico funciona como na User Story 1 da spec.

### Pré-requisitos do ambiente

```powershell
# Banco + backend rodando
docker compose -f infra/postgres/docker-compose.yml up -d
cd packages/backend; npm run dev
# Em outro terminal, frontend
cd packages/frontend; npm run dev
```

### Dados de teste (criar via UI ou seed)

1. Tenant ativo, usuário admin logado.
2. Música "Sublime" cadastrada com `Musicas.fk_tonalidade` apontando para tonalidade `"A"`.
3. Versão (Artistas_Musicas) da Sublime com artista "Florianópolis House of Prayer" e `cifraclub_url = "https://www.cifraclub.com.br/florianopolis-house-of-prayer/sublime/"` (sem fragmento).
4. Escala criada com a Sublime na ordem 1.
5. Pelo menos 1 outra música SEM `cifraclub_url` cadastrada (para validar EC-3 da spec).

### Passo a passo

#### Passo 1 — Hit direto no endpoint (validar contrato JSON)

```powershell
$token = "<JWT_VALIDO>"
$eventoId = "<UUID_DA_ESCALA>"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/eventos/$eventoId/cifraclub-playlist" -Headers $headers | ConvertTo-Json -Depth 6
```

**Esperado**:

- Item da Sublime: `tom = "A"`, `cifraclub_url = ".../sublime/#key=0"`, `tom_final = "A"`, `tom_ajustado = true`.
- Item da outra música: `cifraclub_url = null`, `tom_ajustado = false`.
- `stats.com_link = 1`, `stats.sem_link = 1`.

#### Passo 2 — Verificar transposição

Mudar `Musicas.fk_tonalidade` da Sublime para uma tonalidade `"Bb"` (via UI ou SQL direto no `louvorflow_db`):

```sql
UPDATE musicas SET fk_tonalidade = (
  SELECT id FROM tonalidades WHERE tom = 'Bb' AND tenant_id = '<TENANT_ID>'
) WHERE nome = 'Sublime' AND tenant_id = '<TENANT_ID>';
```

Hit novamente o endpoint. **Esperado**: `cifraclub_url = ".../sublime/#key=1"`, `tom_final = "Bb"`.

#### Passo 3 — Verificar grafia canônica (Q4)

Mudar a tonalidade para uma com grafia "A#" (criar via UI). Hit novamente. **Esperado**: `tom_final = "Bb"` (canonicalizado), `cifraclub_url = ".../sublime/#key=1"`.

#### Passo 4 — Verificar query string preservada (Q2)

Atualizar `cifraclub_url` da versão para `"https://www.cifraclub.com.br/x/y/?utm=test#letras"`. Hit. **Esperado**: `cifraclub_url = "https://www.cifraclub.com.br/x/y/?utm=test#key=1"` (query mantida, fragmento substituído).

#### Passo 5 — Verificar URL malformada (resiliência)

Atualizar `cifraclub_url` para algo inválido como `"://broken-url"`. Hit. **Esperado**: response 200, URL devolvida sem alteração, `tom_ajustado = false`, **sem erro 500 nos logs**.

#### Passo 6 — UI

1. No frontend, abrir a escala em `http://localhost:5173/escalas/<id>`.
2. Clicar "CifraClub" no header.
3. Conferir badge `🎚 Bb` no item da Sublime.
4. Confirmar item sem URL mostra "Sem link CifraClub" (comportamento 025) E item com `tom_ajustado: false` mostra indicador "tom não ajustado".

#### Passo 7 — Compartilhamento WhatsApp

1. Clicar "WhatsApp" no diálogo.
2. Inspecionar a URL `wa.me/?text=…` ou abrir o WhatsApp.
3. Confirmar que os links na mensagem terminam com `#key=N`.
4. Tocar um link em um celular real (iOS e Android) — confirmar que o app CifraClub abre na cifra transposta (validação da User Story 3).

#### Passo 8 — Regressão da 025

1. Rodar `cd packages/backend; npm test` — todos os testes da 025 devem passar.
2. Rodar `cd packages/frontend; npm test` — idem.
3. Conferir que o diálogo da playlist mantém todo o comportamento anterior (cópia, stats, EC-1 a EC-10 da 025).

### Critério de aceite do cenário fim-a-fim

Todos os passos 1–8 devem passar. Se algum falhar, abrir issue, não mergear.

---

## 3. Rollback

Esta feature é puramente aditiva (sem migration, sem mudança de schema). Rollback = revert do commit. Sem ações de banco necessárias. Frontend defensivo: schemas Zod aceitam `tom_final` e `tom_ajustado` opcionais, então um backend sem a feature funcionará normalmente após rollback (clientes mostrarão apenas a 025).
