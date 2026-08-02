# PharmEx — B2B Pharmacy Marketplace

PharmEx is a B2B pharmacy marketplace for Bangladesh, connecting pharmacies as buyers and sellers of medicines. The platform supports buy-request negotiation, order management, real-time chat, and an admin verification panel.

## Project Structure

```
Pharma-Exchange/
├── docs/
│   └── design-system.md    # Task 3: UI/UX design system
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Task 1: Database schema
│   │   └── seed.ts
│   └── src/                # Task 2: REST API
└── package.json
```

## Tasks

| Task | Description | Status |
|------|-------------|--------|
| 1 | Database schema (PostgreSQL + Prisma) | ✅ |
| 2 | Backend REST API (Express + TypeScript) | ✅ |
| 3 | UI/UX design system | ✅ (see `docs/design-system.md`) |

## Tech Stack

- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **API**: Node.js 20, Express, TypeScript
- **Auth**: JWT + OTP verification

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp backend/.env.example backend/.env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

The API runs at `http://localhost:3000` by default.

## API Overview

| Domain | Endpoints |
|--------|-----------|
| Auth | Register, login, OTP verify, refresh token |
| Pharmacies | Registration, document upload, verification status |
| Medicines | Catalog search, create (seller) |
| Listings | CRUD, search with filters |
| Cart | Add/update/remove items |
| Buy Requests | Create, accept/reject (seller) |
| Orders | List, detail, status updates |
| Chat | Conversations, messages |
| Notifications | List, mark read |
| Admin | Verification queue, reports, user management |

See `backend/README.md` for full API documentation.

## Design System

The UI/UX design system (Task 3) is documented in [`docs/design-system.md`](docs/design-system.md). It covers design tokens, component library, screen wireframes, navigation, accessibility, and UX guidelines for Android, iOS (PWA), and Web platforms.
