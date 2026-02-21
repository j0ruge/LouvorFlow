# Data Model: Relatórios com Dados Reais

**Branch**: `007-live-reports` | **Date**: 2026-02-18

Este documento descreve os tipos TypeScript e schemas Zod necessários para a feature de relatórios com dados reais. Nenhuma alteração no schema Prisma é necessária — as tabelas `eventos`, `musicas` e `eventos_musicas` já existem.

## Tabelas Utilizadas (Prisma — sem alteração)

### `eventos`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `UUID` | PK |
| `data` | `Date` | Usado para filtrar eventos passados (≤ hoje) e agrupar por mês |
| `fk_tipo_evento` | `UUID` | FK → `tipos_eventos` |
| `descricao` | `String` | — |

### `musicas`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `UUID` | PK |
| `nome` | `String` | Usado no ranking (nome exibido + desempate alfabético) |
| `fk_tonalidade` | `UUID` | FK → `tonalidades` |

### `eventos_musicas` (junction table)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `UUID` | PK |
| `evento_id` | `UUID` | FK → `eventos` |
| `musicas_id` | `UUID` | FK → `musicas` |

Constraint: `@@unique([evento_id, musicas_id])`

---

## Novos Tipos (Backend — `types/index.ts`)

### `MusicaRanking`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | UUID da música |
| `nome` | `string` | Nome da música |
| `vezes` | `number` | Quantidade de eventos em que aparece |

### `AtividadeMensal`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `mes` | `string` | Identificador do mês (ex: "Jan 2026") |
| `eventos` | `number` | Quantidade de eventos no mês |
| `musicas` | `number` | Quantidade de associações evento-música no mês |

### `RelatorioResumo`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `totalMusicas` | `number` | Total de músicas cadastradas |
| `totalEventos` | `number` | Total de eventos com data ≤ hoje |
| `mediaPorEvento` | `number` | Média de músicas por evento (1 casa decimal) |
| `topMusicas` | `MusicaRanking[]` | Top 5 músicas por frequência |
| `atividadeMensal` | `AtividadeMensal[]` | Atividade dos últimos 6 meses |

---

## Novos Schemas (Frontend — `schemas/relatorio.ts`)

### `MusicaRankingSchema`

```typescript
const MusicaRankingSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  vezes: z.number().int().min(0),
});
```

### `AtividadeMensalSchema`

```typescript
const AtividadeMensalSchema = z.object({
  mes: z.string(),
  eventos: z.number().int().min(0),
  musicas: z.number().int().min(0),
});
```

### `RelatorioResumoSchema`

```typescript
const RelatorioResumoSchema = z.object({
  totalMusicas: z.number().int().min(0),
  totalEventos: z.number().int().min(0),
  mediaPorEvento: z.number().min(0),
  topMusicas: z.array(MusicaRankingSchema),
  atividadeMensal: z.array(AtividadeMensalSchema),
});
```

---

## Diagrama de Agregação

```text
musicas ──count──▶ totalMusicas

eventos ──count(data ≤ hoje)──▶ totalEventos

eventos_musicas ──count──▶ total associações
                             │
                             └──÷ totalEventos──▶ mediaPorEvento

eventos_musicas ──group by musicas_id──▶ topMusicas (top 5, desc vezes, asc nome)
     │                                     join musicas.nome
     └── where evento.data ≤ hoje

eventos ──group by (year, month)──▶ atividadeMensal
     │      where data ≤ hoje
     │      últimos 6 meses
     └── + count eventos_musicas por mês
```

---

## Mapeamento Endpoint → Schema

| Endpoint | Método | Schema Request | Schema Response |
|----------|--------|----------------|-----------------|
| `/relatorios/resumo` | GET | — | `RelatorioResumo` |
