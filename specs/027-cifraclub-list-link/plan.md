# Implementation Plan: Linkar lista pública do CifraClub por Evento (027)

**Branch**: `027-cifraclub-list-link` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/027-cifraclub-list-link/spec.md`

## Summary

Adicionar à entidade `Eventos` 2 novas colunas (`cifraclub_list_url TEXT NULL` + `cifraclub_list_url_updated_at TIMESTAMPTZ NULL`) e expor essa URL via endpoints CRUD de Eventos. A UI ganha (1) um campo no formulário de Escala com validação por regex específica do CifraClub e preview opcional (chamada frontend direta à API pública `/v3/songbook/{listId}`, sem proxy backend); (2) um botão "Abrir lista no CifraClub" próximo ao título do detalhe da Escala; (3) um botão "Compartilhar lista no CifraClub" no diálogo da Playlist CifraClub (feature 025), independente do share original; (4) um aviso "Lista possivelmente desatualizada" quando `MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at`.

Feature **complementa** 025 e 026 — não substitui. Dependência rígida: 025 precisa estar em produção (para o botão extra existir dentro do diálogo da Playlist CifraClub). 026 é independente — 027 pode mergear antes ou depois sem conflito.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend ESM via Sucrase) · React 18 (frontend Vite)
**Primary Dependencies**: Express 5.1 · Prisma 6.19 · Zod 3.x · React Query 5.x · shadcn/ui · TailwindCSS 3 · sonner (toasts)
**Storage**: PostgreSQL 17 — **1 migração** adicionando 2 colunas em `eventos` (`cifraclub_list_url TEXT NULL`, `cifraclub_list_url_updated_at TIMESTAMPTZ NULL`). Sem nova tabela. Sem novo índice (a busca é sempre por `eventos.id`, já indexado).
**Testing**: Vitest 4 (backend services + frontend lib/components)
**Target Platform**: Backend Node.js LTS em Linux container · Frontend SPA web (mobile-first, target Galaxy S8 360×740 + iPhone SE 375×667)
**Project Type**: Web application (monorepo `packages/backend` + `packages/frontend`)
**Performance Goals**: Endpoint de Evento mantém alvo histórico de <300ms p95. Preview frontend é assíncrono com timeout de 3s — não bloqueia o cadastro. WhatsApp share é instantâneo (formatação local).
**Constraints**: (a) Tolerância a falhas externas — preview da API CifraClub falha graciosamente sem afetar o cadastro (FR-012); (b) Multi-tenant — campo isolado por tenant via `tenant_id` existente (FR-011); (c) RBAC — escrita exige `escalas.write` (FR-010); (d) Mobile-first — botões dimensionados para viewport 360px.
**Scale/Scope**: ~10–50 escalas/mês por tenant; URL é 1:1 por Evento. Volume de chamadas à API externa CifraClub é limitado ao número de cadastros/edições — desprezível.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio (constitution v1.0.1) | Status | Justificativa |
|---|---|---|
| **I. Mobile-First & Cross-Platform Ready** | ✅ Compliant | Botão "Abrir lista" e "Compartilhar lista" são componentes shadcn estáveis. Campo de cadastro com input + preview text reusa primitivos já no projeto. Testado para viewport 360px. Compatível com React Native via primitivos equivalentes no futuro. |
| **II. Relational Data Integrity** | ✅ Compliant | A solução escolhida (coluna direta em `Eventos`) preserva relações explícitas. Sem polimorfismo. `tenant_id` continua sendo o eixo de isolamento. Validação no banco via `NULL` opcional + Zod no app. |
| **III. RESTful API as Single Source of Truth** | ✅ Compliant | Sem novo recurso. Estende endpoints existentes `GET/POST/PUT /api/eventos[/:id]` com 2 novos campos no body/response. Mantém padrões REST e nomenclatura PT-BR. |
| **IV. Version-Centric Repertoire Model** | ✅ Compliant (vacuous) | Feature não toca Versão (`Artistas_Musicas`), Música ou Tonalidade. Atua somente em Evento. |
| **V. Simplicity & Pragmatism (YAGNI)** | ✅ Compliant | Coluna direta vs tabela polimórfica (Q2): escolhemos a forma mais simples explicitamente. Preview no frontend direto (Q1): zero código backend. Share independente (Q3): zero acoplamento com 025. Sem novas dependências npm. Sem novos endpoints. |

**Constitution gate: PASS** — sem violations, sem entradas em "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/027-cifraclub-list-link/
├── plan.md              # Este arquivo (saída de /speckit.plan)
├── spec.md              # Especificação funcional (criada por /speckit.specify e refinada por /speckit.clarify)
├── research.md          # Decisões técnicas Phase 0 (saída de /speckit.plan)
├── data-model.md        # Entidades modificadas Phase 1 (saída de /speckit.plan)
├── quickstart.md        # Roteiro de validação manual Phase 1 (saída de /speckit.plan)
├── contracts/
│   ├── eventos-cifraclub-list-url.openapi.json   # Patch dos endpoints REST de Eventos
│   └── cifraclub-songbook-external.md             # Referência ao endpoint externo /v3/songbook/{id}
├── checklists/
│   └── requirements.md  # Validação de qualidade do spec (saída de /speckit.specify)
└── tasks.md             # Saída de /speckit.tasks (NÃO criado por /speckit.plan)
```

### Source Code (repository root)

Estrutura do monorepo existente. Esta feature toca:

```text
packages/backend/
├── prisma/
│   ├── schema.prisma                              # MOD — model Eventos ganha 2 campos
│   └── migrations/<ts>_add_cifraclub_list_url_to_eventos/
│       └── migration.sql                           # NOVO — ALTER TABLE eventos ADD COLUMN ...
├── src/
│   ├── types/index.ts                              # MOD — tipo Evento ganha 2 campos; EVENTO_*_SELECT atualizado
│   ├── validators/eventos.validators.ts            # MOD — Zod cifraclubListUrlSchema; aceitar no body create/update
│   ├── services/eventos.service.ts                 # MOD — set cifraclub_list_url_updated_at quando URL muda; método helper para detectar "desatualizada"
│   ├── repositories/eventos.repository.ts          # MOD — propagar campo em create/update
│   ├── controllers/eventos.controller.ts           # Sem mudanças (handlers genéricos já passam o body validado)
│   └── lib/
│       └── cifraclub-list-url.ts                   # NOVO — regex + função `validateCifraclubListUrl(url): { valid, listId, isSystemList }`
├── tests/
│   ├── lib/
│   │   └── cifraclub-list-url.test.ts              # NOVO — Vitest: regex exaustivo (custom IDs, system slugs, query strings, casing, domínio errado)
│   └── services/
│       └── eventos.service.test.ts                  # MOD — cenários: cadastrar/editar/remover URL; "desatualizada" via MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at
└── docs/
    └── openapi.json                                # MOD — schemas EventoCreate, EventoUpdate, EventoShow ganham campo

packages/frontend/
├── src/
│   ├── lib/
│   │   ├── cifraclub-list-url.ts                   # NOVO — mesmo regex de validação (compartilhado) + fetch preview (timeout 3s, sem retry)
│   │   └── cifraclub-list-share.ts                 # NOVO — formatter da mensagem WhatsApp do share independente
│   ├── schemas/
│   │   └── evento.ts                                # MOD — Zod schema ganha cifraclub_list_url e cifraclub_list_url_updated_at
│   ├── services/
│   │   └── eventos.ts                               # MOD — passar campo no payload de create/update
│   ├── hooks/
│   │   └── use-eventos.ts                           # MOD — invalidate query após mudança da URL
│   └── components/
│       ├── EventoDetail.tsx                         # MOD — botão "Abrir lista no CifraClub" no header; aviso "desatualizada" quando aplicável
│       ├── EventoForm.tsx                           # MOD — input cifraclub_list_url com preview e validação inline
│       └── CifraclubPlaylistDialog.tsx              # MOD — botão "Compartilhar lista no CifraClub" no footer (independente do share original)
└── tests/
    ├── lib/
    │   ├── cifraclub-list-url.test.ts               # NOVO — regex + fetch mock (preview ok / timeout / 404)
    │   └── cifraclub-list-share.test.ts             # NOVO — formato da mensagem WhatsApp gerada
    └── components/
        └── EventoDetail.test.tsx                    # MOD — botão aparece/desaparece conforme campo cadastrado; aviso "desatualizada"
```

**Structure Decision**: Monorepo web app (Option 2 do template). Toda a feature é entregue dentro da estrutura existente. A maior novidade é a função pura `validateCifraclubListUrl` (compartilhada entre backend e frontend via cópia — não há lib compartilhada hoje; YAGNI sobre criar uma só por essa duplicação trivial de regex). Migração Prisma é a única mudança de schema; sem novos índices porque a busca por `eventos.id` já é indexada.

## Complexity Tracking

Sem entradas — Constitution Check passou sem violations.
