# Data Model: Artista Opcional em Versão de Música

**Date**: 2026-04-04 | **Branch**: `024-optional-artist-versao`

## Entities Affected

### Artistas_Musicas (Versão)

Única entidade alterada. Artistas e Musicas permanecem inalteradas.

| Campo | Tipo Antes | Tipo Depois | Mudança |
|-------|-----------|-------------|---------|
| `artista_id` | `String @db.Uuid` (NOT NULL) | `String? @db.Uuid` (NULLABLE) | Relaxamento de constraint |
| Relação `artistas_musicas_artista_id_fkey` | `Artistas` (obrigatória) | `Artistas?` (opcional) | Relação torna-se opcional |

### Constraints

| Constraint | Antes | Depois |
|-----------|-------|--------|
| `@@unique([tenant_id, artista_id, musica_id])` | Full unique index | Removido do schema Prisma |
| Partial unique index | N/A | `UNIQUE(tenant_id, artista_id, musica_id) WHERE artista_id IS NOT NULL` |
| Max 1 null-artist per music | N/A | Guard no service layer (não no banco) |

### Validation Rules

| Campo | Regra Antes | Regra Depois |
|-------|------------|--------------|
| `artista_id` (create versão) | Obrigatório (Zod + Service) | Opcional (Zod preprocess empty→undefined, Service aceita null) |
| `artista_id` (update versão) | Não editável | Editável apenas quando versão não tem artista (null → artista) |
| `artista_id` (create música completa) | Opcional no Zod, mas superRefine exige quando versão tem campos | Opcional sem restrição — versão criada mesmo sem artista |

### State Transitions

```text
Versão sem artista (artista_id = null)
  └── Edição: adicionar artista → Versão com artista (artista_id = UUID)
        └── (irreversível — não permite remover artista vinculado)
```

## Response Shape (API)

### Versão com artista (sem mudança)

```json
{
  "id": "uuid",
  "artista": { "id": "uuid", "nome": "Nome do Artista" },
  "bpm": 120,
  "cifras": "Am G F C",
  "lyrics": "...",
  "link_versao": "https://...",
  "intensidade": "calma"
}
```

### Versão sem artista (novo)

```json
{
  "id": "uuid",
  "artista": null,
  "bpm": 120,
  "cifras": "Am G F C",
  "lyrics": null,
  "link_versao": null,
  "intensidade": null
}
```
