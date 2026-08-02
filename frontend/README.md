# PharmEx Frontend

Production-ready React frontend for the PharmEx B2B pharmacy marketplace.

## Stack

- React 19 + TypeScript + Vite
- React Router 7
- TanStack Query (server state)
- Zustand (auth, theme)
- React Hook Form + Zod
- Tailwind CSS 4 + shadcn/ui components
- Socket.IO (real-time chat)
- Firebase (auth + FCM — configure via env)
- PWA with offline caching

## Development

```bash
cp .env.example .env
npm install
npm run dev
```

Runs at `http://localhost:5173` with API proxy to `http://localhost:3000`.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── app/           # Router, providers
├── components/    # Shared UI (shadcn-style) + layout
├── features/      # Feature modules (auth, home, medicine, seller, buyer, chat, etc.)
├── hooks/         # Custom hooks (listings, API, chat socket)
├── lib/           # API client, socket, utils
├── stores/        # Zustand stores (auth, theme)
└── types/         # TypeScript interfaces
```

## Screens

| Module | Pages |
|--------|-------|
| Auth | Splash, Onboarding, Login, Register, OTP |
| Home | Marketplace feed, Featured/Short expiry deals, Search + filters |
| Medicine | Detail, Pharmacy profile |
| Seller | Dashboard, Inventory |
| Buyer | Cart, Orders, Buy requests |
| Chat | Conversation list, Real-time chat |
| Profile | Mode toggle, Settings, Theme |
| Admin | Dashboard KPIs |

## Environment

```
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```
