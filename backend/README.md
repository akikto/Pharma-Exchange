# PharmEx Backend API v1.0

Production-ready REST API for the PharmEx B2B pharmacy marketplace.

## Architecture

```
src/
├── config/          # Environment, database, Firebase
├── shared/          # Errors, middleware, utils
├── modules/         # Domain modules (clean architecture)
│   ├── auth/
│   ├── pharmacy/
│   ├── medicine/
│   ├── listing/
│   ├── cart/
│   ├── buy-request/
│   ├── order/
│   ├── chat/
│   ├── notification/
│   ├── review/
│   ├── report/
│   ├── analytics/
│   ├── admin/
│   └── upload/
├── jobs/            # Background cron jobs
├── socket/          # Socket.IO real-time chat
├── docs/            # Swagger/OpenAPI
├── app.ts           # Express app factory
└── server.ts        # HTTP + WebSocket bootstrap
```

Each module follows: `routes → controller → service → prisma`

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Framework**: Express 4
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + Firebase Authentication (Google, OTP, Email)
- **Storage**: Firebase Storage (with dev fallback)
- **Push**: Firebase Cloud Messaging
- **Real-time**: Socket.IO (chat, typing, read receipts)
- **Jobs**: node-cron (expiry alerts, cleanup)
- **Docs**: Swagger UI at `/api/docs`

## API Endpoints (v1)

Base URL: `/api/v1`

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register`, `/login`, `/firebase`, `/verify-otp`, `/refresh`, `/logout`, `GET /me`, `POST /fcm-token` |
| **Pharmacies** | `POST /pharmacies/register`, `/documents`, `GET /me`, `/:id` |
| **Medicines** | `GET /medicines`, `POST /`, `PATCH /:id` |
| **Listings** | `GET /listings/search`, `/inventory`, `POST /`, `PATCH /:id`, `/price`, `/quantity`, `/pause`, `/activate` |
| **Cart** | `GET /cart`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| **Buy Requests** | `GET /buy-requests`, `POST /`, `POST /:id/respond` |
| **Orders** | `GET /orders`, `PATCH /:id/status`, `POST /:id/cancel` |
| **Chat** | `GET /chat/conversations`, `POST /conversations`, messages, read receipts |
| **Notifications** | `GET /notifications`, `PATCH /:id/read`, `POST /read-all` |
| **Reviews** | `POST /reviews`, `GET /reviews/pharmacy/:id` |
| **Reports** | `POST /reports` |
| **Upload** | `POST /upload/document`, `/image`, `/voice` |
| **Analytics** | `GET /analytics/seller` |
| **Admin** | `GET /admin/dashboard`, `/verifications`, `/reports`, `/users` |

Legacy aliases at `/api/*` (without `/v1`) are also supported.

## WebSocket Events

Connect to `ws://localhost:3000/socket.io` with `auth: { token: <jwt> }`.

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:conversation` | Client → Server | Join conversation room |
| `message:send` | Client → Server | Send real-time message |
| `message:new` | Server → Client | New message broadcast |
| `message:read` | Both | Read receipt |
| `typing:start/stop` | Both | Typing indicators |

## Background Jobs

| Schedule | Job |
|----------|-----|
| Daily 8 AM | Short expiry alerts to sellers |
| Hourly | Expire pending buy requests |
| Daily midnight | Mark expired listings |

## Setup

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push    # or db:migrate
npm run db:seed
npm run dev
```

## Testing

```bash
npm test
npm run lint
```

## Authentication

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

Firebase clients authenticate via `POST /api/v1/auth/firebase` with `{ idToken }`.

## Environment Variables

See `.env.example` for full list. Firebase credentials are optional in development.
