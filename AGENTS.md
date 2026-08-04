# AGENTS.md

Guidance for AI agents and cloud development environments working on **MedLink B2B** (PharmEx).

## Project overview

npm workspaces monorepo (`backend`, `frontend`) for a B2B pharmacy marketplace.

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 6, Tailwind 4, TanStack Query — port **5173** |
| Backend | Node 20+, Express, Prisma, Socket.IO — port **3000** |
| Database | PostgreSQL 16 — port **5432** |

## Cursor Cloud specific instructions

### PostgreSQL (required)

The backend needs a running PostgreSQL instance. Docker is optional; a local install works in Cloud Agent VMs.

```bash
# Start PostgreSQL if not already running (Ubuntu/Debian)
sudo pg_ctlcluster 16 main start

# One-time DB/user setup (matches backend/.env.example)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb pharma_exchange 2>/dev/null || true
```

`DATABASE_URL` in `backend/.env.example` uses `postgresql://postgres:postgres@localhost:5432/pharma_exchange`.

Alternatively, use Docker for Postgres only:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
# Then set DATABASE_URL to postgresql://medlink:medlink@localhost:5432/medlink_b2b?schema=public
```

### First-time setup (after `npm ci`)

```bash
cp backend/.env.example backend/.env    # if missing
cp frontend/.env.example frontend/.env  # if missing
npm run db:generate
npm run db:push
npm run db:seed
```

Seed accounts (password `password123`):

- `buyer@pharmex.bd` — buyer
- `seller@pharmex.bd` — seller (City Pharmacy)
- `admin@pharmex.bd` — admin

`OTP_DEV_MODE=true` in backend `.env` logs OTPs to the console; Firebase is optional in dev.

### Running services

Start backend and frontend in **separate terminals** (or tmux sessions):

```bash
npm run dev:backend   # http://localhost:3000
npm run dev           # http://localhost:5173 (proxies /api and /socket.io to :3000)
```

`npm run dev:all` backgrounds both processes in one shell; separate sessions are easier to debug.

### Verify the stack

```bash
npm run lint
npm test
npm run build
npm run smoke          # API smoke test (backend must be running)
```

Smoke test and health: `http://localhost:3000/health`, Swagger at `http://localhost:3000/api/docs`.

### UI testing notes

- The bottom nav (Home, Search, **Cart**, Chat, Profile) is **mobile-only** (`lg:hidden`). On wide desktop viewports, resize the browser narrow or use DevTools device mode to reach Cart.
- Vite dev server proxies API calls; set `VITE_API_BASE_URL=/api/v1` in `frontend/.env`.

### Gotchas

- Re-running `npm run db:seed` is safe in development; it upserts seed data.
- Backend tests use the same `DATABASE_URL` from `backend/.env`; ensure Postgres is up before `npm test`.
- Prisma client must be generated after schema changes: `npm run db:generate`.
