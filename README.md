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
└── package.json
```

## Tasks

| Task | Description | Status |
|------|-------------|--------|
| 1 | Database schema (PostgreSQL + Prisma) | ✅ |
| 2 | API design | ✅ |
| 3 | UI/UX design system | ✅ |
| 4 | Production backend implementation | ✅ |

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
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

API: `http://localhost:3000/api/v1`  
Docs: `http://localhost:3000/api/docs`  
WebSocket: `ws://localhost:3000/socket.io`

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
