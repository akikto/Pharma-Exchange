# Phase 10 — In-App Chat Report

**Branch:** `cursor/phase10-in-app-chat-239a`  
**Base:** `cursor/phase9-watchlist-alerts-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 10.2 | Request/order selector | ❌ Missing | ✅ Filter dropdown on chat list + `GET /chat/context-options` |
| 10.5 | Status updates from chat | ❌ Missing | ✅ Seller pack/ship/deliver + accept/reject in chat header |
| 10.6 | Quick call | 🟡 On offers only | ✅ Phone link in chat header |
| 10.7 | WhatsApp | 🟡 On offers only | ✅ WhatsApp deep link in chat header |
| 10.8 | Auto status messages | 🟡 Schema only | ✅ SYSTEM messages on order/buy-request status change |

---

## Remaining Gaps (Future Phases)

| Feature | Notes |
|---------|-------|
| Media attachments in chat | Paperclip/mic buttons are UI placeholders |
| Real-time SYSTEM message sync | Socket emit added; client refreshes on header actions |
| Conversation dedup across contexts | Separate threads per order/buy-request when scoped |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `buyRequestId` on `Conversation`, indexes |
| `backend/prisma/migrations/20260803030000_conversation_buy_request_id/` | Migration SQL |
| `backend/src/modules/chat/chat.service.ts` | Context filter, detail endpoint, `buyRequestId` on create |
| `backend/src/modules/chat/chatSystem.service.ts` | SYSTEM messages + conversation ensure helpers |
| `backend/src/modules/chat/chat.routes.ts` | `/context-options`, `GET /conversations/:id`, query filters |
| `backend/src/modules/order/order.service.ts` | SYSTEM messages on status change + cancel |
| `backend/src/modules/buy-request/buyRequest.service.ts` | SYSTEM messages on accept/reject |
| `backend/src/socket/index.ts` | `getSocketIo()` for SYSTEM message broadcast |
| `backend/tests/chat.integration.test.ts` | Integration tests |
| `backend/tests/chat.test.ts` | Message formatting unit tests |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/features/chat/chat-page.tsx` | Filter bar, header, SYSTEM message rendering |
| `frontend/src/components/chat/chat-header.tsx` | Call/WhatsApp + seller actions |
| `frontend/src/components/chat/chat-context-filter.tsx` | Order/request filter dropdown |
| `frontend/src/hooks/use-chat-api.ts` | Conversations, context options, status mutations |
| `frontend/src/lib/chat-utils.ts` | Filter helpers, seller action mapping |
| `frontend/src/hooks/use-api.ts` | `buyRequestId` on start conversation |
| `frontend/src/features/buyer/order-detail-page.tsx` | Pass `orderId` when starting chat |
| `frontend/src/features/buyer/buy-request-detail-page.tsx` | Pass `buyRequestId` when starting chat |
| `frontend/src/types/index.ts` | Extended `Conversation` type |
| `frontend/tests/chat-utils.test.ts` | Unit tests |
| `frontend/src/i18n/locales/bn.json` | Bengali-first strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/conversations?orderId=&buyRequestId=` | Filtered conversation list |
| GET | `/chat/context-options` | Orders + buy requests for filter dropdown |
| GET | `/chat/conversations/:id` | Conversation detail with order/request + counterparty |
| POST | `/chat/conversations` | Create (optional `orderId`, `buyRequestId`) |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 76 passed |
| Frontend tests | 50 passed |
| `tsc --noEmit` | Pass |
