# Quickstart: Backend Layered Architecture Refactor

**Branch**: `003-backend-layered-refactor` | **Date**: 2026-02-15

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database running (Docker Compose)
- Dependencies installed: `npm install` in `src/backend/`
- Prisma client generated: `npx prisma generate` in `src/backend/`

## Development Commands

```bash
cd src/backend

# Start dev server with hot reload
npm run dev

# Type check without emitting
npm run typecheck

# Build for production
npm run build
```

## File Structure After Refactoring

```text
src/backend/
├── prisma/
│   ├── cliente.ts              # PrismaClient (UNCHANGED)
│   └── schema.prisma           # Database schema (UNCHANGED)
├── src/
│   ├── app.ts                  # Express App (import paths updated only)
│   ├── errors/
│   │   └── AppError.ts         # NEW: Custom error class
│   ├── types/
│   │   └── index.ts            # NEW: Shared interfaces/DTOs
│   ├── repositories/           # NEW: Data access layer
│   │   ├── artistas.repository.ts
│   │   ├── eventos.repository.ts
│   │   ├── funcoes.repository.ts
│   │   ├── integrantes.repository.ts
│   │   ├── musicas.repository.ts
│   │   ├── tags.repository.ts
│   │   ├── tipos-eventos.repository.ts
│   │   └── tonalidades.repository.ts
│   ├── services/               # NEW: Business logic layer
│   │   ├── artistas.service.ts
│   │   ├── eventos.service.ts
│   │   ├── funcoes.service.ts
│   │   ├── integrantes.service.ts
│   │   ├── musicas.service.ts
│   │   ├── tags.service.ts
│   │   ├── tipos-eventos.service.ts
│   │   └── tonalidades.service.ts
│   ├── controllers/            # REFACTORED: HTTP adapter only
│   │   ├── artistas.controller.ts
│   │   ├── eventos.controller.ts
│   │   ├── funcoes.controller.ts
│   │   ├── home.controller.ts
│   │   ├── integrantes.controller.ts
│   │   ├── musicas.controller.ts
│   │   ├── tags.controller.ts
│   │   ├── tipos-eventos.controller.ts
│   │   └── tonalidades.controller.ts
│   └── routes/                 # RENAMED from router/
│       ├── artistas.routes.ts
│       ├── eventos.routes.ts
│       ├── funcoes.routes.ts
│       ├── home.routes.ts
│       ├── integrantes.routes.ts
│       ├── musicas.routes.ts
│       ├── tags.routes.ts
│       ├── tipos-eventos.routes.ts
│       └── tonalidades.routes.ts
└── index.ts                    # Entry point (UNCHANGED)
```

## Layer Dependency Rules

```text
Route  →  Controller  →  Service  →  Repository  →  Prisma
  ✅ HTTP     ✅ HTTP      ❌ HTTP     ❌ HTTP
  ❌ Prisma   ❌ Prisma    ❌ Prisma   ✅ Prisma
```

- Routes import Controllers only
- Controllers import Services and AppError only
- Services import Repositories and AppError only
- Repositories import Prisma client only

## Validation After Each Module

After refactoring each module, verify:

1. `npm run typecheck` passes with zero errors
2. Manual API testing: all endpoints return same status codes + JSON
3. Error messages are character-for-character identical
