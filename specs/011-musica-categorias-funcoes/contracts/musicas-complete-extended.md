# API Contract: Extensão dos Endpoints Completos de Música

**Feature**: 011-musica-categorias-funcoes
**Date**: 2026-02-22

## POST /api/musicas/complete (Estendido)

### Request

```json
{
  "nome": "Grande é o Senhor",
  "fk_tonalidade": "uuid-tonalidade",
  "artista_id": "uuid-artista",
  "bpm": 120,
  "cifras": "C  G  Am  F...",
  "lyrics": "Grande é o Senhor...",
  "link_versao": "https://youtube.com/watch?v=abc",
  "categoria_ids": ["uuid-cat-1", "uuid-cat-2"],
  "funcao_ids": ["uuid-func-1", "uuid-func-3"]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome da música |
| `fk_tonalidade` | UUID | Não | ID da tonalidade |
| `artista_id` | UUID | Não* | ID do artista para versão padrão |
| `bpm` | number | Não | BPM da versão |
| `cifras` | string | Não | Cifras da versão |
| `lyrics` | string | Não | Letra da versão |
| `link_versao` | string (URL) | Não | Link de referência da versão |
| `categoria_ids` | UUID[] | Não | IDs das categorias a associar (default: []) |
| `funcao_ids` | UUID[] | Não | IDs das funções requeridas a associar (default: []) |

*\*Obrigatório se qualquer campo de versão (bpm, cifras, lyrics, link_versao) for preenchido.*

### Response 201 (Success)

```json
{
  "msg": "Música criada com sucesso",
  "musica": {
    "id": "uuid-musica",
    "nome": "Grande é o Senhor",
    "tonalidade": { "id": "uuid-ton", "tom": "C" },
    "categorias": [
      { "id": "uuid-cat-1", "nome": "Adoração" },
      { "id": "uuid-cat-2", "nome": "Louvor" }
    ],
    "funcoes": [
      { "id": "uuid-func-1", "nome": "Violão" },
      { "id": "uuid-func-3", "nome": "Bateria" }
    ],
    "versoes": [
      {
        "versao_id": "uuid-versao",
        "artista": { "id": "uuid-artista", "nome": "Adhemar de Campos" },
        "bpm": 120,
        "cifras": "C  G  Am  F...",
        "lyrics": "Grande é o Senhor...",
        "link_versao": "https://youtube.com/watch?v=abc"
      }
    ]
  }
}
```

### Response 400 (Validation Error)

```json
{ "erro": "Nome da música é obrigatório", "codigo": 400 }
```

```json
{ "erro": "Artista é obrigatório para criar uma versão", "codigo": 400 }
```

### Response 404 (Entity Not Found)

```json
{ "erro": "Categoria não encontrada", "codigo": 404 }
```

```json
{ "erro": "Função não encontrada", "codigo": 404 }
```

---

## PUT /api/musicas/:id/complete (Estendido)

### Request

```json
{
  "nome": "Grande é o Senhor",
  "fk_tonalidade": "uuid-tonalidade",
  "versao_id": "uuid-versao",
  "bpm": 130,
  "cifras": "C  G  Am  F...",
  "lyrics": "Grande é o Senhor...",
  "link_versao": "https://youtube.com/watch?v=abc",
  "categoria_ids": ["uuid-cat-1", "uuid-cat-3"],
  "funcao_ids": ["uuid-func-2"]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome da música |
| `fk_tonalidade` | UUID | Não | ID da tonalidade |
| `versao_id` | UUID | Não | ID da versão a atualizar |
| `bpm` | number | Não | BPM da versão |
| `cifras` | string | Não | Cifras da versão |
| `lyrics` | string | Não | Letra da versão |
| `link_versao` | string (URL) | Não | Link de referência |
| `categoria_ids` | UUID[] | Não | IDs desejados — sincroniza (add/remove). Se ausente, mantém existentes. |
| `funcao_ids` | UUID[] | Não | IDs desejados — sincroniza (add/remove). Se ausente, mantém existentes. |

### Comportamento de Sincronização

- **`categoria_ids` presente**: O backend compara com associações existentes e faz diff (adiciona novos, remove ausentes).
- **`categoria_ids` ausente/undefined**: Nenhuma mudança nas associações de categorias.
- **`categoria_ids` = `[]`**: Remove todas as categorias associadas.
- Mesma lógica para `funcao_ids`.

### Response 200 (Success)

```json
{
  "msg": "Música editada com sucesso",
  "musica": {
    "id": "uuid-musica",
    "nome": "Grande é o Senhor",
    "tonalidade": { "id": "uuid-ton", "tom": "C" },
    "categorias": [
      { "id": "uuid-cat-1", "nome": "Adoração" },
      { "id": "uuid-cat-3", "nome": "Kids" }
    ],
    "funcoes": [
      { "id": "uuid-func-2", "nome": "Teclado" }
    ],
    "versoes": [ ... ]
  }
}
```

### Response 404

```json
{ "erro": "Música não encontrada", "codigo": 404 }
```

```json
{ "erro": "Categoria não encontrada", "codigo": 404 }
```

```json
{ "erro": "Função não encontrada", "codigo": 404 }
```
