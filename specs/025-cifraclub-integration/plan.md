# Implementation Plan: Integração CifraClub — Playlist, Transposição e Lista por Evento

**Branch**: `027-cifraclub-list-link` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Unified feature specification from `specs/025-cifraclub-integration/spec.md`

## Summary

Adicionar integração formal entre LouvorFlow e CifraClub em 3 capacidades: (1) campo `cifraclub_url` por versão de música + endpoint de playlist ordenada com stats; (2) enriquecimento automático das URLs com `#key=N` para transposição cromática; (3) campo `cifraclub_list_url` por Evento para "link único" de lista pública + share dedicado + aviso de staleness. Frontend ganha um diálogo `CifraclubPlaylistDialog` com ações de compartilhamento e o campo de lista com preview via API pública do CifraClub.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend ESM via Sucrase) · React 18 (frontend Vite)
**Primary Dependencies**: Express 5.1 · Prisma 6.19 · Zod 3.x · React Query 5.x · shadcn/ui · TailwindCSS 3 · sonner · lucide-react
**Storage**: PostgreSQL 17 — 2 migrações aditivas (1 coluna em `artistas_musicas`, 2 colunas em `eventos`). Sem novos índices.
**Testing**: Vitest 4 (backend + frontend)
**Target Platform**: Backend Node.js LTS em container · Frontend SPA web (mobile-first, Galaxy S8 360×740)
**Project Type**: Web application (monorepo `packages/backend` + `packages/frontend`)
**Performance Goals**: Endpoint playlist <300ms p95. Preview frontend assíncrono (timeout 3s). WhatsApp share instantâneo (formatação local).
**Constraints**: (a) Falha da API CifraClub não bloqueia cadastro; (b) Multi-tenant via `tenant_id`; (c) RBAC: `musicas.write` p/ versão, `escalas.write` p/ evento; (d) Mobile-first 360px.
**Scale/Scope**: ~10-50 escalas/mês por tenant. Volume desprezível de chamadas à API CifraClub.

## Constitution Check

| Princípio | Status | Justificativa |
|---|---|---|
| **I. Mobile-First** | ✅ | Botões icon-only em mobile, dialog com footer flex-col, campo preview empilhado |
| **II. Relational Data Integrity** | ✅ | Colunas diretas, Prisma migrations, FKs existentes preservadas |
| **III. RESTful API as SSOT** | ✅ | 1 endpoint novo (playlist), extensão de endpoints existentes |
| **IV. Version-Centric Repertoire** | ✅ | `cifraclub_url` vinculado à versão (`Artistas_Musicas`), não à música |
| **V. Simplicity & Pragmatism** | ✅ | Colunas diretas, sem proxy, sem lib compartilhada, sem novo índice |

**Constitution gate: PASS**

## Project Structure

### Source Code (files touched)

```text
packages/backend/
├── prisma/
│   ├── schema.prisma                                    # MOD — 2 models ganham campos
│   └── migrations/
│       ├── <ts>_add_cifraclub_url_to_artistas_musicas/  # NOVO
│       └── <ts>_add_cifraclub_list_url_to_eventos/      # NOVO
├── src/
│   ├── types/index.ts                                   # MOD — tipos + selects
│   ├── validators/musicas.validators.ts                 # MOD — cifraclub_url nos schemas existentes
│   ├── validators/eventos.validators.ts                 # MOD — cifraclub_list_url schema
│   ├── lib/
│   │   ├── cifraclub-key-mapping.ts                     # NOVO — tom → #key=N
│   │   └── cifraclub-list-url.ts                        # NOVO — regex + validate
│   ├── services/eventos.service.ts                      # MOD — playlist, staleness, timestamp
│   ├── services/musicas.service.ts                      # MOD — propagar cifraclub_url
│   ├── repositories/musicas.repository.ts               # MOD — propagar campo
│   ├── repositories/eventos.repository.ts               # MOD — propagar campos
│   ├── controllers/eventos.controller.ts                # MOD — handler getCifraclubPlaylist
│   └── routes/eventos.routes.ts                         # MOD — nova rota
├── tests/
│   ├── lib/
│   │   ├── cifraclub-key-mapping.test.ts                # NOVO
│   │   └── cifraclub-list-url.test.ts                   # NOVO
│   └── services/
│       └── eventos.service.test.ts                      # MOD — playlist + staleness
└── docs/
    └── openapi.json                                     # MOD

packages/frontend/
├── src/
│   ├── lib/
│   │   ├── cifraclub-key-mapping.ts                     # NOVO — tom → #key=N (cópia)
│   │   ├── cifraclub-list-url.ts                        # NOVO — regex + preview fetch
│   │   ├── cifraclub-playlist.ts                        # NOVO — formatter playlist
│   │   └── cifraclub-list-share.ts                      # NOVO — formatter lista share
│   ├── schemas/
│   │   ├── musica.ts                                    # MOD — cifraclub_url
│   │   └── evento.ts                                    # MOD — cifraclub_list_url fields
│   ├── services/
│   │   └── eventos.ts                                   # MOD — getCifraclubPlaylist + payloads
│   ├── hooks/
│   │   └── use-eventos.ts                               # MOD — useCifraclubPlaylist hook
│   └── components/
│       ├── VersaoForm.tsx                                # MOD — input cifraclub_url
│       ├── EventoForm.tsx                                # MOD — input cifraclub_list_url + preview
│       ├── EventoDetail.tsx                              # MOD — botão CifraClub + Abrir lista + staleness
│       └── CifraclubPlaylistDialog.tsx                   # NOVO — diálogo completo
└── tests/
    ├── lib/
    │   ├── cifraclub-key-mapping.test.ts                 # NOVO
    │   ├── cifraclub-list-url.test.ts                    # NOVO
    │   ├── cifraclub-playlist.test.ts                    # NOVO
    │   └── cifraclub-list-share.test.ts                  # NOVO
    └── components/
        └── CifraclubPlaylistDialog.test.tsx              # NOVO

```

### Key decisions

- **`cifraclub-key-mapping.ts` duplicado** entre backend/frontend: mesma lógica pura (~50 linhas). Sem lib compartilhada (YAGNI).
- **Novo endpoint** em vez de estender `GET /api/eventos/:id`: a playlist é um recurso derivado com shape diferente — merece sua própria rota.
- **`CifraclubPlaylistDialog` é o componente central**: une playlist + share de lista + copiar. Um diálogo, 4 ações.
- **Controllers de Eventos ganham 1 novo handler**: `getCifraclubPlaylist`. Os handlers de CRUD existentes apenas propagam o campo novo sem lógica adicional.

## Complexity Tracking

Sem entradas — Constitution Check passou sem violations.
