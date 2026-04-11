---
status: pending
file: packages/backend/src/routes/eventos.routes.ts
line: 29
severity: medium
author: claude-code
provider_ref:
---

# Issue 005: PATCH setMusicaVersao não valida params de rota como UUID

## Review Comment

A nova rota PATCH valida o body com Zod, mas não valida `eventoId` nem `musicaId`
como UUID:

```ts
// routes/eventos.routes.ts:29
router.patch(
  '/:eventoId/musicas/:musicaId',
  ensureAuthenticated,
  ensureTenantContext,
  can(['escalas.write']),
  validateRequest({ body: setMusicaVersaoBodySchema }),
  eventosController.setMusicaVersao,
);
```

Consequência: um request `PATCH /api/eventos/foo/musicas/bar` com body válido
chega ao service, que chama `eventosRepository.findByIdSimple('foo')`. Prisma
dispara um erro inesperado sobre formato de UUID inválido, que escapa do
`AppError` padronizado e vira 500 no error handler (ou 400 com mensagem obscura,
dependendo do tratamento). Isso foge do contrato de erros do backend
(`{ erro, codigo }`).

### Sugestão de correção

Adicionar um schema de params e validar:

```ts
// validators/eventos.validators.ts
export const eventoMusicaParamsSchema = z.object({
  eventoId: z.string().uuid('eventoId deve ser um UUID válido'),
  musicaId: z.string().uuid('musicaId deve ser um UUID válido'),
});

// routes/eventos.routes.ts
router.patch(
  '/:eventoId/musicas/:musicaId',
  ensureAuthenticated,
  ensureTenantContext,
  can(['escalas.write']),
  validateRequest({ params: eventoMusicaParamsSchema, body: setMusicaVersaoBodySchema }),
  eventosController.setMusicaVersao,
);
```

O mesmo schema de params deve ser reaplicado em `DELETE /:eventoId/musicas/:musicaId`
para consistência.

## Triage

- Decision: `UNREVIEWED`
- Notes:
