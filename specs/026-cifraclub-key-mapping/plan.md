# Implementation Plan: Mapeamento de Tom LouvorFlow → Fragmento `#key=N` do CifraClub

**Branch**: `026-cifraclub-key-mapping` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/026-cifraclub-key-mapping/spec.md`

## Summary

Enriquecer a Playlist CifraClub (feature `025-cifraclub-playlist-integration`) anexando o fragmento `#key=N` à URL de cada música, onde `N` é o índice cromático absoluto do tom configurado na música (tabela canonical CifraClub: `A=0, Bb=1, B=2, C=3, Db=4, D=5, Eb=6, E=7, F=8, F#=9, G=10, Ab=11`). A feature é **stateless e sem mudança de schema** — apenas um utilitário puro de transformação aplicado na composição da resposta do endpoint. O cálculo é idempotente, tolerante a entradas inesperadas (tom inválido → URL sem fragmento + flag `tom_ajustado: false`), e a UI ganha uma badge discreta com o `tom_final` por item.

Pré-requisito operacional: **a feature 025 precisa estar implementada antes** desta (hoje apenas o PRD foi mergeado; a implementação ainda não existe). O plano abaixo é desenhado para ser executável imediatamente após a 025 entrar em produção, ou — alternativamente — em paralelo dentro do mesmo PR se a equipe optar por entregar 025+026 juntos (recomendação documentada em [research.md](./research.md) §1).

## Technical Context

**Language/Version**: TypeScript 5.9 (backend ESM via Sucrase) · React 18 (frontend Vite)
**Primary Dependencies**: Express 5.1 · Prisma 6.19 · Zod 3.x · React Query 5.x · shadcn/ui · TailwindCSS 3
**Storage**: PostgreSQL 17 — **nenhuma mudança de schema nesta feature** (a tabela `Artistas_Musicas.cifraclub_url` e a leitura de `Musicas.fk_tonalidade → Tonalidades.tom` já existem em produção pré-026; 025 adiciona o campo `cifraclub_url` mas não adiciona tom)
**Testing**: Vitest 4 (backend services + frontend lib/components) — sem testes E2E no MVP
**Target Platform**: Backend Node.js LTS em Linux container · Frontend SPA web (mobile-first, target Galaxy S8 360×740 + iPhone SE 375×667)
**Project Type**: Web application (monorepo `packages/backend` + `packages/frontend`)
**Performance Goals**: Cálculo de `#key=N` é O(1) por música; impacto desprezível no p95 do endpoint (<1ms extra). Endpoint `cifraclub-playlist` mantém alvo da 025 de <300ms p95.
**Constraints**: Tolerância a entradas inesperadas (FR-011); zero erros 500 originados do cálculo (SC-004); função pura idempotente (FR-013); compatibilidade com a 025 (não pode quebrar testes existentes — SC-006).
**Scale/Scope**: Tipicamente 5–15 músicas por escala; ~10–50 escalas/mês por tenant; ~10–500 tenants. Volume diário de chamadas ao endpoint na casa das centenas. Não há cache server-side — recompute por request é trivial.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio (constitution v1.0.1) | Status | Justificativa |
|---|---|---|
| **I. Mobile-First & Cross-Platform Ready** | ✅ Compliant | A única mudança de UI é uma badge textual (`tom_final`) adicionada por item no diálogo da Playlist CifraClub. Texto curto (1–3 caracteres), sem APIs web-only, compatível com React Native via componentes shadcn-equivalentes no futuro. Sem regressão no design existente do diálogo (responsivo desde a 025). |
| **II. Relational Data Integrity** | ✅ Compliant (vacuous) | Feature não cria, altera ou remove tabelas, FKs ou junctions. Não há migration Prisma. |
| **III. RESTful API as Single Source of Truth** | ✅ Compliant | Mantém endpoint REST único da 025 (`GET /api/eventos/:id/cifraclub-playlist`), apenas enriquece o payload com `tom_final` + `tom_ajustado` por item da playlist e atualiza a URL retornada. Sem novos endpoints, sem acesso direto a banco do frontend. |
| **IV. Version-Centric Repertoire Model** | ✅ Compliant | O `tom` continua sendo atributo da Música (`Musicas.fk_tonalidade → Tonalidades.tom`) — esta feature **só lê** esse tom, não o duplica nem move para Versão. A `cifraclub_url` continua na Versão (atributo de arranjo), conforme 025. |
| **V. Simplicity & Pragmatism (YAGNI)** | ✅ Compliant | Sem novo schema. Sem novas dependências. Função pura ~20 linhas (lookup em tabela). UI: 1 badge. Implementação cabe num único PR pequeno (~6h de trabalho efetivo segundo o sizing da spec). |

**Constitution gate: PASS** — sem violations, sem entradas em "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/026-cifraclub-key-mapping/
├── plan.md              # Este arquivo (saída de /speckit.plan)
├── spec.md              # Especificação funcional (criada por /speckit.specify e refinada por /speckit.clarify)
├── research.md          # Decisões técnicas Phase 0 (saída de /speckit.plan)
├── data-model.md        # Entidades enriquecidas Phase 1 (saída de /speckit.plan)
├── quickstart.md        # Roteiro de smoke test manual Phase 1 (saída de /speckit.plan)
├── contracts/
│   └── cifraclub-playlist.openapi.json  # Patch de contrato OpenAPI Phase 1
├── checklists/
│   └── requirements.md  # Validação de qualidade do spec (saída de /speckit.specify)
└── tasks.md             # Saída de /speckit.tasks (NÃO criado por /speckit.plan)
```

### Source Code (repository root)

Estrutura existente do monorepo. Esta feature toca apenas os arquivos abaixo (delta sobre a estrutura já estabelecida pela 025):

```text
packages/backend/
├── src/
│   ├── lib/
│   │   └── cifraclub-key.ts                 # NOVO — função pura `toCifraclubKey(tom)` + `applyKeyFragment(url, tom)`
│   ├── services/
│   │   └── eventos.service.ts                # MOD — método `getCifraclubPlaylist()` chama applyKeyFragment por item
│   └── types/
│       └── index.ts                          # MOD — adicionar campos `tom_final`/`tom_ajustado` no tipo de resposta
├── tests/
│   ├── lib/
│   │   └── cifraclub-key.test.ts             # NOVO — Vitest: tabela exaustiva, enarmônicos, modal, edge cases
│   └── services/
│       └── eventos.service.test.ts           # MOD — casos novos: playlist com tom transposto/sem tom/tom inválido
└── docs/
    └── openapi.json                          # MOD — schema CifraclubPlaylistItem ganha tom_final + tom_ajustado

packages/frontend/
├── src/
│   ├── lib/
│   │   └── cifraclub-playlist.ts             # MOD — formatter WhatsApp/clipboard usa URL final (já vem do backend), inclui badge text
│   ├── schemas/
│   │   └── cifraclub.ts                      # MOD — Zod schema do response ganha tom_final + tom_ajustado
│   └── components/
│       └── CifraclubPlaylistDialog.tsx       # MOD — badge `🎚 {tom_final}` por item + indicador "tom não ajustado"
└── tests/
    └── lib/
        └── cifraclub-playlist.test.ts        # MOD — cobrir novo campo na renderização do texto
```

**Structure Decision**: Monorepo web app (Option 2 do template). Backend e frontend isolados em `packages/backend` e `packages/frontend`. A feature é **puramente aditiva sobre a 025** — nenhum arquivo novo de domínio, nenhum arquivo deletado. A separação em `packages/backend/src/lib/cifraclub-key.ts` (função pura, sem I/O) reflete o princípio V (Simplicity): isolamento de lógica testável em milissegundos, sem necessidade de mock de Prisma.

## Complexity Tracking

Sem entradas — Constitution Check passou sem violations.
