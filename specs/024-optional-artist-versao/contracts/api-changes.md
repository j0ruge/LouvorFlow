# API Contract Changes: Artista Opcional em Versão

**Date**: 2026-04-04 | **Branch**: `024-optional-artist-versao`

## Endpoints Afetados

### POST `/api/musicas/:musicaId/versoes` — Criar versão

**Request body (antes)**:

```json
{
  "artista_id": "uuid (OBRIGATÓRIO)",
  "bpm": 120,
  "cifras": "Am G F C",
  "lyrics": "...",
  "link_versao": "https://...",
  "intensidade": "calma"
}
```

**Request body (depois)**:

```json
{
  "artista_id": "uuid | null | omitido (OPCIONAL)",
  "bpm": 120,
  "cifras": "Am G F C",
  "lyrics": "...",
  "link_versao": "https://...",
  "intensidade": "calma"
}
```

**Novos cenários de resposta**:

| Cenário | Status | Body |
|---------|--------|------|
| Criação sem artista (sucesso) | 201 | `{ "msg": "Versão adicionada com sucesso", "versao": { "artista": null, ... } }` |
| Duplicata sem artista | 409 | `{ "erro": "Registro duplicado", "codigo": 409 }` |

### POST `/api/musicas/complete` — Criar música completa

**Mudança**: Remove a restrição de que `artista_id` é obrigatório quando campos de versão (bpm, cifras, etc.) são preenchidos. Versão é criada com `artista: null` quando outros campos de versão estão presentes mas `artista_id` está ausente.

### PUT `/api/musicas/:musicaId/versoes/:versaoId` — Atualizar versão

**Mudança**: Para suportar FR-008 (adicionar artista a versão sem artista), o `updateVersaoBodySchema` aceita `artista_id` como campo opcional.

**Request body (depois)**:

```json
{
  "artista_id": "uuid (OPCIONAL — aceito apenas quando versão não tem artista)",
  "bpm": 120,
  "cifras": "Am G F C",
  "lyrics": "...",
  "link_versao": "https://...",
  "intensidade": "calma"
}
```

**Regra de negócio**: Se a versão já possui artista vinculado e `artista_id` é enviado no update, o service DEVE retornar 400 com mensagem "Não é permitido alterar artista já vinculado". Apenas versões com `artista_id = null` aceitam o campo no update.

### GET `/api/musicas/:musicaId/versoes` — Listar versões

**Mudança no response**: Campo `artista` passa de `{ id, nome }` (sempre presente) para `{ id, nome } | null`.

### GET `/api/musicas/:musicaId` e GET `/api/musicas` — Detalhe/Lista de músicas

**Mudança no response**: Dentro de `versoes[]`, campo `artista` passa a ser nullable.

## Backwards Compatibility

- **Breaking change**: Sim, para consumidores que assumem `versao.artista` como sempre presente. Porém, o único consumidor é o frontend do próprio projeto, que será atualizado simultaneamente.
- **Dados existentes**: Todas as versões existentes mantêm artista preenchido — nenhum dado muda.
