# API Contracts: Intensidade

## Endpoints afetados

### POST /api/musicas/complete

**Request body** — campo adicionado:

```json
{
  "nome": "string (required)",
  "intensidade": "calma | media | agitada (optional)"
}
```

### PUT /api/musicas/:id/complete

**Request body** — campo adicionado:

```json
{
  "intensidade": "calma | media | agitada (optional)"
}
```

### POST /api/musicas/:musicaId/versoes

**Request body** — campo adicionado:

```json
{
  "artista_id": "uuid (required)",
  "intensidade": "calma | media | agitada (optional)"
}
```

### PUT /api/musicas/:musicaId/versoes/:versaoId

**Request body** — campo adicionado:

```json
{
  "intensidade": "calma | media | agitada (optional)"
}
```

### GET /api/musicas, GET /api/musicas/:id

**Response** — campo adicionado em cada versão:

```json
{
  "versoes": [
    {
      "id": "uuid",
      "artista": { "id": "uuid", "nome": "string" },
      "bpm": 120,
      "intensidade": "media"
    }
  ]
}
```

## Valores válidos para intensidade

| Valor | Label UI | Descrição |
|-------|----------|-----------|
| `"calma"` | Calma | Nível energético baixo |
| `"media"` | Média | Nível energético moderado |
| `"agitada"` | Agitada | Nível energético alto |
| `null` | (nenhum) | Não classificada |
