# MedLink B2B – Pharmacy Exchange Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

> A secure B2B marketplace where verified pharmacies can buy, sell, and exchange medicines — especially overstock and short-expiry inventory — with other verified pharmacies.

---

## Description

**MedLink B2B** is a production-grade pharmacy exchange platform built for regulated B2B trade. It connects licensed pharmacies through a trusted network where sellers can list surplus or near-expiry stock, buyers can discover medicines at competitive prices, and both parties can negotiate, order, and communicate in real time.

The platform enforces **pharmacy verification** before any selling activity, supports the full trade lifecycle from listing to order fulfillment, and ships as a **Progressive Web App (PWA)** with offline-ready assets, push notifications, and a responsive mobile-first interface.

**Primary use cases:**

- Reduce medicine waste by redistributing overstock and short-expiry inventory
- Enable pharmacies to source medicines quickly from verified peers
- Provide admin oversight for license verification, reports, and platform analytics

---

## Features

| Feature | Description |
|---------|-------------|
| **Pharmacy Verification** | License and document upload with admin approval workflow |
| **Medicine Marketplace** | Browse verified pharmacy listings with filters and sorting |
| **Smart Search** | Search by name, composition, company, city, price, expiry, and discount |
| **Medicine Listings** | Sellers create, edit, pause, and manage inventory with batch/expiry data |
| **Cart** | Add items grouped by seller; validate MOQ and stock |
| **Buy Requests** | Send per-seller buy requests; sellers accept or reject |
| **Orders** | Full order lifecycle with status history and cancellation |
| **Real-time Chat** | Socket.IO messaging with typing indicators and read receipts |
| **Notifications** | In-app notifications and Firebase Cloud Messaging (FCM) push |
| **Seller Dashboard** | Analytics, pending requests, inventory alerts, and quick actions |
| **Buyer Dashboard** | Orders, buy requests, cart, and marketplace browsing |
| **Admin Panel** | Verification queue, reports moderation, users, and platform KPIs |
| **Reviews & Ratings** | Post-delivery pharmacy ratings |
| **Analytics** | Seller metrics and platform-wide GMV/order statistics |
| **PWA Support** | Installable app, service worker, manifest, and offline shell |
| **Dark Mode** | System-aware theme toggle |
| **Responsive UI** | Mobile-first layout optimized for pharmacy staff on the go |

---

## Screenshots

> Replace the placeholders below with actual screenshots after deployment.

| Home / Marketplace | Medicine Detail | Seller Dashboard |
|:---:|:---:|:---:|
| ![Home Screen](docs/screenshots/home.png) | ![Medicine Detail](docs/screenshots/medicine-detail.png) | ![Seller Dashboard](docs/screenshots/seller-dashboard.png) |

| Cart | Chat | Admin Panel |
|:---:|:---:|:---:|
| ![Cart](docs/screenshots/cart.png) | ![Chat](docs/screenshots/chat.png) | ![Admin](docs/screenshots/admin.png) |

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Vite 6](https://vitejs.dev/) | Build tool and dev server |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [Radix UI](https://www.radix-ui.com/) | Accessible UI primitives (shadcn-style components) |
| [TanStack Query](https://tanstack.com/query) | Server state and caching |
| [Zustand](https://zustand.docs.pmnd.rs/) | Client state (auth, theme) |
| [React Router 7](https://reactrouter.com/) | Client-side routing |
| [Socket.IO Client](https://socket.io/) | Real-time chat |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | PWA and service worker |

### Backend

| Technology | Purpose |
|------------|---------|
| [Node.js 20+](https://nodejs.org/) | Runtime |
| [Express 4](https://expressjs.com/) | HTTP API framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Prisma](https://www.prisma.io/) | ORM and database migrations |
| [PostgreSQL 16](https://www.postgresql.org/) | Primary relational database |
| [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) | Auth token verification, storage, FCM |
| [Firebase Storage](https://firebase.google.com/docs/storage) | Secure file uploads (licenses, images) |
| [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) | Push notifications |
| [Socket.IO](https://socket.io/) | Real-time messaging |
| [Zod](https://zod.dev/) | Request validation |
| [Winston](https://github.com/winstonjs/winston) | Structured logging |
| [node-cron](https://github.com/node-cron/node-cron) | Background jobs (expiry alerts, cleanup) |
| [Swagger UI](https://swagger.io/tools/swagger-ui/) | API documentation (development) |

### DevOps & Tooling

- **Docker** — Containerized backend deployment
- **GitHub Actions** — CI pipeline (build, test, Prisma validate)
- **Vitest** — Unit and integration testing
- **Vercel** — Frontend hosting (configured via `frontend/vercel.json`)

---

## Project Structure

```
MedLink-B2B/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI: build, test, lint
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.ts                # Seed data
│   │   └── migrations/            # SQL migrations
│   ├── src/
│   │   ├── config/                # Env, database, Firebase
│   │   ├── modules/               # Domain modules (15 modules)
│   │   │   ├── auth/
│   │   │   ├── pharmacy/
│   │   │   ├── medicine/
│   │   │   ├── listing/
│   │   │   ├── cart/
│   │   │   ├── buy-request/
│   │   │   ├── order/
│   │   │   ├── chat/
│   │   │   ├── notification/
│   │   │   ├── review/
│   │   │   ├── report/
│   │   │   ├── analytics/
│   │   │   ├── admin/
│   │   │   └── upload/
│   │   ├── jobs/                  # Cron background jobs
│   │   ├── socket/                # Socket.IO handlers
│   │   ├── shared/                # Middleware, errors, utils
│   │   ├── app.ts                 # Express app factory
│   │   └── server.ts              # HTTP + WebSocket bootstrap
│   ├── tests/                     # Backend tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── icons/                 # PWA icons
│   ├── src/
│   │   ├── app/                   # Router, providers
│   │   ├── components/            # Shared UI components
│   │   ├── features/              # Feature-based screens
│   │   ├── hooks/                 # React Query hooks
│   │   ├── lib/                   # API client, socket, utils
│   │   └── stores/                # Zustand stores
│   ├── tests/                     # Frontend tests
│   ├── vercel.json
│   └── .env.example
├── docs/                          # Design system, reports, guides
├── docker-compose.yml             # Local PostgreSQL + backend
├── package.json                   # Monorepo workspaces
└── LICENSE
```

---

## Installation

### Prerequisites

- **Node.js** 20 or later
- **npm** 9 or later
- **PostgreSQL** 16 (local or Docker)
- **Firebase project** (optional for dev; required for production auth/storage/FCM)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/medlink-b2b.git
cd medlink-b2b
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit both files with your local values (see [Environment Variables](#environment-variables)).

### 4. Set Up Database

```bash
# Start PostgreSQL (Docker)
docker-compose up -d postgres

# Generate Prisma client, apply schema, seed data
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Run Development Server

**Terminal 1 — Backend API (port 3000):**

```bash
npm run dev:backend
```

**Terminal 2 — Frontend (port 5173):**

```bash
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

**URLs:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API (v1) | http://localhost:3000/api/v1 |
| API Docs | http://localhost:3000/api/docs |
| Health | http://localhost:3000/health |

### 6. Build for Production

```bash
npm run build
```

Output:

- Backend: `backend/dist/`
- Frontend: `frontend/dist/`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/pharma_exchange`) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (minimum 32 random characters) |
| `JWT_EXPIRES_IN` | No | Access token expiry (default: `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: `30d`) |
| `PORT` | No | HTTP server port (default: `3000`) |
| `NODE_ENV` | No | `development`, `production`, or `test` |
| `OTP_EXPIRY_MINUTES` | No | OTP validity window (default: `10`) |
| `OTP_DEV_MODE` | No | Log OTP to console in dev (must be `false` in production) |
| `FIREBASE_PROJECT_ID` | Prod | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Prod | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Prod | Firebase service account private key |
| `FIREBASE_STORAGE_BUCKET` | Prod | Firebase Storage bucket name |
| `CORS_ORIGIN` | Yes | Allowed frontend origin(s), comma-separated (no `*` in production) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: `900000`) |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: `100`) |
| `LOG_LEVEL` | No | Winston log level: `error`, `warn`, `info`, `debug` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | API base path (dev: `/api/v1`; prod: full URL) |
| `VITE_SOCKET_URL` | No | Socket.IO server URL (defaults to same origin) |

---

## Database

MedLink B2B uses **PostgreSQL 16** as the primary database, managed with **Prisma ORM**.

### Architecture

- **Relational model** — Users, pharmacies, medicines, listings, orders, and chat are normalized across ~20 tables
- **Enums** — Strong typing for order status, verification status, listing status, message types
- **Indexes** — Composite indexes on hot query paths (listings search, orders, buy requests)
- **Migrations** — Version-controlled SQL migrations in `backend/prisma/migrations/`

### Key Entities

| Entity | Description |
|--------|-------------|
| `User` | Account with email/phone, role (USER/ADMIN), auth provider |
| `Pharmacy` | Business profile with license, verification status, location |
| `Medicine` | Master catalog (name, composition, company, dosage form) |
| `Listing` | Seller inventory item with batch, expiry, pricing, quantity |
| `BuyRequest` | Buyer-initiated purchase request to a specific seller |
| `Order` | Confirmed transaction with status history |
| `Conversation` / `Message` | Real-time chat between pharmacy users |
| `Notification` | In-app and push notification records |

### Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply migrations (development)
npm run db:push        # Push schema without migration (prototyping)
npm run db:seed        # Seed sample data
npm run db:studio      # Open Prisma Studio GUI
```

Production: `npx prisma migrate deploy` inside `backend/`.

---

## API

The backend exposes a REST API at `/api/v1` with 15 domain modules.

### Base URL

```
http://localhost:3000/api/v1
```

Legacy aliases are also available at `/api/*` for backward compatibility.

### Module Overview

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Register, login, OTP, Firebase, refresh, profile |
| Pharmacies | `/pharmacies` | Registration, documents, public profile |
| Medicines | `/medicines` | Catalog search and admin CRUD |
| Listings | `/listings` | Marketplace search, seller inventory, CRUD |
| Cart | `/cart` | Add, update, remove items |
| Buy Requests | `/buy-requests` | Create, list, respond (accept/reject) |
| Orders | `/orders` | List, detail, status updates, cancel |
| Chat | `/chat` | Conversations and messages |
| Notifications | `/notifications` | List, mark read, FCM tokens |
| Reviews | `/reviews` | Create and list pharmacy reviews |
| Reports | `/reports` | Submit user reports |
| Analytics | `/analytics` | Seller dashboard metrics |
| Admin | `/admin` | Verifications, reports, users, KPIs |
| Upload | `/upload` | Image and document uploads |
| Health | `/health` | Service health check |

### API Documentation

Interactive Swagger UI is available in development:

```
http://localhost:3000/api/docs
```

See [`backend/README.md`](backend/README.md) and [`docs/deployment-guide.md`](docs/deployment-guide.md) for full endpoint reference.

### Real-time (Socket.IO)

| Event | Description |
|-------|-------------|
| `join:conversation` | Join a chat room (membership verified) |
| `message:send` | Send a message |
| `message:read` | Mark messages as read |
| `typing:start` / `typing:stop` | Typing indicators |

Authenticate via JWT in the Socket.IO handshake: `auth: { token }`.

---

## Authentication

MedLink B2B supports multiple authentication methods:

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Email + Password** | `POST /auth/login` | Standard credential login |
| **Phone + Password** | `POST /auth/login` | Login with phone number |
| **Registration + OTP** | `POST /auth/register` → `POST /auth/verify-otp` | Email/phone signup with verification |
| **OTP Login** | `POST /auth/send-otp` → `POST /auth/verify-otp` | Passwordless login |
| **Firebase Auth** | `POST /auth/firebase` | Google, phone, or email via Firebase ID token |
| **Refresh Token** | `POST /auth/refresh` | Rotate access token |

### Token Flow

1. Client receives `accessToken` (short-lived) and `refreshToken` (long-lived)
2. Access token sent in `Authorization: Bearer <token>` header
3. On 401, client refreshes via `/auth/refresh`
4. Socket.IO uses the same JWT for WebSocket authentication

### Authorization

- **Buyer** — Browse, cart, buy requests, orders, chat
- **Seller** — Requires verified pharmacy (`APPROVED` status)
- **Admin** — Verification queue, reports, user management, platform analytics

---

## Deployment

### Frontend (Vercel)

1. Connect the repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variables (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`)
4. Deploy — `frontend/vercel.json` handles SPA rewrites and security headers

### Backend (Docker)

```bash
docker build -f backend/Dockerfile -t medlink-api .
docker run -p 3000:3000 --env-file backend/.env medlink-api
```

### Full Stack (Docker Compose)

```bash
docker-compose up --build
```

### Database

```bash
cd backend && npx prisma migrate deploy
```

### Post-Deploy Checklist

- [ ] HTTPS enabled on frontend and API
- [ ] `CORS_ORIGIN` set to production domain
- [ ] `OTP_DEV_MODE=false`
- [ ] Firebase credentials configured
- [ ] `prisma migrate deploy` completed
- [ ] Health check monitoring on `/health`

Full guide: [`docs/deployment-guide.md`](docs/deployment-guide.md)

---

## Security

| Measure | Implementation |
|---------|----------------|
| Authentication | JWT with refresh token rotation |
| Authorization | Role-based access; IDOR protection on orders/buy-requests |
| Pharmacy trust | Only verified pharmacies can sell; marketplace filters unverified sellers |
| Input validation | Zod schemas on all request bodies |
| Rate limiting | `express-rate-limit` on API and auth endpoints |
| Security headers | Helmet (CSP, HSTS in production) |
| CORS | Configurable allowed origins |
| File uploads | Private Firebase Storage with signed URLs |
| Socket.IO | JWT auth + conversation membership verification |
| OTP | Cryptographically secure generation; dev mode blocked in production |
| Secrets | Environment variables; never committed to source control |

Full report: [`docs/security-report.md`](docs/security-report.md)

---

## Performance

| Optimization | Details |
|--------------|---------|
| **Code splitting** | React.lazy on all routes; manual vendor/query/ui chunks |
| **PWA caching** | Workbox precache + NetworkFirst for listings search |
| **Database indexes** | Composite indexes on listings, orders, buy requests |
| **API pagination** | Default 20 items, max 100 per page |
| **Query caching** | TanStack Query with 30s stale time |
| **Asset caching** | Immutable cache headers for `/assets/*` on Vercel |
| **Bundle size** | Main chunk ~86 KB gzip; PWA precache ~573 KB |

Full report: [`docs/performance-report.md`](docs/performance-report.md)

---

## Testing

### Run All Tests

```bash
npm test
```

### Run by Workspace

```bash
npm run test:backend     # 17 tests — unit + integration
npm run test:frontend    # 7 tests — unit + component
```

### Watch Mode

```bash
npm run test:watch --workspace=backend
npm run test:watch --workspace=frontend
```

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

- Backend: `tsc` build, Vitest, Prisma validate
- Frontend: `tsc` build, Vitest

### Coverage Areas

| Area | Framework | Tests |
|------|-----------|-------|
| Helpers, OTP, pricing | Vitest | Unit |
| Authorization logic | Vitest | Unit |
| Health endpoint | Supertest | Integration |
| UI utilities, components | Vitest + Testing Library | Unit/Component |

Full report: [`docs/test-coverage-summary.md`](docs/test-coverage-summary.md)

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository and create a feature branch from `main`
2. **Follow conventions** — match existing code style, module structure, and naming
3. **Write tests** for new features and bug fixes
4. **Run checks** before submitting:
   ```bash
   npm run build
   npm test
   npm run lint
   ```
5. **Open a Pull Request** with a clear description of changes
6. **Keep PRs focused** — one feature or fix per pull request

### Branch Naming

```
feature/<short-description>
fix/<short-description>
docs/<short-description>
```

### Commit Messages

Use clear, imperative commit messages:

```
feat: add pharmacy bulk import endpoint
fix: restore inventory on order cancellation
docs: update deployment checklist
```

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

---

## Roadmap

| Priority | Item |
|----------|------|
| High | E2E tests with Playwright |
| High | SMS/email OTP delivery integration |
| High | Payment gateway integration |
| Medium | Geo/radius search for nearby pharmacies |
| Medium | Firebase Google login UI |
| Medium | Redis-backed rate limiting and Socket.IO adapter |
| Medium | Play Store TWA / Capacitor wrapper |
| Low | Multi-language UI (Bengali) |
| Low | Advanced analytics dashboards |
| Low | Medicine bulk import (CSV/Excel) |
| Low | Deprecate legacy `/api/*` routes |

---

## Support

### Report Issues

- **Bug reports** — Open a [GitHub Issue](https://github.com/your-org/medlink-b2b/issues) with steps to reproduce, expected vs. actual behavior, and environment details
- **Feature requests** — Open an issue with the `enhancement` label
- **Security vulnerabilities** — Please report privately via email rather than public issues

### Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/deployment-guide.md) | Production deployment steps |
| [Maintenance Guide](docs/maintenance-guide.md) | Operations and monitoring |
| [Design System](docs/design-system.md) | UI/UX guidelines |
| [Known Limitations](docs/known-limitations.md) | Current gaps and workarounds |
| [Play Store Checklist](docs/play-store-checklist.md) | Mobile distribution guide |

---

## Acknowledgements

MedLink B2B is built with these excellent open-source projects:

- [React](https://react.dev/) — UI library
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — CSS framework
- [Radix UI](https://www.radix-ui.com/) — Accessible primitives
- [TanStack Query](https://tanstack.com/query) — Async state management
- [Zustand](https://zustand.docs.pmnd.rs/) — Client state
- [Express](https://expressjs.com/) — HTTP server
- [Prisma](https://www.prisma.io/) — Database ORM
- [PostgreSQL](https://www.postgresql.org/) — Database
- [Socket.IO](https://socket.io/) — Real-time communication
- [Firebase](https://firebase.google.com/) — Auth, storage, and push notifications
- [Zod](https://zod.dev/) — Schema validation
- [Vitest](https://vitest.dev/) — Testing framework
- [Winston](https://github.com/winstonjs/winston) — Logging
- [Lucide](https://lucide.dev/) — Icons
- [Workbox](https://developer.chrome.com/docs/workbox/) — Service worker (via vite-plugin-pwa)

---

<p align="center">
  <strong>MedLink B2B</strong> — Connecting verified pharmacies. Reducing waste. Improving access.
</p>
