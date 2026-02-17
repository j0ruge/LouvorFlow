# Implementation Plan: Integração Frontend-Backend (Fase 2)

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-frontend-backend-phase2/spec.md`

## Summary

Completar a integração frontend-backend do LouvorFlow conectando todos os endpoints restantes da API. Inclui: gestão completa de músicas (edição, exclusão, versões, tags, funções com página de detalhes dedicada), edição/exclusão de escalas, atribuição de funções a integrantes, página de Configurações com abas para entidades auxiliares (Artistas, Tags, Funções, Tonalidades, Tipos de Evento), Dashboard com dados reais, busca funcional, e testes de navegabilidade/usabilidade com Playwright MCP.

## Technical Context

**Language/Version**: TypeScript ~5.8 (instalado: ^5.8.3; CLAUDE.md alvo: 5.9)
**Primary Dependencies**: React 18.3, Vite 5.4, TanStack React Query 5.83, react-hook-form 7.61, Zod 3.25, shadcn/ui + Radix UI, React Router 6.30, Sonner 1.7, Lucide React
**Storage**: N/A (frontend-only; backend com PostgreSQL 17 + Prisma 6 já existente)
**Testing**: Playwright (E2E/navegabilidade via MCP + framework de testes automatizados)
**Target Platform**: Web SPA (navegadores modernos)
**Project Type**: Web application (frontend do monorepo)
**Performance Goals**: Filtragem client-side < 100ms; transições de página < 300ms
**Constraints**: Sem endpoints de busca/agregação no backend — filtragem e contagem são feitas no cliente
**Scale/Scope**: ~10 páginas/rotas, ~30 endpoints conectados, 5 entidades auxiliares com CRUD

## Constitution Check

*Validado contra `.specify/memory/constitution.md` v1.0.1 (2026-02-14).*

| Princípio | Status | Notas |
|-----------|--------|-------|
| I. Mobile-First | ⚠️ PARCIAL | Novos componentes devem seguir mobile-first. Responsividade avançada fora do escopo, mas layout base deve funcionar em 375px. |
| II. Relational Data Integrity | ✅ OK | DB usa CASCADE em junction tables conforme constituição. Frontend trata exclusões com diálogo de confirmação informando impacto em registros relacionados. |
| III. RESTful API as Single Source | ✅ OK | Todo acesso a dados via API. Filtragem client-side usa dados já obtidos da API. |
| IV. Version-Centric Repertoire | ⚠️ DEBT | Seleção de versão ao associar música a evento fora do escopo (requer alteração no backend). Registrado como débito constitucional — issue de acompanhamento necessária. |
| V. Simplicity & Pragmatism | ✅ OK | `ConfigCrudSection<T>` é a única abstração nova, justificada pela repetição de 5 seções CRUD idênticas. |

**Post-Design Re-check**: O design segue os padrões estabelecidos na Fase 1 (services → hooks → components), respeita a Lei de Demeter, SOLID e DRY conforme CLAUDE.md.

## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-backend-phase2/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas e alternativas avaliadas
├── data-model.md        # Schemas Zod e mapeamento endpoint→schema
├── quickstart.md        # Guia de setup e verificação rápida
├── contracts/
│   ├── frontend-services.md  # Contratos de services, hooks e componentes
│   └── e2e-tests.md          # Testes de navegabilidade e usabilidade
└── tasks.md             # Gerado por /speckit.tasks (não criado aqui)
```

### Source Code (repository root)

```text
src/frontend/src/
├── components/
│   ├── ui/                        # shadcn/ui (inalterado)
│   ├── AppSidebar.tsx             # MODIFICADO — item "Configurações"
│   ├── EventoDetail.tsx           # MODIFICADO — botões Editar/Excluir
│   ├── EventoForm.tsx             # MODIFICADO — modo edição (PUT)
│   ├── IntegranteForm.tsx         # MODIFICADO — seção de funções
│   ├── MusicaForm.tsx             # MODIFICADO — modo edição (PUT)
│   ├── MusicaDetail.tsx           # NOVO — detalhes da música
│   ├── VersaoForm.tsx             # NOVO — formulário de versão
│   ├── ConfigCrudSection.tsx      # NOVO — seção CRUD genérica (tabs)
│   ├── DeleteConfirmDialog.tsx    # NOVO — confirmação de exclusão
│   ├── EmptyState.tsx             # Existente
│   └── ErrorState.tsx             # Existente
├── pages/
│   ├── Dashboard.tsx              # MODIFICADO — dados reais
│   ├── Songs.tsx                  # MODIFICADO — busca, navegação
│   ├── SongDetail.tsx             # NOVO — /musicas/:id
│   ├── Scales.tsx                 # MODIFICADO — editar/excluir
│   ├── Members.tsx                # MODIFICADO — busca
│   ├── Settings.tsx               # NOVO — /configuracoes (abas)
│   └── App.tsx                    # MODIFICADO — novas rotas
├── hooks/
│   ├── use-artistas.ts            # NOVO
│   ├── use-musicas.ts             # MODIFICADO — CRUD + versões/tags/funções
│   ├── use-eventos.ts             # MODIFICADO — update/delete
│   ├── use-integrantes.ts         # MODIFICADO — funções
│   └── use-support.ts             # MODIFICADO — CRUD entidades auxiliares
├── services/
│   ├── artistas.ts                # NOVO
│   ├── musicas.ts                 # MODIFICADO — endpoints faltantes
│   ├── eventos.ts                 # MODIFICADO — update/delete
│   ├── integrantes.ts             # MODIFICADO — funções
│   └── support.ts                 # MODIFICADO — CRUD entidades auxiliares
├── schemas/
│   ├── artista.ts                 # NOVO
│   ├── musica.ts                  # MODIFICADO — UpdateMusica, Versão forms
│   ├── evento.ts                  # MODIFICADO — UpdateEvento
│   └── shared.ts                  # Existente
└── tests/
    └── e2e/                       # NOVO — Playwright E2E
        ├── navigation.spec.ts
        ├── musicas.spec.ts
        ├── escalas.spec.ts
        ├── integrantes.spec.ts
        ├── configuracoes.spec.ts
        └── dashboard.spec.ts
```

**Structure Decision**: Seguir a estrutura existente do frontend (Option 2 — Web application). Todos os arquivos novos seguem as convenções estabelecidas: páginas em `pages/`, componentes em `components/`, hooks em `hooks/`, services em `services/`, schemas em `schemas/`. Testes E2E adicionados em `tests/e2e/`.

## Implementation Phases

> **Mapeamento Plan → Tasks**: As fases aqui (A–G) foram expandidas em 10 phases no `tasks.md` para maior granularidade: A→Phase 1, B→Phases 2+3, C→Phase 4, D→Phase 5, E→Phase 6, F→Phase 7, (Busca)→Phase 8, G→Phase 9, (Polish)→Phase 10.

### Fase A — Infraestrutura e Componentes Base (pré-requisito para tudo)

**Objetivo**: Criar componentes reutilizáveis e schemas que serão usados por todos os módulos.

1. **Schemas novos**: `schemas/artista.ts` + extensões em `musica.ts`, `evento.ts`
2. **DeleteConfirmDialog**: Componente reutilizável com AlertDialog do shadcn/ui
3. **ConfigCrudSection**: Componente genérico para CRUD de entidades auxiliares
4. **Rotas**: Adicionar `/musicas/:id` e `/configuracoes` ao `App.tsx`
5. **Sidebar**: Adicionar item "Configurações" ao `AppSidebar.tsx`

**Validação Playwright MCP**: Navegar pela aplicação, verificar que novas rotas existem e sidebar atualizado.

### Fase B — Configurações + Artistas (P2, mas desbloqueia P1)

**Objetivo**: Criar a página de Configurações com CRUD para as 5 entidades auxiliares.

1. **Services**: `artistas.ts` (CRUD) + extensões em `support.ts` (CRUD tags, funções, tonalidades, tipos-eventos)
2. **Hooks**: `use-artistas.ts` + extensões em `use-support.ts`
3. **Página Settings**: Implementar com `Tabs` do shadcn/ui + `ConfigCrudSection` para cada aba
4. **Navegação**: Verificar que novo item no sidebar funciona

**Validação Playwright MCP**: Navegar para `/configuracoes`, criar/editar/excluir em cada aba, testar duplicidade, alternar entre abas.

### Fase C — Músicas: Gestão Completa (P1)

**Objetivo**: Implementar página de detalhes, edição, exclusão, e gestão de versões/tags/funções.

1. **Services**: Extensões em `musicas.ts` (update, delete, versões CRUD, tags, funções)
2. **Hooks**: Extensões em `use-musicas.ts` (todos os novos mutations)
3. **VersaoForm**: Dialog para criar/editar versão (artista selecionável, BPM, cifras, letras, link)
4. **MusicaDetail**: Componente com seções para info básica, versões, tags, funções
5. **SongDetail**: Página `/musicas/:id` usando `MusicaDetail`
6. **Songs**: Atualizar para navegação via clique, busca funcional
7. **MusicaForm**: Suportar modo edição

**Validação Playwright MCP**: Fluxo completo — listar → clicar → detalhes → editar → versões → tags → funções → excluir → busca.

### Fase D — Escalas: Edição e Exclusão (P1)

**Objetivo**: Habilitar edição e exclusão de escalas/eventos.

1. **Services**: Extensões em `eventos.ts` (update, delete)
2. **Hooks**: Extensões em `use-eventos.ts` (useUpdateEvento, useDeleteEvento)
3. **EventoForm**: Suportar modo edição (receber dados, usar PUT)
4. **EventoDetail**: Adicionar botões Editar e Excluir
5. **Scales**: Habilitar botão Editar (remover "em breve"), adicionar Excluir

**Validação Playwright MCP**: Editar escala existente, verificar persistência; excluir com confirmação.

### Fase E — Integrantes: Gestão de Funções (P1)

**Objetivo**: Adicionar gestão de funções ao dialog de edição de integrantes.

1. **Services**: Extensões em `integrantes.ts` (funções CRUD)
2. **Hooks**: Extensões em `use-integrantes.ts` (add/remove funções)
3. **IntegranteForm**: Adicionar seção de funções com badges removíveis + seletor
4. **Members**: Adicionar busca funcional

**Validação Playwright MCP**: Editar integrante → adicionar/remover funções → verificar badges → busca.

### Fase F — Dashboard com Dados Reais (P3)

**Objetivo**: Substituir dados fictícios por dados reais.

1. **Dashboard**: Usar `useMusicas`, `useEventos`, `useIntegrantes` para contagens
2. **Próximas Escalas**: Filtrar eventos futuros por data, ordenar
3. **Remover dados hardcoded**: Eliminar constantes fictícias

**Validação Playwright MCP**: Verificar cards com números reais, próximas escalas com dados do servidor, criar registro e verificar atualização.

### Fase G — Testes E2E Automatizados

**Objetivo**: Criar testes Playwright automatizados para regressão.

1. **Setup**: Configurar Playwright no projeto (`playwright.config.ts`)
2. **Testes de navegação**: `navigation.spec.ts`
3. **Testes por módulo**: `musicas.spec.ts`, `escalas.spec.ts`, `integrantes.spec.ts`, `configuracoes.spec.ts`, `dashboard.spec.ts`

## Complexity Tracking

> Nenhuma violação de constitution identificada. Tabela vazia.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
