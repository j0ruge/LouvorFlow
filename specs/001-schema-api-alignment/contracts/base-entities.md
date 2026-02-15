# API Contracts: Base Entities

**Feature**: 001-schema-api-alignment
**Base URL**: `/api`
**Error format**: `{ errors: ["message1", "message2"] }`
**Datetime format**: All `datetime` fields use **ISO 8601** (`YYYY-MM-DDTHH:mm:ssZ`, e.g. `"2026-02-14T10:00:00Z"`)

---

## Artistas `/api/artistas`

### GET /api/artistas

**Response 200**: `[ { id, nome } ]`

### GET /api/artistas/:id

**Response 200**: `{ id, nome, musicas: [ { id, musica_id, musica_nome, bpm, cifras, lyrics, link_versao } ] }`
**Response 404**: `{ errors: ["O artista não foi encontrado ou não existe"] }`

### POST /api/artistas

**Body**: `{ nome: string }`
**Response 201**: `{ msg: "Artista criado com sucesso", artista: { id, nome } }`
**Response 400**: `{ errors: ["Nome do artista é obrigatório"] }`
**Response 409**: `{ errors: ["Já existe um artista com esse nome"] }`

### PUT /api/artistas/:id

**Body**: `{ nome: string }`
**Response 200**: `{ msg: "Artista editado com sucesso", artista: { id, nome } }`
**Response 404**: `{ errors: ["Artista com esse ID não existe ou não foi encontrado"] }`

### DELETE /api/artistas/:id

**Response 200**: `{ msg: "Artista deletado com sucesso", artista: { id, nome } }`
**Response 404**: `{ errors: ["O artista não foi encontrado ou não existe"] }`

---

## Musicas `/api/musicas`

### GET /api/musicas

**Query Parameters**:

- `page` (number, optional, default=1): Page number for pagination
- `limit` (number, optional, default=20, max=100): Number of items per page
- `include` (string, optional): Comma-separated list of relations to include. Available: `tonalidade`, `tags`, `versoes`, `funcoes`
  - Example: `include=tonalidade,tags` returns only tonalidade and tags relations
  - Omitting `include` returns all relations by default

**Response 200 (Paginated)**:

```json
{
  "items": [
    {
      "id": "uuid",
      "nome": "Nome da Música",
      "tonalidade": { "id": "uuid", "tom": "C" },
      "tags": [ { "id": "uuid", "nome": "Adoração" } ],
      "versoes": [ { "id": "uuid", "artista": { "id": "uuid", "nome": "Artista" }, "bpm": 120, "cifras": "...", "lyrics": "...", "link_versao": "url" } ],
      "funcoes": [ { "id": "uuid", "nome": "Vocal" } ]
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

**Note**: Relations not specified in `include` will be omitted from the response. Use `include` to request only needed data and reduce payload size.

### GET /api/musicas/:id

**Response 200**: `{ id, nome, tonalidade: { id, tom }, tags: [ { id, nome } ], versoes: [ { id, artista: { id, nome }, bpm, cifras, lyrics, link_versao } ], funcoes: [ { id, nome } ] }`
**Response 404**: `{ errors: ["A música não foi encontrada ou não existe"] }`

### POST /api/musicas

**Body**: `{ nome: string, fk_tonalidade: uuid }`
**Response 201**: `{ msg: "Música criada com sucesso", musica: { id, nome, tonalidade: { id, tom } } }`
**Response 400**: `{ errors: ["Nome da música é obrigatório", "Tonalidade é obrigatória"] }`

### PUT /api/musicas/:id

**Body**: `{ nome?: string, fk_tonalidade?: uuid }`
**Response 200**: `{ msg: "Música editada com sucesso", musica: { id, nome, tonalidade: { id, tom } } }`
**Response 404**: `{ errors: ["A música não foi encontrada ou não existe"] }`

### DELETE /api/musicas/:id

**Response 200**: `{ msg: "Música deletada com sucesso", musica: { id, nome } }`
**Response 404**: `{ errors: ["A música não foi encontrada ou não existe"] }`

---

## Integrantes `/api/integrantes`

### GET /api/integrantes

**Response 200**: `[ { id, nome, doc_id, email, telefone, funcoes: [ { id, nome } ] } ]`
**Note**: `senha` is NEVER included in any response.

### GET /api/integrantes/:id

**Response 200**: `{ id, nome, doc_id, email, telefone, funcoes: [ { id, nome } ] }`

### POST /api/integrantes

**Body**: `{ nome: string, doc_id: string, email: string, senha: string, telefone?: string }`
**Response 201**: `{ msg: "Integrante criado com sucesso", integrante: { id, nome, doc_id, email, telefone } }`
**Response 400**: `{ errors: ["Dados não enviados"] }`
**Response 409**: `{ errors: ["Já existe um integrante com esse doc_id"] }`

### PUT /api/integrantes/:id

**Body**: `{ nome?: string, doc_id?: string, email?: string, senha?: string, telefone?: string }`
**Response 200**: `{ msg: "Integrante editado com sucesso", integrante: { id, nome, doc_id, email, telefone } }`

### DELETE /api/integrantes/:id

**Response 200**: `{ msg: "Integrante deletado com sucesso", integrante: { id, nome, doc_id, email, telefone } }`

---

## Funcoes `/api/funcoes`

### GET /api/funcoes

**Response 200**: `[ { id, nome } ]`

### GET /api/funcoes/:id

**Response 200**: `{ id, nome }`
**Response 404**: `{ errors: ["A função não foi encontrada ou não existe"] }`

### POST /api/funcoes

**Body**: `{ nome: string }`
**Response 201**: `{ msg: "Função criada com sucesso", funcao: { id, nome } }`
**Response 409**: `{ errors: ["Já existe uma função com esse nome"] }`

### PUT /api/funcoes/:id

**Body**: `{ nome: string }`
**Response 200**: `{ msg: "Função editada com sucesso", funcao: { id, nome } }`

### DELETE /api/funcoes/:id

**Response 200**: `{ msg: "Função deletada com sucesso", funcao: { id, nome } }`

---

## Tags `/api/tags`

### GET /api/tags

**Response 200**: `[ { id, nome } ]`

### GET /api/tags/:id

**Response 200**: `{ id, nome }`
**Response 404**: `{ errors: ["A tag não foi encontrada ou não existe"] }`

### POST /api/tags

**Body**: `{ nome: string }`
**Response 201**: `{ msg: "Tag criada com sucesso", tag: { id, nome } }`
**Response 409**: `{ errors: ["Já existe uma tag com esse nome"] }`

### PUT /api/tags/:id

**Body**: `{ nome: string }`
**Response 200**: `{ msg: "Tag editada com sucesso", tag: { id, nome } }`

### DELETE /api/tags/:id

**Response 200**: `{ msg: "Tag deletada com sucesso", tag: { id, nome } }`

---

## Tonalidades `/api/tonalidades`

### GET /api/tonalidades

**Response 200**: `[ { id, tom } ]`

### GET /api/tonalidades/:id

**Response 200**: `{ id, tom }`
**Response 404**: `{ errors: ["A tonalidade não foi encontrada ou não existe"] }`

### POST /api/tonalidades

**Body**: `{ tom: string }`
**Response 201**: `{ msg: "Tonalidade criada com sucesso", tonalidade: { id, tom } }`
**Response 409**: `{ errors: ["Já existe uma tonalidade com esse tom"] }`

### PUT /api/tonalidades/:id

**Body**: `{ tom: string }`
**Response 200**: `{ msg: "Tonalidade editada com sucesso", tonalidade: { id, tom } }`

### DELETE /api/tonalidades/:id

**Response 200**: `{ msg: "Tonalidade deletada com sucesso", tonalidade: { id, tom } }`

---

## Tipos_Eventos `/api/tipos-eventos`

### GET /api/tipos-eventos

**Response 200**: `[ { id, nome } ]`

### GET /api/tipos-eventos/:id

**Response 200**: `{ id, nome }`
**Response 404**: `{ errors: ["O tipo de evento não foi encontrado ou não existe"] }`

### POST /api/tipos-eventos

**Body**: `{ nome: string }`
**Response 201**: `{ msg: "Tipo de evento criado com sucesso", tipoEvento: { id, nome } }`
**Response 409**: `{ errors: ["Já existe um tipo de evento com esse nome"] }`

### PUT /api/tipos-eventos/:id

**Body**: `{ nome: string }`
**Response 200**: `{ msg: "Tipo de evento editado com sucesso", tipoEvento: { id, nome } }`

### DELETE /api/tipos-eventos/:id

**Response 200**: `{ msg: "Tipo de evento deletado com sucesso", tipoEvento: { id, nome } }`

---

## Eventos `/api/eventos`

### GET /api/eventos

**Response 200**: `[ { id, data, descricao, tipoEvento: { id, nome }, musicas: [ { id, nome } ], integrantes: [ { id, nome } ] } ]`

### GET /api/eventos/:id

**Response 200**: `{ id, data, descricao, tipoEvento: { id, nome }, musicas: [ { id, nome, tonalidade: { id, tom } } ], integrantes: [ { id, nome, funcoes: [ { id, nome } ] } ] }`
**Response 404**: `{ errors: ["O evento não foi encontrado ou não existe"] }`

### POST /api/eventos

**Body**: `{ data: datetime (ISO 8601, e.g. "2026-02-14T10:00:00Z"), fk_tipo_evento: uuid, descricao: string }`
**Response 201**: `{ msg: "Evento criado com sucesso", evento: { id, data, descricao, tipoEvento: { id, nome } } }`

### PUT /api/eventos/:id

**Body**: `{ data?: datetime (ISO 8601, e.g. "2026-02-14T10:00:00Z"), fk_tipo_evento?: uuid, descricao?: string }`
**Response 200**: `{ msg: "Evento editado com sucesso", evento: { id, data, descricao, tipoEvento: { id, nome } } }`

### DELETE /api/eventos/:id

**Response 200**: `{ msg: "Evento deletado com sucesso", evento: { id, data, descricao } }`
