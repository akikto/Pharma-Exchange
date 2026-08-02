# PharmEx — B2B Pharmacy Marketplace

PharmEx is a B2B pharmacy marketplace for Bangladesh, connecting pharmacies as buyers and sellers of medicines.

## Project Structure

```
Pharma-Exchange/
├── docs/
│   └── design-system.md    # Task 3: UI/UX design system
├── backend/                # Task 4: Production backend API
│   ├── prisma/             # Task 1: Database schema
│   └── src/                # Modular clean architecture
├── frontend/               # Task 5: Production React PWA
│   └── src/                # Feature-based frontend
└── package.json
```

## Tasks

| Task | Description | Status |
|------|-------------|--------|
| 1 | Database schema (PostgreSQL + Prisma) | ✅ |
| 2 | API design | ✅ |
| 3 | UI/UX design system | ✅ |
| 4 | Production backend implementation | ✅ |
| 5 | Production frontend (React PWA) | ✅ |
| 6 | Production readiness, security, CI/CD | ✅ |

## Production Readiness (Task 6)

- Security hardening (IDOR fixes, auth, CORS, uploads, Socket.IO)
- Performance: lazy routes, code splitting, DB composite indexes
- CI/CD: `.github/workflows/ci.yml`
- Docker: `backend/Dockerfile`, `docker-compose.yml`
- PWA icons and manifest validation
- Unit tests: 18+ passing (backend + frontend)

### Documentation

| Document | Path |
|----------|------|
| Production Readiness Report | [`docs/production-readiness-report.md`](docs/production-readiness-report.md) |
| Security Report | [`docs/security-report.md`](docs/security-report.md) |
| Performance Report | [`docs/performance-report.md`](docs/performance-report.md) |
| Testing Report | [`docs/testing-report.md`](docs/testing-report.md) |
| Deployment Guide | [`docs/deployment-guide.md`](docs/deployment-guide.md) |
| Play Store Checklist | [`docs/play-store-checklist.md`](docs/play-store-checklist.md) |
| Maintenance Guide | [`docs/maintenance-guide.md`](docs/maintenance-guide.md) |

## Quick Commands

```bash
npm install
npm run build          # Build backend + frontend
npm test               # Run all tests
npm run db:migrate     # Apply Prisma migrations
docker-compose up      # Local full stack
```

## Tech Stack

- **Database**: PostgreSQL 16 + Prisma ORM
- **API**: Node.js 20, Express, TypeScript (clean architecture)
- **Auth**: JWT + Firebase Authentication (Google, OTP, Email)
- **Storage**: Firebase Storage
- **Push**: Firebase Cloud Messaging
- **Real-time**: Socket.IO (chat, typing, read receipts)
- **Jobs**: node-cron (expiry alerts, cleanup)
- **Docs**: Swagger UI at `/api/docs`

## Getting Started

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:generate && npm run db:push && npm run db:seed
npm run dev:backend   # Terminal 1 — API on :3000
npm run dev           # Terminal 2 — Frontend on :5173
```

- API: `http://localhost:3000/api/v1`
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:3000/api/docs`

## Backend Modules

1. **Authentication** — Email/phone login, Firebase auth (Google/OTP), JWT, FCM tokens
2. **Pharmacy Verification** — License/GST upload, admin workflow
3. **Medicine Master** — Catalog CRUD and search
4. **Medicine Listings** — CRUD, pause, price/discount/quantity updates
5. **Marketplace Search** — Name, composition, company, location, expiry, discount filters
6. **Cart** — Grouped by seller
7. **Buy Requests** — Per-seller negotiation with accept/reject
8. **Orders** — Status lifecycle with history
9. **Chat** — REST + Socket.IO real-time messaging with read receipts
10. **Notifications** — In-app + FCM push
11. **Reviews** — Post-delivery ratings
12. **Reports** — User submission + admin moderation
13. **Analytics** — Seller dashboard + platform KPIs
14. **Admin APIs** — Verification queue, reports, users
15. **Background Jobs** — Expiry alerts, buy request expiry, listing cleanup

See [`backend/README.md`](backend/README.md) for full API documentation.

## Design System

The UI/UX design system is documented in [`docs/design-system.md`](docs/design-system.md).
