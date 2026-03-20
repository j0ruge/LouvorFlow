# =============================================================================
# LouvorFlow Frontend — Multi-stage Dockerfile (yarn workspaces)
# =============================================================================
# Build context: repository root (context: .)
# Build command: docker build -f packages/frontend/Dockerfile \
#   --build-arg VITE_API_BASE_URL=https://api.example.com/api .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Build-time arguments (VITE_* are embedded in the JS bundle)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy workspace root files (lockfile + root package.json)
COPY package.json yarn.lock ./

# Copy frontend package.json for workspace resolution
COPY packages/frontend/package.json packages/frontend/package.json

# Install all dependencies (yarn workspaces hoists to root node_modules)
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY packages/frontend/ packages/frontend/

# Build Vite production bundle
RUN cd packages/frontend && yarn run build

# ---------------------------------------------------------------------------
# Stage 2: Runtime (nginx)
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Copy built assets to nginx html directory
COPY --from=builder /app/packages/frontend/dist/ /usr/share/nginx/html/

# Copy custom nginx configuration for SPA routing
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -fsS http://localhost:80/index.html > /dev/null || exit 1
