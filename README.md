# 1. Project Title

# MedLink B2B – Pharmacy Exchange Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

---

# 2. Description

**MedLink B2B** is a secure B2B marketplace where **verified pharmacies** can buy, sell, and exchange medicines — especially **overstock** and **short-expiry stock** — with other verified pharmacies.

Built for regulated pharmacy trade, MedLink B2B connects licensed sellers and buyers through a trusted network. Sellers list surplus or near-expiry inventory; buyers search, negotiate, and purchase through a structured workflow of carts, buy requests, and orders — all backed by real-time chat, push notifications, and admin oversight.

**Why MedLink B2B?**

- **Reduce waste** — Redistribute overstock before expiry
- **Improve access** — Help pharmacies source medicines quickly from verified peers
- **Ensure trust** — Only verified pharmacies can sell on the platform
- **Work anywhere** — Installable PWA with dark mode and responsive mobile UI

---

# 3. Features

- **Pharmacy Verification** — License and document upload with admin approval workflow
- **Medicine Marketplace** — Browse listings from verified pharmacies with filters and sorting
- **Smart Search** — Search by medicine name, composition, company, city, price, expiry, and discount
- **Medicine Listings** — Create, edit, pause, and manage inventory with batch and expiry tracking
- **Cart** — Add items grouped by seller with MOQ and stock validation
- **Buy Requests** — Send per-seller purchase requests; sellers accept or reject
- **Orders** — Full order lifecycle with status history, seller updates, and buyer cancellation
- **Real-time Chat** — Socket.IO messaging with typing indicators and read receipts
- **Notifications** — In-app alerts and Firebase Cloud Messaging (FCM) push notifications
- **Seller Dashboard** — Sales analytics, pending requests, inventory alerts, and quick actions
- **Buyer Dashboard** — Marketplace browsing, cart, orders, and buy request tracking
- **Admin Panel** — Verification queue, report moderation, user management, and platform KPIs
- **Reviews & Ratings** — Post-delivery pharmacy ratings and feedback
- **Analytics** — Seller performance metrics and platform-wide GMV statistics
- **PWA Support** — Installable app with service worker, manifest, and offline shell
- **Dark Mode** — Light/dark theme toggle with persistent preference
- **Responsive UI** — Mobile-first design optimized for pharmacy staff on the go

---

# 4. Screenshots

> Replace placeholders with actual screenshots after deployment.

| Home / Marketplace | Medicine Detail | Seller Dashboard |
|:---:|:---:|:---:|
| ![Home Screen](docs/screenshots/home.png) | ![Medicine Detail](docs/screenshots/medicine-detail.png) | ![Seller Dashboard](docs/screenshots/seller-dashboard.png) |

| Cart | Real-time Chat | Admin Panel |
|:---:|:---:|:---:|
| ![Cart](docs/screenshots/cart.png) | ![Chat](docs/screenshots/chat.png) | ![Admin Panel](docs/screenshots/admin.png) |

| Buyer Orders | Pharmacy Verification | PWA Install |
|:---:|:---:|:---:|
| ![Orders](docs/screenshots/orders.png) | ![Verification](docs/screenshots/verification.png) | ![PWA](docs/screenshots/pwa.png) |

---

# 5. Technology Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| [React](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible component library (Radix UI + Tailwind) |

**Additional frontend libraries:** TanStack Query, Zustand, React Router, Socket.IO Client, vite-plugin-pwa, Lucide Icons

## Backend

| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) | Server runtime |
| [Express](https://expressjs.com/) / [Fastify](https://fastify.dev/) | HTTP API framework (Express in current implementation) |
| [Firebase Auth](https://firebase.google.com/docs/auth) | Identity verification (Google, phone, email) |
| [Firestore](https://firebase.google.com/docs/firestore) | Firebase document database (ecosystem integration) |
| [Firebase Storage](https://firebase.google.com/docs/storage) | Secure file uploads (licenses, images) |
| [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) | Push notifications |
| [Socket.IO](https://socket.io/) | Real-time chat and live events |

**Additional backend libraries:** Prisma ORM, PostgreSQL, Zod, Winston, node-cron, Swagger UI, Vitest

---

# 6. Project Structure

```
MedLink-B2B/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── seed.ts                   # Seed data
│   │   └── migrations/               # SQL migrations
│   ├── src/
│   │   ├── config/                   # Environment, DB, Firebase
│   │   ├── modules/                  # 15 domain modules
│   │   │   ├── auth/                 # Authentication & OTP
│   │   │   ├── pharmacy/             # Pharmacy registration & verification
│   │   │   ├── medicine/             # Medicine master catalog
│   │   │   ├── listing/              # Marketplace listings
│   │   │   ├── cart/                 # Shopping cart
│   │   │   ├── buy-request/          # Buy request negotiation
│   │   │   ├── order/                # Order management
│   │   │   ├── chat/                 # REST chat endpoints
│   │   │   ├── notification/         # In-app & FCM notifications
│   │   │   ├── review/               # Reviews & ratings
│   │   │   ├── report/               # User reports
│   │   │   ├── analytics/            # Seller & platform analytics
│   │   │   ├── admin/                # Admin APIs
│   │   │   └── upload/               # File uploads
│   │   ├── jobs/                     # Background cron jobs
│   │   ├── socket/                   # Socket.IO real-time handlers
│   │   ├── shared/                   # Middleware, errors, utilities
│   │   ├── app.ts                    # Express app factory
│   │   └── server.ts                 # HTTP + WebSocket server
│   ├── tests/                        # Backend unit & integration tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── icons/                    # PWA icons (192, 512, maskable)
│   ├── src/
│   │   ├── app/                      # Router & providers
│   │   ├── components/               # Shared UI (shadcn/ui style)
│   │   ├── features/                 # Feature-based screens
│   │   │   ├── auth/                 # Login, register, onboarding
│   │   │   ├── home/                 # Home & search
│   │   │   ├── medicine/             # Medicine & pharmacy detail
│   │   │   ├── buyer/                # Cart, orders, buy requests
│   │   │   ├── seller/               # Dashboard, inventory, listings
│   │   │   ├── chat/                 # Messaging
│   │   │   ├── notifications/        # Notification center
│   │   │   ├── profile/              # Profile & settings
│   │   │   └── admin/                # Admin panel
│   │   ├── hooks/                    # React Query & custom hooks
│   │   ├── lib/                      # API client, socket, utilities
│   │   └── stores/                   # Zustand state stores
│   ├── tests/                        # Frontend unit & component tests
│   ├── vercel.json                   # Vercel deployment config
│   └── .env.example
├── docs/                             # Design system, reports, guides
├── docker-compose.yml                # Local PostgreSQL + backend
├── package.json                      # Monorepo root (npm workspaces)
├── LICENSE                           # MIT License
└── README.md
```

---

# 7. Installation

## Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL 16 (local or Docker)
- Firebase project (required for production auth, storage, and FCM)

## Clone Repository

```bash
git clone https://github.com/your-org/medlink-b2b.git
cd medlink-b2b
```

## Install Dependencies

```bash
npm install
```

## Configure Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit both files — see [Section 8](#8-environment-variables).

## Set Up Database

```bash
docker-compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed
```

## Run Development Server

**Backend (port 3000):**

```bash
npm run dev:backend
```

**Frontend (port 5173):**

```bash
npm run dev
```

**Both at once:**

```bash
npm run dev:all
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| API Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/health |

## Build for Production

```bash
npm run build
```

- Backend output: `backend/dist/`
- Frontend output: `frontend/dist/`

---

# 8. Environment Variables

## Backend (`backend/.env`)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens (32+ random characters) |
| `JWT_EXPIRES_IN` | — | Access token expiry (default: `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | — | Refresh token expiry (default: `30d`) |
| `PORT` | — | HTTP server port (default: `3000`) |
| `NODE_ENV` | — | `development`, `production`, or `test` |
| `OTP_EXPIRY_MINUTES` | — | OTP validity in minutes (default: `10`) |
| `OTP_DEV_MODE` | — | Log OTP to console in dev (`false` in production) |
| `FIREBASE_PROJECT_ID` | ✅* | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅* | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | ✅* | Firebase service account private key |
| `FIREBASE_STORAGE_BUCKET` | ✅* | Firebase Storage bucket name |
| `CORS_ORIGIN` | ✅ | Allowed frontend origin(s), comma-separated |
| `RATE_LIMIT_WINDOW_MS` | — | Rate limit window in ms (default: `900000`) |
| `RATE_LIMIT_MAX` | — | Max requests per window (default: `100`) |
| `LOG_LEVEL` | — | Log level: `error`, `warn`, `info`, `debug` |

*\* Required in production for Firebase Auth, Storage, and FCM.*

## Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_BASE_URL` | ✅ | API base URL (dev: `/api/v1`; prod: `https://api.yourdomain.com/api/v1`) |
| `VITE_SOCKET_URL` | — | Socket.IO server URL (defaults to same origin) |

---

# 9. Database

MedLink B2B uses a **hybrid data architecture** combining a relational database with Firebase services.

## PostgreSQL (Primary — via Prisma ORM)

All core marketplace transactional data is stored in **PostgreSQL 16**, managed with **Prisma ORM**:

| Entity | Description |
|--------|-------------|
| `User` | Accounts with email/phone, role, and auth provider |
| `Pharmacy` | Business profiles with license, verification status, location |
| `Medicine` | Master catalog (name, composition, company, dosage form) |
| `Listing` | Seller inventory with batch, expiry, pricing, and quantity |
| `CartItem` | Buyer cart entries grouped by seller |
| `BuyRequest` | Purchase requests with accept/reject workflow |
| `Order` | Confirmed transactions with full status history |
| `Conversation` / `Message` | Chat threads and messages |
| `Notification` | In-app notification records |
| `Review` | Post-delivery pharmacy ratings |

**Features:** relational integrity, composite indexes on hot queries, version-controlled migrations.

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply migrations (development)
npm run db:push        # Push schema (prototyping)
npm run db:seed        # Seed sample data
```

## Firebase Services

| Service | Role |
|---------|------|
| **Firebase Auth** | Google, phone, and email identity verification |
| **Firestore** | Firebase document database (ecosystem; complements PostgreSQL) |
| **Firebase Storage** | Private file storage with signed URL access |
| **FCM** | Push notification delivery to mobile and web clients |

---

# 10. API

## Base URL

```
http://localhost:3000/api/v1
```

Legacy aliases available at `/api/*`.

## Architecture

Clean modular architecture: **Routes → Controller → Service → Prisma**

15 domain modules, each with dedicated routes, business logic, and validation:

| Module | Path | Key Endpoints |
|--------|------|---------------|
| Auth | `/auth` | `POST /register`, `/login`, `/send-otp`, `/verify-otp`, `/firebase`, `/refresh` |
| Pharmacies | `/pharmacies` | `POST /register`, `/documents`, `GET /me`, `GET /:id` |
| Medicines | `/medicines` | `GET /` (search), `POST /` (admin), `PATCH /:id` |
| Listings | `/listings` | `GET /search`, `GET /inventory`, `POST /`, `PATCH /:id` |
| Cart | `/cart` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| Buy Requests | `/buy-requests` | `GET /`, `POST /`, `GET /:id`, `POST /:id/respond` |
| Orders | `/orders` | `GET /`, `GET /:id`, `PATCH /:id/status`, `POST /:id/cancel` |
| Chat | `/chat` | `GET /conversations`, `POST /conversations`, messages, read |
| Notifications | `/notifications` | `GET /`, `PATCH /:id/read`, mark-all-read |
| Reviews | `/reviews` | `POST /`, `GET /pharmacy/:id` |
| Reports | `/reports` | `POST /` |
| Analytics | `/analytics` | `GET /seller` |
| Admin | `/admin` | `/dashboard`, `/verifications`, `/reports`, `/users` |
| Upload | `/upload` | `POST /image`, `/document` |

## Real-time API (Socket.IO)

| Event | Description |
|-------|-------------|
| `join:conversation` | Join chat room (membership verified) |
| `message:send` | Send a message |
| `message:read` | Mark messages as read |
| `typing:start` / `typing:stop` | Typing indicators |

**Docs:** Swagger UI at `http://localhost:3000/api/docs` (development only).

---

# 11. Authentication

| Method | Flow | Description |
|--------|------|-------------|
| **Email + Password** | `POST /auth/login` | Standard credential login |
| **Phone + Password** | `POST /auth/login` | Login with phone number |
| **Registration + OTP** | `register` → `verify-otp` | Sign up with email/phone verification |
| **OTP Login** | `send-otp` → `verify-otp` | Passwordless login |
| **Firebase Auth** | `POST /auth/firebase` | Google, phone, or email via Firebase ID token |
| **Token Refresh** | `POST /auth/refresh` | Rotate expired access tokens |

### Token Flow

1. Client receives `accessToken` + `refreshToken` on login
2. Access token sent as `Authorization: Bearer <token>`
3. On 401, client calls `/auth/refresh`
4. Socket.IO authenticates with the same JWT

### Roles

| Role | Access |
|------|--------|
| **Buyer** | Browse, cart, buy requests, orders, chat |
| **Seller** | All buyer access + listings, inventory (requires verified pharmacy) |
| **Admin** | Verification queue, reports, users, platform analytics |

---

# 12. Deployment

## Frontend — Vercel

1. Connect repository to [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL`
4. Deploy (SPA rewrites configured in `frontend/vercel.json`)

## Backend — Docker

```bash
docker build -f backend/Dockerfile -t medlink-api .
docker run -p 3000:3000 --env-file backend/.env medlink-api
```

## Full Stack — Docker Compose

```bash
docker-compose up --build
```

## Database Migration (Production)

```bash
cd backend && npx prisma migrate deploy
```

## Post-Deploy Checklist

- [ ] HTTPS on frontend and API
- [ ] `CORS_ORIGIN` set to production domain
- [ ] `OTP_DEV_MODE=false`
- [ ] Firebase credentials configured
- [ ] Database migrations applied
- [ ] Health check monitoring enabled

See [`docs/deployment-guide.md`](docs/deployment-guide.md) for the full guide.

---

# 13. Security

| Measure | Implementation |
|---------|----------------|
| **JWT Authentication** | Access + refresh token rotation |
| **Role-Based Authorization** | Buyer, seller, admin with verified-pharmacy gate |
| **IDOR Protection** | Orders and buy-requests scoped to participants |
| **Pharmacy Verification** | Only approved pharmacies visible in marketplace |
| **Self-Purchase Prevention** | Users cannot buy from their own pharmacy |
| **Input Validation** | Zod schemas on all API request bodies |
| **Rate Limiting** | Per-IP limits on API and auth endpoints |
| **Security Headers** | Helmet (CSP, HSTS in production) |
| **CORS** | Configurable allowed origins |
| **Secure Uploads** | Private Firebase Storage with signed URLs |
| **Socket Security** | JWT auth + conversation membership checks |
| **OTP Security** | Cryptographic generation; dev mode blocked in production |

See [`docs/security-report.md`](docs/security-report.md).

---

# 14. Performance

| Technique | Details |
|-----------|---------|
| **Code Splitting** | React.lazy on all routes; vendor/query/ui chunks |
| **PWA Caching** | Workbox precache + NetworkFirst for API responses |
| **Database Indexes** | Composite indexes on listings, orders, buy requests |
| **API Pagination** | Default 20 items, max 100 per page |
| **Query Caching** | TanStack Query with configurable stale time |
| **Asset Caching** | Immutable cache headers on Vercel (`/assets/*`) |
| **Bundle Size** | Main chunk ~86 KB gzip; 25+ lazy-loaded route chunks |
| **Atomic Stock Updates** | Race-condition-safe inventory decrement |

See [`docs/performance-report.md`](docs/performance-report.md).

---

# 15. Testing

## Run All Tests

```bash
npm test
```

## Run by Workspace

```bash
npm run test:backend     # 17 tests
npm run test:frontend    # 7 tests
```

## Watch Mode

```bash
npm run test:watch --workspace=backend
npm run test:watch --workspace=frontend
```

## What's Tested

| Area | Framework | Type |
|------|-----------|------|
| Helpers, OTP, pricing | Vitest | Unit |
| Authorization logic | Vitest | Unit |
| Business rules | Vitest | Unit |
| Health endpoint | Supertest | Integration |
| UI utilities | Vitest | Unit |
| Components | Vitest + Testing Library | Component |

## CI

GitHub Actions runs build + test on every push and pull request.

See [`docs/test-coverage-summary.md`](docs/test-coverage-summary.md).

---

# 16. Contributing

Contributions are welcome. Please follow these steps:

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```
   feature/<description>
   fix/<description>
   docs/<description>
   ```
3. **Write tests** for new features and bug fixes
4. **Run checks** before opening a PR:
   ```bash
   npm run build
   npm test
   npm run lint
   ```
5. **Open a Pull Request** with a clear description
6. **Keep PRs focused** — one feature or fix per PR

### Commit Message Format

```
feat: add pharmacy bulk import
fix: restore inventory on order cancel
docs: update environment variables
test: add buy request authorization tests
```

---

# 17. License

This project is licensed under the **MIT License**.

See [LICENSE](LICENSE) for the full text.

```
MIT License — Copyright (c) 2026 MedLink B2B Contributors
```

---

# 18. Roadmap

| Priority | Feature |
|----------|---------|
| 🔴 High | E2E tests with Playwright |
| 🔴 High | SMS/email OTP delivery integration |
| 🔴 High | Payment gateway (bKash, SSLCommerz) |
| 🟡 Medium | Geo/radius search for nearby pharmacies |
| 🟡 Medium | Firebase Google login UI |
| 🟡 Medium | Firestore real-time sync for notifications |
| 🟡 Medium | Redis rate limiting + Socket.IO adapter |
| 🟡 Medium | Play Store TWA / Capacitor wrapper |
| 🟢 Low | Bengali (বাংলা) localization |
| 🟢 Low | Advanced analytics dashboards |
| 🟢 Low | Medicine bulk import (CSV/Excel) |
| 🟢 Low | Multi-warehouse inventory management |

---

# 19. Support

## Report Issues

| Type | How |
|------|-----|
| **Bug** | [GitHub Issues](https://github.com/your-org/medlink-b2b/issues) — include steps to reproduce, expected vs. actual behavior, and environment |
| **Feature Request** | GitHub Issue with `enhancement` label |
| **Security Vulnerability** | Report privately via email — do not open public issues |

## Documentation

| Guide | Link |
|-------|------|
| Deployment | [`docs/deployment-guide.md`](docs/deployment-guide.md) |
| Maintenance | [`docs/maintenance-guide.md`](docs/maintenance-guide.md) |
| Design System | [`docs/design-system.md`](docs/design-system.md) |
| Known Limitations | [`docs/known-limitations.md`](docs/known-limitations.md) |
| Play Store | [`docs/play-store-checklist.md`](docs/play-store-checklist.md) |

---

# 20. Acknowledgements

MedLink B2B is built with these open-source projects:

**Frontend:** [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [TanStack Query](https://tanstack.com/query) · [Zustand](https://zustand.docs.pmnd.rs/) · [React Router](https://reactrouter.com/) · [Lucide](https://lucide.dev/) · [Workbox](https://developer.chrome.com/docs/workbox/)

**Backend:** [Node.js](https://nodejs.org/) · [Express](https://expressjs.com/) · [Prisma](https://www.prisma.io/) · [PostgreSQL](https://www.postgresql.org/) · [Firebase](https://firebase.google.com/) · [Socket.IO](https://socket.io/) · [Zod](https://zod.dev/) · [Winston](https://github.com/winstonjs/winston) · [bcryptjs](https://github.com/dcodeIO/bcrypt.js) · [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

**Testing & DevOps:** [Vitest](https://vitest.dev/) · [Testing Library](https://testing-library.com/) · [Supertest](https://github.com/ladjs/supertest) · [Docker](https://www.docker.com/) · [GitHub Actions](https://github.com/features/actions)

---

<p align="center">
  <strong>MedLink B2B</strong> — Connecting verified pharmacies. Reducing waste. Improving access.
</p>
