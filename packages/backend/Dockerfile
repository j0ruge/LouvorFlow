# =============================================================================
# LouvorFlow Backend — Multi-stage Dockerfile (yarn workspaces)
# =============================================================================
# Build context: repository root (context: .)
# Build command: docker build -f packages/backend/Dockerfile .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root files (lockfile + root package.json)
COPY package.json yarn.lock ./

# Copy backend package.json for workspace resolution
COPY packages/backend/package.json packages/backend/package.json

# Install all dependencies (yarn workspaces hoists to root node_modules)
RUN yarn install --frozen-lockfile

# Copy Prisma schema and generate client (DB_URL dummy — generate não conecta)
COPY packages/backend/prisma/ packages/backend/prisma/
COPY packages/backend/prisma.config.ts packages/backend/prisma.config.ts
RUN cd packages/backend && DB_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate

# Copy backend source code
COPY packages/backend/ packages/backend/

# Build TypeScript
RUN cd packages/backend && yarn run build

# ---------------------------------------------------------------------------
# Stage 2: Runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy workspace root for node_modules resolution
COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/package.json package.json

# Copy backend build artifacts
COPY --from=builder /app/packages/backend/dist/ packages/backend/dist/
COPY --from=builder /app/packages/backend/prisma/ packages/backend/prisma/
COPY --from=builder /app/packages/backend/prisma.config.ts packages/backend/prisma.config.ts
COPY --from=builder /app/packages/backend/package.json packages/backend/package.json
COPY --from=builder /app/packages/backend/node_modules/ packages/backend/node_modules/

# Copy seeds for admin bootstrap
COPY --from=builder /app/packages/backend/seeds/ packages/backend/seeds/

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "packages/backend/dist/index.js"]
