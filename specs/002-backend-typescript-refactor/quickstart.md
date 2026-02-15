# Quickstart: Backend TypeScript Refactor

**Feature**: 002-backend-typescript-refactor
**Date**: 2026-02-15

## Migration Steps (Sequential)

### 1. Install new dependencies

```bash
cd src/backend

# Add TypeScript tooling
npm install -D typescript tsx @types/express @types/cors @types/node @types/bcryptjs

# Remove replaced dependencies
npm uninstall sucrase
npm uninstall -D nodemon
```

### 2. Create tsconfig.json

Create `src/backend/tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": [
    "index.ts",
    "src/**/*.ts",
    "prisma/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### 3. Update package.json scripts

```json
{
  "scripts": {
    "dev": "tsx watch index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### 4. Delete nodemon.json

```bash
rm nodemon.json
```

### 5. Generate Prisma types

```bash
npx prisma generate
```

### 6. Rename files (.js → .ts)

Rename all 20 files. Import paths stay as `.js` — this is correct for NodeNext resolution.

**Order**: Start with leaf dependencies (Prisma client, controllers) then work up to entry point.

1. `prisma/cliente.js` → `prisma/cliente.ts`
2. All 9 controllers in `src/controllers/*.js` → `*.ts`
3. All 8 routers in `src/router/*.js` → `*.ts`
4. `src/app.js` → `src/app.ts`
5. `index.js` → `index.ts`

### 7. Add type annotations

For each file, add types to function signatures:

**Controllers** — Add `Request`, `Response` types to all methods:
```typescript
import { Request, Response } from 'express';

class exampleController {
    async index(req: Request, res: Response): Promise<void> { ... }
    async show(req: Request<{ id: string }>, res: Response): Promise<void> { ... }
}
```

**Routers** — Add `Router` type:
```typescript
import { Router } from 'express';
const router: Router = Router();
```

**Prisma client** — Add factory function + exported type:
```typescript
import { PrismaClient } from '@prisma/client';

function createPrismaClient() { return new PrismaClient().$extends({...}); }
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;
```

### 8. Verify

```bash
# Type check (should report 0 errors)
npm run typecheck

# Run development server
npm run dev

# Test endpoints manually
curl http://localhost:3000/api/artistas
```

## Key Conventions

| Convention | Rule |
|-----------|------|
| Import extensions | Always use `.js` (even for `.ts` files) |
| Controller methods | `async method(req: Request, res: Response): Promise<void>` |
| Controller exports | `export default new ClassName()` (preserved) |
| Prisma types | Import from `@prisma/client`, never define manually |
| Error responses | `{ errors: string[] }` — keep as-is |
| No `any` | Use specific types or `unknown` with type guards |
