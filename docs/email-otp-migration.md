# Email OTP — Database Migration Summary

## Migration: `20260803000000_add_email_otp`

**Table:** `EmailOtp`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT (UUID) | PRIMARY KEY |
| `email` | TEXT | NOT NULL, indexed |
| `hashedOtp` | TEXT | NOT NULL |
| `expiresAt` | TIMESTAMP(3) | NOT NULL, indexed |
| `attempts` | INTEGER | NOT NULL, DEFAULT 0 |
| `verified` | BOOLEAN | NOT NULL, DEFAULT false |
| `createdAt` | TIMESTAMP(3) | NOT NULL, DEFAULT now() |

**Indexes:**
- `EmailOtp_email_idx`
- `EmailOtp_expiresAt_idx`
- `EmailOtp_email_createdAt_idx`

## Apply Migration

```bash
cd backend
npx prisma migrate deploy
```

If the database was created before Prisma Migrate was adopted (P3005 error), either:

1. **Baseline** existing migrations, then deploy, or
2. **Push schema directly:** `npx prisma db push`

The production Neon database has been synced via `prisma db push` during this implementation.

## Rollback

```sql
DROP TABLE IF EXISTS "EmailOtp";
```

## Data Retention

- OTP records expire after 5 minutes (`EMAIL_OTP_EXPIRY_MINUTES`)
- Expired records cleaned every 30 minutes (background job on non-Vercel servers)
- Records deleted immediately on successful verification or password reset
