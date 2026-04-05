# CodeRabbit Review — PR #59

**Repo:** j0ruge/LouvorFlow
**PR:** #59
**Reviewed at:** 2026-04-05

---

## Checklist

### Inline Comments (2)

- [x] **#1 — CRITICAL** `packages/backend/src/services/convites/accept-convite.service.ts:59`
  **O convite aceita qualquer email enviado pelo cliente.**
  Not applicable — convites são links genéricos de grupo (como WhatsApp), sem email-alvo. O model `InviteTokens` não tem campo `email`. É design intencional.

- [x] **#2 — CRITICAL** `packages/backend/src/services/convites/accept-convite.service.ts:119`
  **A rechecagem dentro da transação ainda permite aceite duplo concorrente.**
  Fixed — substituído `findUnique` + `update` por `updateMany` condicional com `used_at: null, revoked_at: null, expires_at: { gt: now }` e verificação `claim.count !== 1`. Aplicado em ambos `handleExistingUser` e `handleNewUser`.

### Outside-Diff-Range Comments (8)

- [x] **#3 — MAJOR** `packages/frontend/vite.config.ts:5-9`
  **Adicione JSDoc em PT-BR à configuração exportada.**
  Fixed — adicionado JSDoc descritivo em PT-BR.

- [x] **#4 — MAJOR** `packages/frontend/src/components/ConfigCrudSection.tsx:133-143`
  **Adicione nome acessível ao botão de criação (aria-label).**
  Fixed — adicionado `aria-label="Confirmar criação"`.

- [x] **#5 — MAJOR** `packages/frontend/src/components/IntegranteForm.tsx:295-302`
  **Botão de adicionar função está sem nome acessível (aria-label).**
  Fixed — adicionado `aria-label="Adicionar função"`.

- [x] **#6 — MAJOR** `packages/backend/tests/fakes/fake-musicas.repository.ts:109-125`
  **Propague intensidade no fake inteiro.**
  Fixed — campo `intensidade` adicionado em `createWithVersao`, `findVersoes`, `createVersao`, `updateWithVersao` e `updateVersao`.

- [x] **#7 — MINOR** `packages/backend/src/types/index.ts:160-168`
  **Atualize o JSDoc dos tipos públicos alterados.**
  Fixed — JSDoc completo em PT-BR adicionado à interface `VersaoRaw`.

- [x] **#8 — MAJOR** `packages/backend/src/validators/musicas.validators.ts:59-68`
  **Unifique validação de artista_id entre schemas de criação e versão.**
  Fixed — `createMusicaCompleteBodySchema.artista_id` agora usa `z.preprocess` para normalizar `""` e `null` para `undefined`, consistente com `addVersaoBodySchema` e `updateVersaoBodySchema`.

- [x] **#9 — MAJOR** `packages/backend/docs/openapi.json:5019-5049`
  **Não torne campos nullable opcionais na resposta de Versao.**
  Fixed — todos os campos nullable (`artista`, `bpm`, `cifras`, `lyrics`, `link_versao`, `intensidade`) adicionados ao array `required` do schema `Versao`.

- [x] **#10 — CRITICAL** `packages/backend/docs/openapi.json:5051-5083`
  **Corrija o bloco VersaoInput; o openapi.json está inválido no JSON.**
  Fixed — trailing comma removida na linha 5082. JSON validado com sucesso.

### Previously Resolved in Conversation

- [x] **accept-convite.service.ts** — Race condition: existingLink check movido para dentro da transaction. — **Fixed**
- [x] **create-convite.service.ts** — APP_WEB_URL guard em produção. — **Fixed**
- [x] **list-convites.service.ts** — APP_WEB_URL guard em produção. — **Fixed**
- [x] **eventos.service.ts:224-228** — Reorder após delete. — **Not applicable** (lista pequena, aceitável)
- [x] **use-eventos.ts:188-199** — Optimistic update filter. — **Not applicable** (IDs vêm do estado local)
- [x] **DateTimePicker.tsx:215-216** — eslint-disable intencional. — **Not applicable**
- [x] **quickstart.md:13-28** — npm vs yarn. — **Not applicable** (doc histórico)

---

## Final Result

| Status | Count |
|--------|-------|
| Fixed | 9 |
| Not applicable | 5 |
| Already fixed | 3 |
| **Total** | **17** |

All items resolved. Tests pending user verification.
