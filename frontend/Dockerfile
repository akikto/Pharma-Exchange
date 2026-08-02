# =============================================================================
# MedLink B2B – Frontend Dockerfile
# Multi-stage: Node builder → Nginx production server
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder – compile React + Vite PWA
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Install dependencies (cache layer)
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
RUN npm ci --workspace=frontend

# Copy source and build
COPY frontend ./frontend

# Build-time environment variables (Vite embeds these at compile time)
ARG VITE_APP_NAME="MedLink B2B"
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_SOCKET_URL=
ARG VITE_FIREBASE_API_KEY=
ARG VITE_FIREBASE_AUTH_DOMAIN=
ARG VITE_FIREBASE_PROJECT_ID=
ARG VITE_FIREBASE_STORAGE_BUCKET=
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=
ARG VITE_FIREBASE_APP_ID=

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

RUN npm run build --workspace=frontend

# -----------------------------------------------------------------------------
# Stage 2: Development – Vite dev server with hot reload
# -----------------------------------------------------------------------------
FROM node:20-alpine AS development

WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
RUN npm ci --workspace=frontend
COPY frontend ./frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace=frontend", "--", "--host", "0.0.0.0", "--port", "5173"]

# -----------------------------------------------------------------------------
# Stage 3: Production – Nginx serves static PWA + proxies API (via compose nginx)
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Security: remove default config, use custom
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config (API proxy + SPA + WebSocket)
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built static assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Writable paths for non-root nginx on port 8080
RUN mkdir -p /var/cache/nginx /var/log/nginx /tmp/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /tmp/nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Run as non-root nginx user
USER nginx

EXPOSE 8080

# Health check – nginx internal endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
