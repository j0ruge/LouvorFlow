# API Contracts: Histórico com Dados Reais

**Feature**: 010-live-historico | **Date**: 2026-02-22

## Endpoints Consumed (existing, no changes)

Esta feature não cria novos endpoints. Os contratos abaixo documentam os endpoints existentes que serão consumidos pela página de Histórico.

### GET /api/eventos

**Purpose**: Listar todos os eventos com resumo de músicas e integrantes.
**Used by**: `useEventos()` hook → `getEventos()` service → History.tsx

**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "data": "2024-11-10",
    "descricao": "Culto especial de ação de graças",
    "tipoEvento": { "id": "uuid", "nome": "Culto de Celebração" },
    "musicas": [
      { "id": "uuid", "nome": "Grande é o Senhor" }
    ],
    "integrantes": [
      { "id": "uuid", "nome": "João Silva" }
    ]
  }
]
```

**Frontend filtering**: `eventos.filter(e => new Date(e.data) <= new Date())`
**Frontend sorting**: `.sort((a, b) => new Date(b.data) - new Date(a.data))`

### GET /api/eventos/:id

**Purpose**: Buscar detalhe completo de um evento (músicas com tonalidade, integrantes com funções).
**Used by**: `useEvento(id)` hook → `getEvento(id)` service → EventoDetail.tsx (rota `/escalas/:id`)

**Response** (200 OK):

```json
{
  "id": "uuid",
  "data": "2024-11-10",
  "descricao": "Culto especial de ação de graças",
  "tipoEvento": { "id": "uuid", "nome": "Culto de Celebração" },
  "musicas": [
    {
      "id": "uuid",
      "nome": "Grande é o Senhor",
      "tonalidade": { "id": "uuid", "tom": "G" }
    }
  ],
  "integrantes": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "funcoes": [
        { "id": "uuid", "nome": "Voz" }
      ]
    }
  ]
}
```

## New Endpoints

**None.** Nenhum novo endpoint é necessário para esta feature.
