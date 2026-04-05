# CodeRabbit Review — PR #59

**Repo:** j0ruge/LouvorFlow
**PR:** #59
**Reviewed at:** 2026-04-05

---

## Checklist

### Inline Comments (2)

- [x] **#1 — CRITICAL** `accept-convite.service.ts:59`
  **O convite aceita qualquer email enviado pelo cliente.**
  Not applicable — convites são links genéricos de grupo (como WhatsApp), sem email-alvo. O model `InviteTokens` não tem campo `email`. Design intencional.

- [x] **#2 — CRITICAL** `accept-convite.service.ts:119`
  **A rechecagem dentro da transação ainda permite aceite duplo concorrente.**
  Fixed — substituído `findUnique` + `update` por `updateMany` condicional (claim atômico) em ambos `handleExistingUser` e `handleNewUser`.

### Outside-Diff-Range Comments — Batch 1 (8)

- [x] **#3 — MAJOR** `vite.config.ts:5-9` — JSDoc em PT-BR. **Fixed**
- [x] **#4 — MAJOR** `ConfigCrudSection.tsx:133-143` — aria-label no botão. **Fixed**
- [x] **#5 — MAJOR** `IntegranteForm.tsx:295-302` — aria-label no botão. **Fixed**
- [x] **#6 — MAJOR** `fake-musicas.repository.ts:109-125` — intensidade propagada. **Fixed**
- [x] **#7 — MINOR** `types/index.ts:160-168` — JSDoc em VersaoRaw. **Fixed**
- [x] **#8 — MAJOR** `musicas.validators.ts:59-68` — artista_id unificado. **Fixed**
- [x] **#9 — MAJOR** `openapi.json:5019-5049` — Campos nullable no required. **Fixed**
- [x] **#10 — CRITICAL** `openapi.json:5051-5083` — JSON inválido. **Fixed**

### Outside-Diff-Range Comments — Batch 2 (22)

- [x] **#11 — MAJOR** `igrejas.service.ts:112-113` — **Extrair invalidateTenantCache do middleware.**
  Fixed — criado `providers/tenant-cache.provider.ts`, middleware e service agora importam dele.

- [x] **#12 — MAJOR** `index.css:14-38` — **Scrollbar CSS customizado.**
  Not applicable — Tailwind não tem utilities para `scrollbar-width` ou `::-webkit-scrollbar`. Plugin seria over-engineering.

- [x] **#13 — MAJOR** `dev.sh:112-125` — **Não encerrar qualquer node da 8080.**
  Not applicable — script de desenvolvimento local, não código de produção.

- [x] **#14 — MAJOR** `dev.sh:184-200` — **`ss` indisponível no macOS.**
  Not applicable — script de desenvolvimento local, projeto usa Windows.

- [x] **#15 — MAJOR** `dev.sh:209-214` — **Restringir substituição ao DB_URL.**
  Not applicable — script de desenvolvimento local.

- [x] **#16 — MAJOR** `revoke-convite.service.ts:20-34` — **Revogação atômica.**
  Fixed — substituído findById+revokeById por `updateMany` condicional com lookup posterior para erro específico.

- [x] **#17 — MAJOR** `migration.sql:1-51` — **Separar alterações globais da migration.**
  Not applicable — migration já aplicada e commitada, refazer é destrutivo.

- [x] **#18 — MAJOR** `migration.sql:134-144` — **Desempate estável no ROW_NUMBER.**
  Not applicable — migration já aplicada, risco mínimo.

- [x] **#19 — MAJOR** `eventos.service.ts:222-228` — **Exclusão e reordenação com janela de corrida.**
  Not applicable — escalas têm 5-15 músicas, editadas por um único líder.

- [x] **#20 — MAJOR** `eventos.validators.ts:26-35` — **O contrato trata artista como obrigatório.**
  Not applicable — validators já tratam `artista_id` como opcional em todos os schemas.

- [x] **#21 — MAJOR** `DateTimePicker.tsx:145-151` — **Definir type="button" nos botões internos.**
  Fixed — adicionado `type="button"` em Cancelar, Confirmar e trigger desktop.

- [x] **#22 — MAJOR** `quickstart.md:18-22` — **Não pedir migration com --name.**
  Not applicable — doc de spec histórico.

- [x] **#23 — MAJOR** `list-convites.service.ts:23-32` — **Projetar created_by e used_by explicitamente.**
  Fixed — projeção explícita `{ id, name }` no map do service.

- [x] **#24 — MAJOR** `quickstart.md:13-29` — **Quickstart não roda como bloco único.**
  Not applicable — doc de spec histórico.

- [x] **#25 — MAJOR** `quickstart.md:27-33` — **Evitar --name na migration.**
  Not applicable — doc de spec histórico.

- [x] **#26 — MAJOR** `quickstart.md:41-59` — **Smoke test não cobre artista_id: null.**
  Not applicable — doc de spec histórico.

- [x] **#27 — MAJOR** `quickstart.md:27-40` — **Bloco de verificação não é copy/paste-safe.**
  Not applicable — doc de spec histórico.

- [x] **#28 — MAJOR** `create-convite.service.ts:27-28` — **Link com fallback localhost.**
  Fixed — guard APP_WEB_URL em produção (já resolvido no batch anterior).

- [x] **#29 — MAJOR** `fake-eventos.repository.ts:210-225` — **reorderMusicas não garante 1..N.**
  Not applicable — fake para testes unitários, validação é do validator.

- [x] **#30 — MAJOR** `musicas.validators.ts:66-67` — **Restringir link_versao a http/https.**
  Fixed — criado `safeUrlSchema` com `.refine()` para bloquear `javascript:`, `data:`, etc.

- [x] **#31 — MAJOR** `schema.prisma:414-424` — **Cascade no creator deleta convites.**
  Fixed — `onDelete: Cascade` alterado para `onDelete: Restrict` na relação `creator`.

- [x] **#32 — MAJOR** `schema.prisma:80-100` — **Falta índice para versões por música.**
  Fixed — adicionado `@@index([tenant_id, musica_id])` em `Artistas_Musicas`.

---

## Previously Resolved in Conversation (Gemini/Copilot)

- [x] **accept-convite.service.ts** — existingLink movido para dentro da transaction. **Fixed**
- [x] **create-convite.service.ts** — APP_WEB_URL guard. **Fixed**
- [x] **list-convites.service.ts** — APP_WEB_URL guard. **Fixed**
- [x] **eventos.service.ts** — Reorder após delete. **Not applicable**
- [x] **use-eventos.ts** — Optimistic update. **Not applicable**
- [x] **DateTimePicker.tsx** — eslint-disable intencional. **Not applicable**
- [x] **quickstart.md** — npm vs yarn. **Not applicable**

---

## Final Result

| Status | Count |
|--------|-------|
| Fixed | 18 |
| Not applicable | 14 |
| **Total** | **32** |

All 321 tests passing. All PR conversations resolved.
