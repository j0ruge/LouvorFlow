# Research: Backend TypeScript Refactor

**Feature**: 002-backend-typescript-refactor
**Date**: 2026-02-15

## Decision 1: Development Runtime — Sucrase Replacement

**Decision**: Use **tsx** for development, replacing both Sucrase and nodemon.

**Rationale**:
- tsx is esbuild-based (same approach as Sucrase — type stripping without type checking), so the mental model is identical
- `tsx watch` replaces both `nodemon` and `sucrase/register` in a single tool
- Zero configuration required — no `nodemon.json`, no `-r sucrase/register`
- Actively maintained with excellent Node.js ESM support
- ts-node has known ESM compatibility issues with Node.js 20+ and is effectively deprecated for new projects
- Node.js native `--experimental-strip-types` (Node 24) is still experimental and ignores `tsconfig.json`

**Alternatives considered**:
- **ts-node**: Rejected — ESM compatibility issues on Node.js 20+, slow (uses tsc internally), stale maintenance
- **Node.js native TypeScript (v24 `--experimental-strip-types`)**: Rejected — still experimental, ignores tsconfig.json, no path alias support
- **Keep Sucrase**: Rejected — Sucrase doesn't understand TypeScript syntax beyond type stripping; tsx provides equivalent speed with proper `.ts` file support

## Decision 2: Production Build Strategy

**Decision**: Use **tsc** (standard TypeScript compiler) for production builds, run with plain `node`.

**Rationale**:
- For a 20-file backend, tsc produces clean 1:1 JavaScript output in `dist/` — no bundler complexity needed
- Production runs with `node dist/index.js` — fastest startup, zero runtime overhead
- tsc provides type checking as part of the build step, catching errors before deployment
- Build output is human-readable and debuggable

**Alternatives considered**:
- **tsx in production**: Rejected — adds ~30ms startup overhead from esbuild initialization, doesn't type-check
- **esbuild/SWC bundling**: Rejected — unnecessary complexity for 20 files; bundlers are for frontends or monorepos

## Decision 3: Express 5 Types

**Decision**: Use `@types/express@5` (v5.0.6+) for Express 5.1 compatibility.

**Rationale**:
- `@types/express@5` is the official community type package for Express 5.x
- Provides correct types for `Request<Params, ResBody, ReqBody, Query>` generics
- Compatible with Express 5's changed `req.params` behavior (may return `undefined` for missing params)

**Key import pattern**:
```typescript
import express, { Request, Response, Router } from 'express';
```

## Decision 4: TypeScript Configuration

**Decision**: Use `"module": "NodeNext"` with `"moduleResolution": "NodeNext"`.

**Rationale**:
- Matches Node.js actual module resolution algorithm at runtime
- Requires `.js` extensions in imports — which the current codebase already uses (e.g., `import app from './src/app.js'`)
- Supports `package.json` `"exports"` field
- `"ESNext"` uses generic ESM resolution that may misresolve at runtime on Node.js

**Key tsconfig settings**:
- `"target": "ES2022"` — matches Node 24 capabilities
- `"strict": true` — enforces type safety (the whole point of the migration)
- `"outDir": "./dist"` — production build output
- `"skipLibCheck": true` — avoids checking `node_modules` types for faster builds

## Decision 5: Prisma Client Extension Typing

**Decision**: Use a factory function pattern with `ReturnType` to properly type the extended Prisma client.

**Rationale**:
- `PrismaClient.$extends()` returns a new type that is NOT `PrismaClient` — it's an extended type
- Passing the extended client as a parameter typed as `PrismaClient` causes type errors
- The factory function + `ReturnType<typeof createPrismaClient>` pattern is recommended by Prisma documentation
- Prisma-generated types from `@prisma/client` provide model types automatically after `prisma generate`

**Pattern**:
```typescript
import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
    return new PrismaClient().$extends({
        query: {
            integrantes: {
                async $allOperations({ args, query }) {
                    const result = await query(args);
                    // ... strip senha ...
                    return result;
                }
            }
        }
    });
}

const prisma = createPrismaClient();
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;
export default prisma;
```

## Decision 6: Import Extension Convention

**Decision**: Keep `.js` extensions in all TypeScript imports.

**Rationale**:
- With `"module": "NodeNext"`, TypeScript requires `.js` extensions in import paths even when the source files are `.ts`
- The current codebase already uses `.js` extensions everywhere (e.g., `import prisma from '../../prisma/cliente.js'`)
- After renaming `.js` → `.ts`, the import paths stay as `.js` — this is the correct TypeScript convention for NodeNext resolution
- Zero friction migration — no import paths need to change

## Decision 7: Controller Method Typing Strategy

**Decision**: Type controller methods with `Request` and `Response` from Express, using `Promise<void>` return type. Use `Record<string, string>` for dynamic update objects.

**Rationale**:
- All controller methods follow the Express `(req, res) => void` pattern
- Methods return `res.status(N).json(...)` which returns `void` to the router
- For methods with path parameters, use `Request<{ id: string }>` generic
- Prisma already infers return types from queries — no need to manually type query results
- Dynamic `updateData` objects (used in update methods) need `Record<string, unknown>` or Prisma's generated `UpdateInput` types

## Decision 8: Handling `any` in the Prisma $extends Middleware

**Decision**: Use `Record<string, unknown>` for the password-stripping middleware, with targeted type assertions where necessary.

**Rationale**:
- The `$allOperations` callback receives and returns mixed types (single objects, arrays, counts)
- Using `any` would violate SC-005 ("No usage of `any` type as an escape hatch in business logic")
- `Record<string, unknown>` with a runtime `typeof obj === 'object'` check matches the current JavaScript pattern exactly
- The middleware's runtime behavior is simple (delete a property) and doesn't benefit from deep typing

## Summary of Package Changes

**Add (devDependencies)**:
- `typescript` ^5.7.0
- `tsx` ^4.19.0
- `@types/express` ^5.0.0
- `@types/cors` ^2.8.0
- `@types/node` ^22.0.0
- `@types/bcryptjs` ^2.4.0

**Remove**:
- `sucrase` (from dependencies)
- `nodemon` (from devDependencies)

**Remove file**: `nodemon.json`

**Updated `package.json` scripts**:
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
