# Resend Email — Environment Variables

Password reset OTP emails are sent via [Resend](https://resend.com).

---

## Exact Vercel Environment Variables

Add these to the **`pharma-exchange-backend`** Vercel project  
(Dashboard → Project → Settings → Environment Variables).

### Production

| Key | Value | Environments |
|-----|-------|--------------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxxxxxx` | Production |
| `RESEND_FROM` | `Pharma-Exchange <noreply@yourdomain.com>` | Production |
| `OTP_DEV_MODE` | `false` | Production |
| `EMAIL_OTP_EXPIRY_MINUTES` | `5` | Production |
| `EMAIL_OTP_MAX_ATTEMPTS` | `5` | Production |
| `EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | `60` | Production |

### Preview (optional — for testing PR deployments)

| Key | Value | Environments |
|-----|-------|--------------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxxxxxx` | Preview |
| `RESEND_FROM` | `Pharma-Exchange <onboarding@resend.dev>` | Preview |
| `OTP_DEV_MODE` | `false` | Preview |

### Development (local `.env` in `backend/`)

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=Pharma-Exchange <onboarding@resend.dev>
OTP_DEV_MODE=true
EMAIL_OTP_EXPIRY_MINUTES=5
EMAIL_OTP_MAX_ATTEMPTS=5
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
```

---

## Getting Your Resend API Key

1. Sign up at https://resend.com
2. Go to **API Keys** → Create API Key
3. Copy the key (starts with `re_`)
4. Paste into Vercel as `RESEND_API_KEY` — **never commit to git**

---

## From Address (`RESEND_FROM`)

| Stage | Recommended value |
|-------|-------------------|
| **Local / Preview testing** | `Pharma-Exchange <onboarding@resend.dev>` |
| **Production** | `Pharma-Exchange <noreply@yourdomain.com>` after verifying domain in Resend |

To verify your domain: Resend Dashboard → **Domains** → Add domain → add DNS records.

---

## Copy-Paste Block for Vercel

```
RESEND_API_KEY=re_PASTE_YOUR_KEY_HERE
RESEND_FROM=Pharma-Exchange <onboarding@resend.dev>
OTP_DEV_MODE=false
EMAIL_OTP_EXPIRY_MINUTES=5
EMAIL_OTP_MAX_ATTEMPTS=5
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
```

After domain verification, update production `RESEND_FROM` to your verified address.

---

## Verification Checklist

### Development
1. Set `RESEND_API_KEY` in `backend/.env`
2. Set `RESEND_FROM=Pharma-Exchange <onboarding@resend.dev>`
3. Run `npm run dev` in `backend/`
4. `POST /api/v1/auth/forgot-password` with a registered email
5. Check inbox (or Resend Dashboard → Emails for delivery log)

### Production
1. Add all Vercel env vars above to **pharma-exchange-backend**
2. Redeploy backend
3. Open `https://pharma-exchange-frontend.vercel.app/forgot-password`
4. Enter registered email → receive OTP within ~30 seconds
5. Confirm in Resend Dashboard → Emails

---

## Security Notes

- API keys live only in environment variables (Vercel / local `.env`)
- OTP codes are never included in API JSON responses
- Email logs mask recipient addresses (`u***r@example.com`)
- `OTP_DEV_MODE` must be `false` in production (enforced at startup)
