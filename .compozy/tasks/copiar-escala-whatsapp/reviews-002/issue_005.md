---
status: resolved
file: packages/backend/src/services/eventos.service.ts
line: 233
severity: low
author: claude-code
provider_ref:
---

# Issue 005: handleVersaoSentinel `context` parameter is dead code

## Review Comment

The sentinel-error handler introduced by review-001 takes a `context`
parameter that it never reads:

```ts
/**
 * Converte erros sentinela lançados pelo repositório (dentro das transações atômicas)
 * para `AppError` com o statusCode correto.
 *
 * @param error - Erro capturado de uma operação atômica
 * @param context - "add" para mensagens do addMusica, "set" para setMusicaVersao
 * @throws {AppError} Sempre — re-lança o erro convertido ou propaga desconhecidos
 */
private handleVersaoSentinel(error: unknown, context: 'add' | 'set'): never {
    if (error instanceof Error) {
        if (error.message === 'VERSAO_NOT_FOUND') {
            throw new AppError('Versão não encontrada', 404);
        }
        if (error.message === 'VERSAO_WRONG_MUSICA') {
            throw new AppError('A versão informada não pertence a esta música', 400);
        }
    }
    // ...
}
```

Both call sites (`addMusica` and `setMusicaVersao`) pass their context
literal:

```ts
} catch (error) {
  this.handleVersaoSentinel(error, 'add');
}
```

…but the function body branches only on `error.message`, not on `context`.
The parameter was presumably intended for future message customization
(e.g., "Versão não encontrada ao adicionar música" vs "Versão não
encontrada ao atualizar música") and never got wired. It is now misleading
dead code: a reader sees the JSDoc promising context-sensitive behavior
and expects to find it somewhere.

### Sugestão de correção

Pick one:

1. **Remove the parameter.** Smaller diff, honest surface:

   ```ts
   private handleVersaoSentinel(error: unknown): never { /* ... */ }

   // Call sites:
   this.handleVersaoSentinel(error);
   ```

2. **Wire it up properly** if the distinct messages are actually desired:

   ```ts
   const suffix = context === 'add' ? ' ao adicionar música' : '';
   throw new AppError(`Versão não encontrada${suffix}`, 404);
   ```

Option 1 is the minimal-change correct answer unless product or PRD text
calls for the differentiated messages.

## Triage

- Decision: `valid`
- Notes: Confirmed. The `context` parameter (type `'add' | 'set'`) at line 242 is never read — the function branches only on `error.message`. No PRD or spec calls for differentiated messages. Applying option 1: remove the parameter and update call sites + JSDoc.
