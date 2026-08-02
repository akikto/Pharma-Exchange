# =============================================================================
# MedLink B2B – Backend Dockerfile
# Multi-stage build: development + production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base – shared dependencies layer
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY backend/package.json backend/

# -----------------------------------------------------------------------------
# Stage 2: Development – hot-reload with tsx
# -----------------------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --workspace=backend
COPY backend ./backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=backend"]

# -----------------------------------------------------------------------------
# Stage 3: Builder – compile TypeScript + Prisma client
# -----------------------------------------------------------------------------
FROM base AS builder
ENV NODE_ENV=production
RUN npm ci --workspace=backend
COPY backend ./backend
RUN npm run build --workspace=backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# -----------------------------------------------------------------------------
# Stage 4: Production – minimal runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S medlink && \
    adduser -S medlink -u 1001 -G medlink

WORKDIR /app

# Runtime dependencies only
RUN apk add --no-cache libc6-compat openssl curl tini

ENV NODE_ENV=production
ENV PORT=3000

# Install production npm packages
COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --workspace=backend --omit=dev && npm cache clean --force

# Copy compiled output, Prisma schema, and generated client
COPY --from=builder --chown=medlink:medlink /app/backend/dist ./backend/dist
COPY --from=builder --chown=medlink:medlink /app/backend/prisma ./backend/prisma
COPY --from=builder --chown=medlink:medlink /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=medlink:medlink /app/node_modules/@prisma ./node_modules/@prisma

# Prisma CLI for migrate deploy in entrypoint (copied from builder devDeps)
COPY --from=builder --chown=medlink:medlink /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=medlink:medlink /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Entrypoint script
COPY --chown=medlink:medlink backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Writable temp directory (read-only root filesystem compatible)
RUN mkdir -p /tmp/medlink && chown -R medlink:medlink /tmp/medlink
ENV TMPDIR=/tmp/medlink

USER medlink

EXPOSE 3000

# Health check – hits the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
