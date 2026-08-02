# PharmEx Backend API

REST API for the PharmEx B2B pharmacy marketplace.

## Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/phone + password |
| POST | `/verify-otp` | Verify OTP code |
| GET | `/me` | Get current user profile |

### Pharmacies (`/api/pharmacies`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register pharmacy (authenticated) |
| POST | `/documents` | Upload verification document |
| GET | `/me` | Get own pharmacy |
| GET | `/:id` | Get pharmacy public profile |

### Medicines (`/api/medicines`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Search medicine catalog |
| GET | `/:id` | Get medicine details |
| POST | `/` | Add medicine to catalog |

### Listings (`/api/listings`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Search listings (filters: q, category, price, city, sort) |
| GET | `/:id` | Get listing details |
| POST | `/` | Create listing (seller) |
| PATCH | `/:id` | Update listing (seller) |
| DELETE | `/:id` | Pause listing (seller) |

### Cart (`/api/cart`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get cart (grouped by seller) |
| POST | `/` | Add item to cart |
| PATCH | `/:id` | Update quantity |
| DELETE | `/:id` | Remove item |

### Buy Requests (`/api/buy-requests`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List buy requests (role=buyer\|seller) |
| GET | `/:id` | Get buy request detail |
| POST | `/` | Create buy request from cart items |
| POST | `/:id/respond` | Accept or reject (seller) |

### Orders (`/api/orders`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List orders (role=buyer\|seller) |
| GET | `/:id` | Get order detail with status history |
| PATCH | `/:id/status` | Update order status (seller) |

### Chat (`/api/chat`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | List conversations |
| POST | `/conversations` | Start conversation |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/conversations/:id/messages` | Send message |

### Notifications (`/api/notifications`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| PATCH | `/:id/read` | Mark as read |
| POST | `/read-all` | Mark all as read |

### Admin (`/api/admin`) — requires ADMIN role
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Platform KPIs |
| GET | `/verifications` | Pharmacy verification queue |
| POST | `/verifications/:id` | Approve/reject pharmacy |
| GET | `/reports` | Reports queue |
| POST | `/reports/:id/resolve` | Resolve report |
| GET | `/users` | User management |

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Obtain tokens via `POST /api/auth/login`.

## Environment Variables

See `.env.example` for required configuration.
