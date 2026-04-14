---
status: pending
file: packages/backend/src/routes/eventos.routes.ts
line: 27
severity: medium
author: claude-code
provider_ref:
---

# Issue 004: addMusicaBodySchema definido mas nunca aplicado à rota POST

## Review Comment

O PR adiciona `addMusicaBodySchema` em `eventos.validators.ts` com validação Zod
completa para `musicas_id` (UUID obrigatório) e `artistas_musicas_id` (UUID
opcional, nullable):

```ts
// validators/eventos.validators.ts
export const addMusicaBodySchema = z.object({
    musicas_id: z.string().uuid('ID da música deve ser um UUID válido'),
    artistas_musicas_id: z.string().uuid('artistas_musicas_id deve ser um UUID válido').nullable().optional(),
});
```

Porém, a rota POST correspondente não aplica o schema:

```ts
// routes/eventos.routes.ts:27
router.post('/:eventoId/musicas', ensureAuthenticated, ensureTenantContext, can(['escalas.write']), eventosController.addMusica);
```

Resultado: o schema é código morto; a validação do novo campo
`artistas_musicas_id` depende apenas da checagem pontual do service
(`validateVersao` só roda se o valor for não-null). Um cliente pode enviar
`artistas_musicas_id: "not-a-uuid"` e a requisição só falhará ao bater no Prisma
com um erro de formato de UUID, não no formato padronizado `AppError`.

### Sugestão de correção

Importar e aplicar o schema na rota:

```ts
import { addIntegranteBodySchema, addMusicaBodySchema, reorderMusicasBodySchema, setMusicaVersaoBodySchema } from '../validators/eventos.validators.js';

router.post(
  '/:eventoId/musicas',
  ensureAuthenticated,
  ensureTenantContext,
  can(['escalas.write']),
  validateRequest({ body: addMusicaBodySchema }),
  eventosController.addMusica,
);
```

Se a intenção for não validar, remover o schema — mas o TechSpec explicitamente
diz "Same validation rules as the PATCH for the version field".

## Triage

- Decision: `UNREVIEWED`
- Notes:
