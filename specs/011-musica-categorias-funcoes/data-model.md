# Data Model: Categorias e Funções Requeridas no Formulário de Música

**Feature**: 011-musica-categorias-funcoes
**Date**: 2026-02-22

## Entidades Existentes (Sem Mudança de Schema)

O schema Prisma já contém todas as entidades e relações necessárias. **Não há migração de banco de dados.**

### Categorias

```text
categorias
├── id          UUID (PK, uuid_generate_v4())
├── nome        STRING (UNIQUE: categorias_nome_unico)
├── created_at  DATETIME (default: now())
└── updated_at  DATETIME (auto-updated)
```

### Funcoes

```text
funcoes
├── id          UUID (PK, uuid_generate_v4())
├── nome        STRING (UNIQUE: funcoes_nome_unico)
├── created_at  DATETIME (default: now())
└── updated_at  DATETIME (auto-updated)
```

### Musicas_Categorias (Junction)

```text
musicas_categorias
├── id            UUID (PK)
├── musica_id     UUID (FK → musicas.id, ON DELETE CASCADE)
├── categoria_id  UUID (FK → categorias.id, ON DELETE CASCADE)
├── created_at    DATETIME
├── updated_at    DATETIME
└── UNIQUE(musica_id, categoria_id)
```

### Musicas_Funcoes (Junction)

```text
musicas_funcoes
├── id          UUID (PK)
├── musica_id   UUID (FK → musicas.id, ON DELETE CASCADE)
├── funcao_id   UUID (FK → funcoes.id, ON DELETE CASCADE)
├── created_at  DATETIME
├── updated_at  DATETIME
└── UNIQUE(musica_id, funcao_id)
```

## Mudanças no Payload da API

### CreateMusicaComplete — Campos Adicionais

```text
POST /api/musicas/complete

Campos existentes:
├── nome           STRING (obrigatório)
├── fk_tonalidade  UUID (opcional)
├── artista_id     UUID (opcional)
├── bpm            NUMBER (opcional)
├── cifras         STRING (opcional)
├── lyrics         STRING (opcional)
└── link_versao    STRING (opcional)

Campos novos:
├── categoria_ids  UUID[] (opcional, default: [])
└── funcao_ids     UUID[] (opcional, default: [])
```

### UpdateMusicaComplete — Campos Adicionais

```text
PUT /api/musicas/:id/complete

Campos existentes:
├── nome           STRING (obrigatório)
├── fk_tonalidade  UUID (opcional)
├── versao_id      UUID (opcional)
├── bpm            NUMBER (opcional)
├── cifras         STRING (opcional)
├── lyrics         STRING (opcional)
└── link_versao    STRING (opcional)

Campos novos:
├── categoria_ids  UUID[] (opcional — se presente, sincroniza associações)
└── funcao_ids     UUID[] (opcional — se presente, sincroniza associações)
```

### Resposta — MusicaSchema (já inclui categorias/funcoes)

O `formatMusica()` do backend já mapeia `Musicas_Categorias` e `Musicas_Funcoes` na resposta. O `MusicaSchema` do frontend já define `categorias: z.array(IdNomeSchema)` e `funcoes: z.array(IdNomeSchema)`. **Sem mudança na resposta.**

## Regras de Validação

| Campo | Regra | Comportamento em caso de violação |
|-------|-------|----------------------------------|
| `categoria_ids` | Cada ID deve referenciar uma categoria existente | AppError 404: "Categoria não encontrada" |
| `categoria_ids` | IDs duplicados no array são ignorados (deduplicated) | Silenciosamente remove duplicatas |
| `funcao_ids` | Cada ID deve referenciar uma função existente | AppError 404: "Função não encontrada" |
| `funcao_ids` | IDs duplicados no array são ignorados (deduplicated) | Silenciosamente remove duplicatas |
| `categoria_ids` (update) | Array vazio = remover todas as categorias | Deleta todas as junções existentes |
| `funcao_ids` (update) | Array vazio = remover todas as funções | Deleta todas as junções existentes |
| `categoria_ids` (update) | Campo ausente/undefined = não modificar | Mantém associações existentes |
| `funcao_ids` (update) | Campo ausente/undefined = não modificar | Mantém associações existentes |

## Fluxo de Sincronização (Update)

```text
Input: categoria_ids = ["id-A", "id-C"]
Existente no banco: ["id-A", "id-B"]

1. Calcular diff:
   - Manter: ["id-A"] (interseção)
   - Adicionar: ["id-C"] (novos - existentes)
   - Remover: ["id-B"] (existentes - novos)

2. Executar em transação Prisma:
   - DELETE FROM musicas_categorias WHERE musica_id = ? AND categoria_id IN ("id-B")
   - INSERT INTO musicas_categorias (musica_id, categoria_id) VALUES (?, "id-C")
```
