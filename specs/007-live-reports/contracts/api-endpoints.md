# API Contract: Relatórios

**Branch**: `007-live-reports` | **Date**: 2026-02-18

Este documento define o contrato da API de relatórios, incluindo o endpoint backend e os contratos de service/hook no frontend.

---

## 1. Backend — Endpoint

### `GET /api/relatorios/resumo`

**Descrição**: Retorna todas as estatísticas agregadas de relatórios em uma única resposta.

**Parâmetros**: Nenhum.

**Resposta de sucesso** (`200 OK`):

```json
{
  "totalMusicas": 50,
  "totalEventos": 20,
  "mediaPorEvento": 5.0,
  "topMusicas": [
    { "id": "uuid-1", "nome": "Way Maker", "vezes": 10 },
    { "id": "uuid-2", "nome": "Oceans", "vezes": 7 },
    { "id": "uuid-3", "nome": "Goodness of God", "vezes": 5 },
    { "id": "uuid-4", "nome": "Holy Spirit", "vezes": 4 },
    { "id": "uuid-5", "nome": "What A Beautiful Name", "vezes": 3 }
  ],
  "atividadeMensal": [
    { "mes": "Set 2025", "eventos": 6, "musicas": 36 },
    { "mes": "Out 2025", "eventos": 7, "musicas": 42 },
    { "mes": "Nov 2025", "eventos": 8, "musicas": 48 },
    { "mes": "Dez 2025", "eventos": 5, "musicas": 30 },
    { "mes": "Jan 2026", "eventos": 8, "musicas": 48 },
    { "mes": "Fev 2026", "eventos": 4, "musicas": 24 }
  ]
}
```

**Resposta de erro** (`500`):

```json
{
  "erro": "Erro ao buscar relatórios",
  "codigo": 500
}
```

**Regras de negócio**:
- `totalMusicas`: Contagem total de registros em `musicas` (todas, independente de associação)
- `totalEventos`: Contagem de registros em `eventos` com `data ≤ hoje`
- `mediaPorEvento`: `count(eventos_musicas) / totalEventos`, arredondado a 1 casa decimal. Se `totalEventos = 0`, retorna `0`
- `topMusicas`: Top 5 músicas por frequência em `eventos_musicas` (apenas eventos com data ≤ hoje), ordenadas por `vezes` DESC, desempate por `nome` ASC. Máximo 5 itens. Array vazio se não houver dados.
- `atividadeMensal`: Últimos 6 meses a partir do mês atual. Para cada mês: contagem de eventos com data no mês (e ≤ hoje) e contagem de associações `eventos_musicas` desses eventos. Ordenados cronologicamente (mais antigo primeiro). Meses sem dados são omitidos.

---

## 2. Backend — Camadas

### Repository (`relatorios.repository.ts`)

```typescript
/** Conta o total de músicas cadastradas. */
countMusicas(): Promise<number>

/** Conta o total de eventos com data ≤ hoje. */
countEventosRealizados(): Promise<number>

/** Conta o total de associações evento-música (apenas eventos com data ≤ hoje). */
countAssociacoesEventoMusica(): Promise<number>

/** Retorna as N músicas mais frequentes em eventos (data ≤ hoje), com desempate alfabético. */
getTopMusicas(limit: number): Promise<{ musicas_id: string; nome: string; vezes: number }[]>

/** Retorna contagem de eventos e músicas por mês, para os últimos N meses (apenas eventos ≤ hoje). */
getAtividadeMensal(meses: number): Promise<{ mes: string; eventos: number; musicas: number }[]>
```

### Service (`relatorios.service.ts`)

```typescript
/** Retorna o resumo completo de relatórios com todas as métricas agregadas. */
getResumo(): Promise<RelatorioResumo>
```

### Controller (`relatorios.controller.ts`)

```typescript
/** Handler para GET /api/relatorios/resumo. */
resumo(req: Request, res: Response): Promise<void>
```

### Routes (`relatorios.routes.ts`)

```typescript
GET /resumo → relatoriosController.resumo
```

---

## 3. Frontend — Camadas

### Schema (`schemas/relatorio.ts`)

```typescript
/** Schema Zod da resposta do endpoint de relatórios. */
export const RelatorioResumoSchema: z.ZodObject<{
  totalMusicas: z.ZodNumber;
  totalEventos: z.ZodNumber;
  mediaPorEvento: z.ZodNumber;
  topMusicas: z.ZodArray<MusicaRankingSchema>;
  atividadeMensal: z.ZodArray<AtividadeMensalSchema>;
}>

/** Tipo inferido do schema. */
export type RelatorioResumo = z.infer<typeof RelatorioResumoSchema>
```

### Service (`services/relatorios.ts`)

```typescript
/** Busca o resumo de relatórios do servidor. */
getRelatorioResumo(): Promise<RelatorioResumo>
```

### Hook (`hooks/use-relatorios.ts`)

```typescript
/** Hook React Query para buscar relatórios. */
useRelatorioResumo(): UseQueryResult<RelatorioResumo>
```

---

## 4. Cache Strategy

| Query Key | Stale Time | Invalidation |
|-----------|------------|--------------|
| `["relatorios", "resumo"]` | 1 min (padrão global) | Automática via staleTime — dados refrescam a cada visita à página após 1 min |

Nota: Relatórios são read-only. Não há mutations que invalidem o cache de relatórios. A invalidação ocorre naturalmente pelo staleTime configurado globalmente no QueryClient (1 minuto).
