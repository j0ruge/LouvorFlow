# Data Model: Intensidade de Música

## Entity Changes

### Artistas_Musicas (Versão) — campo adicionado

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| intensidade | String | Sim | null | Nível energético da versão: "calma", "media", "agitada" |

**Validação**: Backend Zod enum — aceita apenas `"calma"`, `"media"`, `"agitada"` ou ausente/null.

**Migração**: `ALTER TABLE artistas_musicas ADD COLUMN intensidade VARCHAR;` — nullable, sem default, sem alteração em registros existentes.

## Relationships

Nenhuma nova relação. O campo é um atributo simples da entidade existente `Artistas_Musicas`.

## State Transitions

```text
null → "calma" | "media" | "agitada"  (seleção no formulário)
"calma" | "media" | "agitada" → null  (toggle deselect)
"calma" → "agitada"                   (troca direta)
```
