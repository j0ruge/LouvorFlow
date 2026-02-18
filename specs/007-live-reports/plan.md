# Implementation Plan: Relatórios com Dados Reais

**Branch**: `007-live-reports` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-live-reports/spec.md`

## Summary

Transformar a página de relatórios (`/relatorios`) de dados 100% hardcoded para relatórios vivos com dados reais do PostgreSQL. Requer: novo recurso backend `relatorios` com endpoint de agregação (`GET /api/relatorios/resumo`) que calcula estatísticas (total de músicas, cultos realizados, média por culto, top 5 músicas, atividade mensal dos últimos 6 meses) via queries Prisma; e atualização do frontend para consumir esses dados com React Query, loading states, error states e empty states.

## Technical Context

**Language/Version**: TypeScript ~5.8 (instalado: ^5.8.3; CLAUDE.md alvo: 5.9)
**Primary Dependencies**: Backend — Express 5, Prisma 6; Frontend — React 18.3, TanStack React Query 5, Zod 3.25, shadcn/ui, Sonner
**Storage**: PostgreSQL 17 via Prisma ORM (tabelas: `eventos`, `musicas`, `eventos_musicas`)
**Testing**: Vitest 4 (unit tests com fake repositories no backend)
**Target Platform**: Web SPA (navegadores modernos)
**Project Type**: Web application (monorepo: backend + frontend)
**Performance Goals**: Endpoint de agregação < 500ms; página carrega em < 3 segundos (SC-002)
**Constraints**: Apenas eventos com data ≤ hoje são contabilizados; ranking limitado a 5 músicas; atividade mensal limitada a 6 meses
**Scale/Scope**: 1 novo endpoint backend, 1 service frontend, 1 hook, 1 schema Zod, 1 página atualizada

## Constitution Check

*Validado contra `.specify/memory/constitution.md` v1.0.1 (2026-02-14).*

| Princípio | Status | Notas |
|-----------|--------|-------|
| I. Mobile-First | ✅ OK | Página de relatórios já usa layout responsivo com grid. Manter o mesmo padrão. |
| II. Relational Data Integrity | ✅ OK | Queries de agregação usam joins em junction table `eventos_musicas` existente. Sem alterações no schema. |
| III. RESTful API as Single Source | ✅ OK | Novo endpoint `GET /api/relatorios/resumo` segue padrão RESTful. Frontend consome exclusivamente via API. |
| IV. Version-Centric Repertoire | ✅ OK | Conforme constituição: "Frequency/usage reports MUST aggregate by Music (composition), independent of which Version was performed." O ranking agrega por `musicas.id`, não por versão. |
| V. Simplicity & Pragmatism | ✅ OK | Endpoint único retorna todos os dados necessários em uma chamada. Sem abstrações desnecessárias. |

**Post-Design Re-check**: O design segue os padrões estabelecidos (repository → service → controller → routes no backend; service → hook → component no frontend). Princípio IV explicitamente atendido — agregação por música, não por versão.

## Project Structure

### Documentation (this feature)

```text
specs/007-live-reports/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas e alternativas avaliadas
├── data-model.md        # Schemas Zod, tipos TypeScript e resposta da API
├── quickstart.md        # Guia de setup e verificação rápida
├── contracts/
│   └── api-endpoints.md # Contrato do endpoint de agregação
└── tasks.md             # Gerado por /speckit.tasks (não criado aqui)
```

### Source Code (repository root)

```text
src/backend/src/
├── repositories/
│   └── relatorios.repository.ts     # NOVO — queries de agregação Prisma
├── services/
│   └── relatorios.service.ts        # NOVO — lógica de negócio e formatação
├── controllers/
│   └── relatorios.controller.ts     # NOVO — handler HTTP
├── routes/
│   └── relatorios.routes.ts         # NOVO — definição de rotas
├── types/
│   └── index.ts                     # MODIFICADO — tipos de relatórios
└── app.ts                           # MODIFICADO — registrar rota /api/relatorios

src/backend/tests/
└── unit/
    └── relatorios.service.test.ts   # NOVO — testes unitários com fake repository

src/frontend/src/
├── services/
│   └── relatorios.ts                # NOVO — chamada API + parsing Zod
├── hooks/
│   └── use-relatorios.ts            # NOVO — hook React Query
├── schemas/
│   └── relatorio.ts                 # NOVO — schemas Zod de validação
└── pages/
    └── Reports.tsx                  # MODIFICADO — substituir hardcoded por dados reais
```

**Structure Decision**: Seguir a estrutura existente do monorepo (backend em `src/backend/src/`, frontend em `src/frontend/src/`). O backend segue a arquitetura em camadas (repository → service → controller → routes). O frontend segue o padrão (service → hook → component). Todos os arquivos novos seguem as convenções estabelecidas.

## Implementation Phases

### Fase A — Backend: Repositório e Service de Relatórios

**Objetivo**: Criar a camada de dados e lógica de negócio para agregação de relatórios.

1. **Tipos**: Adicionar interfaces `RelatorioResumo`, `MusicaRanking`, `AtividadeMensal` em `types/index.ts`
2. **Repository**: `relatorios.repository.ts` com 3 métodos:
   - `countMusicas()` — total de músicas cadastradas
   - `countEventosRealizados()` — total de eventos com data ≤ hoje
   - `getTopMusicas(limit)` — top N músicas por frequência em `eventos_musicas`, com desempate alfabético
   - `getAtividadeMensal(meses)` — eventos e músicas agrupados por mês nos últimos N meses, apenas eventos passados
   - `countAssociacoesEventoMusica()` — total de registros em `eventos_musicas` para cálculo da média
3. **Service**: `relatorios.service.ts` com método `getResumo()` que:
   - Chama o repository para obter dados brutos
   - Calcula a média (arredondada a 1 casa decimal)
   - Retorna objeto formatado conforme contrato

**Validação**: Testes unitários com fake repository.

### Fase B — Backend: Controller, Rota e Registro

**Objetivo**: Expor o endpoint HTTP e registrar na aplicação.

1. **Controller**: `relatorios.controller.ts` com método `resumo()` (GET)
2. **Routes**: `relatorios.routes.ts` com `GET /` mapeado para `controller.resumo`
3. **App**: Registrar `'/api/relatorios'` em `app.ts`

**Validação**: `curl http://localhost:3000/api/relatorios/resumo` retorna JSON com dados reais.

### Fase C — Frontend: Schema, Service e Hook

**Objetivo**: Criar a camada de dados do frontend para consumir o endpoint.

1. **Schema**: `schemas/relatorio.ts` com `RelatorioResumoSchema` (Zod)
2. **Service**: `services/relatorios.ts` com `getRelatorioResumo()` que chama `apiFetch` e valida com Zod
3. **Hook**: `hooks/use-relatorios.ts` com `useRelatorioResumo()` usando React Query

**Validação**: Hook retorna dados tipados do endpoint.

### Fase D — Frontend: Página de Relatórios com Dados Reais

**Objetivo**: Substituir dados hardcoded pela integração com o endpoint.

1. **Reports.tsx**: Remover constantes hardcoded (`topSongs`, `monthlyStats`, números fixos)
2. **Loading**: Skeleton loaders enquanto dados carregam
3. **Error**: `ErrorState` com botão "Tentar novamente" via `refetch()`
4. **Empty**: Mensagens de estado vazio por seção quando não há dados
5. **Dados**: Renderizar dados reais do hook

**Validação Playwright MCP**: Acessar `/relatorios`, verificar que dados reais aparecem, testar error state e empty state.

### Fase E — Testes Unitários Backend

**Objetivo**: Garantir correção dos cálculos de agregação.

1. **Fake Repository**: Criar fake do `relatorios.repository` para testes
2. **Testes**: Cenários de aceitação da spec — totais, média, ranking, empate, banco vazio, meses parciais

**Validação**: `npx vitest run` passa todos os testes.

## Complexity Tracking

> Nenhuma violação de constitution identificada. Tabela vazia.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
