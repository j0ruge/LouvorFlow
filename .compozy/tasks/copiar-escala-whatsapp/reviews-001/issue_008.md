---
status: pending
file: packages/backend/src/services/eventos.service.ts
line: 218
severity: low
author: claude-code
provider_ref:
---

# Issue 008: Versão inexistente retorna 400 em vez de 404

## Review Comment

`validateVersao` lança `AppError 400` tanto para versão inexistente quanto para
versão pertencente a outra música:

```ts
// services/eventos.service.ts
private async validateVersao(artistas_musicas_id: string, musicaId: string) {
    const versao = await eventosRepository.findArtistaMusicaById(artistas_musicas_id);
    if (!versao) throw new AppError("Versão não encontrada", 400);
    if (versao.musica_id !== musicaId) throw new AppError("A versão informada não pertence a esta música", 400);
}
```

Pelo padrão REST adotado em todo o backend (eventos, integrantes, músicas etc.),
o "recurso não encontrado" retorna 404; 400 é reservado para erros de validação
de entrada. O TechSpec explicita isso:

> Errors: `404` if escala/song row missing, `400` if version belongs to another song

"Versão não encontrada" deveria ser 404. Só o segundo caso (versão pertence a
outra música) é 400, porque aí o request é logicamente válido mas semanticamente
errado.

### Sugestão de correção

```ts
private async validateVersao(artistas_musicas_id: string, musicaId: string) {
    const versao = await eventosRepository.findArtistaMusicaById(artistas_musicas_id);
    if (!versao) throw new AppError("Versão não encontrada", 404);
    if (versao.musica_id !== musicaId) throw new AppError("A versão informada não pertence a esta música", 400);
}
```

O teste `eventos.service.test.ts` "deve lançar AppError 400 quando versão não
existe no tenant ativo" precisará ser ajustado para esperar `statusCode: 404`.

## Triage

- Decision: `UNREVIEWED`
- Notes:
