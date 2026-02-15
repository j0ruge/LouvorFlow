# API Contracts: Junction Table Endpoints

**Feature**: 001-schema-api-alignment
**Error format**: `{ errors: ["message1", "message2"] }`

All junction endpoints are nested under their parent entity.

---

## Versoes (artistas_musicas) — nested under Musicas

### GET /api/musicas/:musicaId/versoes
List all versions (artist arrangements) of a song.
**Response 200**: `[ { id, artista: { id, nome }, bpm, cifras, lyrics, link_versao } ]`

### POST /api/musicas/:musicaId/versoes
Add a version (artist arrangement) to a song.
**Body**: `{ artista_id: uuid, bpm?: int, cifras?: string, lyrics?: string, link_versao?: string }`
**Response 201**: `{ msg: "Versão adicionada com sucesso", versao: { id, artista: { id, nome }, bpm, cifras, lyrics, link_versao } }`
**Response 409**: `{ errors: ["Registro duplicado"] }`

### PUT /api/musicas/:musicaId/versoes/:versaoId
Update a specific version.
**Body**: `{ bpm?: int, cifras?: string, lyrics?: string, link_versao?: string }`
**Response 200**: `{ msg: "Versão editada com sucesso", versao: { id, artista: { id, nome }, bpm, cifras, lyrics, link_versao } }`

### DELETE /api/musicas/:musicaId/versoes/:versaoId
Remove a version from a song.
**Response 200**: `{ msg: "Versão removida com sucesso" }`
**Response 404**: `{ errors: ["Versão não encontrada"] }`

---

## Musicas_Tags — nested under Musicas

### GET /api/musicas/:musicaId/tags
List all tags for a song.
**Response 200**: `[ { id, nome } ]`

### POST /api/musicas/:musicaId/tags
Add a tag to a song.
**Body**: `{ tag_id: uuid }`
**Response 201**: `{ msg: "Tag adicionada com sucesso" }`
**Response 409**: `{ errors: ["Registro duplicado"] }`

### DELETE /api/musicas/:musicaId/tags/:tagId
Remove a tag from a song.
**Response 200**: `{ msg: "Tag removida com sucesso" }`
**Response 404**: `{ errors: ["Registro não encontrado"] }`

---

## Musicas_Funcoes — nested under Musicas

### GET /api/musicas/:musicaId/funcoes
List all functions needed for a song.
**Response 200**: `[ { id, nome } ]`

### POST /api/musicas/:musicaId/funcoes
Add a function requirement to a song.
**Body**: `{ funcao_id: uuid }`
**Response 201**: `{ msg: "Função adicionada com sucesso" }`
**Response 409**: `{ errors: ["Registro duplicado"] }`

### DELETE /api/musicas/:musicaId/funcoes/:funcaoId
Remove a function from a song.
**Response 200**: `{ msg: "Função removida com sucesso" }`

---

## Eventos_Musicas — nested under Eventos

### GET /api/eventos/:eventoId/musicas
List all songs in an event.
**Response 200**: `[ { id, nome, tonalidade: { id, tom } } ]`

### POST /api/eventos/:eventoId/musicas
Add a song to an event.
**Body**: `{ musicas_id: uuid }`
**Response 201**: `{ msg: "Música adicionada ao evento com sucesso" }`
**Response 409**: `{ errors: ["Registro duplicado"] }`

### DELETE /api/eventos/:eventoId/musicas/:musicaId
Remove a song from an event.
**Response 200**: `{ msg: "Música removida do evento com sucesso" }`

---

## Eventos_Integrantes — nested under Eventos

### GET /api/eventos/:eventoId/integrantes
List all members assigned to an event.
**Response 200**: `[ { id, nome, funcoes: [ { id, nome } ] } ]`

### POST /api/eventos/:eventoId/integrantes
Assign a member to an event.
**Body**: `{ musico_id: uuid }`
**Response 201**: `{ msg: "Integrante adicionado ao evento com sucesso" }`
**Response 409**: `{ errors: ["Registro duplicado"] }`

### DELETE /api/eventos/:eventoId/integrantes/:integranteId
Remove a member from an event.
**Response 200**: `{ msg: "Integrante removido do evento com sucesso" }`

---

## Integrantes_Funcoes — nested under Integrantes

### GET /api/integrantes/:integranteId/funcoes
List all functions/roles for a member.
**Response 200**: `[ { id, nome } ]`

### POST /api/integrantes/:integranteId/funcoes
Assign a function/role to a member.
**Body**: `{ funcao_id: uuid }`
**Response 201**: `{ msg: "Função adicionada ao integrante com sucesso" }`
**Response 409**: `{ errors: ["Registro duplicado"] }`

### DELETE /api/integrantes/:integranteId/funcoes/:funcaoId
Remove a function/role from a member.
**Response 200**: `{ msg: "Função removida do integrante com sucesso" }`
