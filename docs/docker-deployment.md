# Docker Deployment Guide — MedLink B2B

Complete instructions for building and running MedLink B2B with Docker on Linux servers.

---

## Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│  frontend (nginx:8080 → host :80)   │
│  • Serves React PWA static files    │
│  • Proxies /api/* → backend       │
│  • Proxies /socket.io/* → backend   │
└──────────────┬──────────────────────┘
               │ medlink-internal network
               ▼
┌─────────────────────────────────────┐
│  backend (Node.js :3000)            │
│  • REST API + Socket.IO             │
│  • Prisma migrations on startup     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  postgres (:5432 internal)          │
│  • PostgreSQL 16                    │
└─────────────────────────────────────┘
```

---

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- Linux server (Ubuntu 22.04+ recommended)
- 2 GB RAM minimum (4 GB recommended)
- Domain name with DNS pointed to server (production)

---

## Quick Start (Production)

### 1. Clone and configure environment

```bash
git clone https://github.com/your-org/medlink-b2b.git
cd medlink-b2b
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
JWT_SECRET=your-64-character-random-secret-here
DB_PASSWORD=strong-database-password
CORS_ALLOWED_ORIGINS=https://yourdomain.com
MSG91_ENABLED=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
FIREBASE_STORAGE_BUCKET=...
```

### 2. Build images

```bash
docker compose build --no-cache
```

### 3. Start all services

```bash
docker compose up -d
```

### 4. Verify health

```bash
docker compose ps
curl http://localhost/health
curl http://localhost/nginx-health
```

### 5. View logs

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

---

## Quick Start (Development)

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service | URL |
|---------|-----|
| Frontend (Vite HMR) | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| PostgreSQL | localhost:5432 |

---

## Build Commands

### Production – build all images

```bash
docker compose build
```

### Production – build individual services

```bash
docker compose build backend
docker compose build frontend
```

### Build with custom frontend env (Firebase, API URL)

```bash
docker compose build frontend \
  --build-arg VITE_FIREBASE_API_KEY=your-key \
  --build-arg VITE_FIREBASE_PROJECT_ID=your-project
```

### Development – build dev targets

```bash
docker compose -f docker-compose.dev.yml build
```

---

## Run Commands

### Start production stack (detached)

```bash
docker compose up -d
```

### Stop all services

```bash
docker compose down
```

### Stop and remove volumes (⚠️ deletes database)

```bash
docker compose down -v
```

### Restart a single service

```bash
docker compose restart backend
```

### Run database migrations manually

```bash
docker compose exec backend npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

### Seed database (development only)

```bash
docker compose -f docker-compose.dev.yml exec backend npm run db:seed --workspace=backend
```

### Open Prisma Studio

```bash
docker compose -f docker-compose.dev.yml exec backend npm run db:studio --workspace=backend
```

---

## Production Deployment (Linux Server)

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Configure firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. TLS with Caddy or Certbot (recommended)

Place a TLS-terminating reverse proxy in front of the frontend container, or use Caddy:

```caddyfile
yourdomain.com {
    reverse_proxy localhost:80
}
```

### 4. Set production environment

```bash
export JWT_SECRET=$(openssl rand -hex 32)
export DB_PASSWORD=$(openssl rand -hex 16)
```

Add to `.env` or use Docker secrets.

### 5. Deploy

```bash
docker compose pull   # if using a registry
docker compose up -d --build
```

### 6. Post-deploy checks

```bash
curl -f https://yourdomain.com/health
curl -f https://yourdomain.com/api/v1/medicines
docker compose ps    # all services "healthy"
```

---

## Health Checks

| Service | Endpoint | Interval |
|---------|----------|----------|
| Frontend (nginx) | `GET /nginx-health` | 30s |
| Backend API | `GET /health` | 30s |
| PostgreSQL | `pg_isready` | 10s |

Check status:

```bash
docker inspect --format='{{.State.Health.Status}}' medlink-backend
docker inspect --format='{{.State.Health.Status}}' medlink-frontend
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| Non-root users | `medlink` (backend), `nginx` (frontend) |
| Read-only filesystem | `read_only: true` on backend + frontend |
| No new privileges | `security_opt: no-new-privileges:true` |
| Minimal base images | `node:20-alpine`, `nginx:1.27-alpine`, `postgres:16-alpine` |
| Internal networking | Backend and DB not exposed to host in production |
| Rate limiting | Nginx `limit_req` on API routes |
| Security headers | X-Frame-Options, CSP-ready headers in nginx |
| Secret management | All secrets via `.env` (never in images) |
| Process init | `tini` on backend for proper signal handling |

---

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | Persistent PostgreSQL data (production) |
| `postgres_dev_data` | Dev database |
| `backend_node_modules` | Cached npm modules (dev) |
| `frontend_node_modules` | Cached npm modules (dev) |

Backup database:

```bash
docker compose exec postgres pg_dump -U medlink medlink_b2b > backup.sql
```

Restore:

```bash
cat backup.sql | docker compose exec -T postgres psql -U medlink medlink_b2b
```

---

## Logging

All services use JSON-file logging driver with rotation:

- Backend: 20 MB × 5 files
- Frontend / Postgres: 10 MB × 3 files

View logs:

```bash
docker compose logs --tail=100 backend
```

---

## Troubleshooting

### Backend won't start – database connection

```bash
docker compose logs postgres
docker compose exec backend npx prisma migrate status --schema=backend/prisma/schema.prisma
```

### Frontend shows 502 on API calls

```bash
docker compose ps backend   # must be "healthy"
docker compose logs backend
```

### WebSocket connection fails

Ensure nginx proxies `/socket.io/` with `Upgrade` headers (configured in `docker/nginx.conf`).

### Prisma migration errors

```bash
docker compose exec backend npx prisma migrate reset --schema=backend/prisma/schema.prisma  # dev only!
```

---

## File Reference

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Multi-stage: builder + nginx production + vite dev |
| `backend/Dockerfile` | Multi-stage: development + production |
| `docker-compose.yml` | Production stack |
| `docker-compose.dev.yml` | Development stack with hot reload |
| `docker/nginx.conf` | Nginx: SPA + API proxy + WebSocket |
| `backend/docker-entrypoint.sh` | DB wait + migrations + server start |
| `frontend/.dockerignore` | Frontend build context exclusions |
| `backend/.dockerignore` | Backend build context exclusions |
| `.dockerignore` | Root monorepo build exclusions |
