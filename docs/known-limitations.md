# Known Limitations — PharmEx

**Date:** August 3, 2026

## Functional Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| OTP delivery not integrated (SMS/email) | OTP only works in dev mode or with manual code | Use Firebase phone auth, demo login, or `OTP_DEV_MODE=true` in dev |
| `paymentStatus` unused | No payment gateway integration | Manual payment tracking outside app |
| Google Sign-In / FCM require Firebase env | Social login and push disabled without config | Email/password or demo login |
| No E2E test suite | Manual QA required | Run `npm run smoke` and deployment checklist |
| Play Store requires TWA wrapper | No APK in repo | Use Bubblewrap/Capacitor (see play-store-checklist.md) |
| Gemini AI optional | Rule-based matches only without API key | Set `GEMINI_API_KEY` on backend |

## Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| In-memory rate limiting | Doesn't scale horizontally | Redis rate limiter for multi-instance |
| Single-instance cron jobs | Duplicate jobs if scaled | Distributed lock or dedicated worker |
| Legacy `/api/*` routes | Maintenance overhead | Deprecate in v2, use `/api/v1/*` only |
| `npm audit` vulnerabilities | Dependency risk | Run `npm audit fix` regularly |
| No Redis/Socket.IO adapter | Socket doesn't scale multi-instance | Redis adapter when scaling |

## Accessibility

- Semantic HTML via Radix primitives
- Focus-visible rings and `prefers-reduced-motion` (Phase 17)
- Bengali RTL via `dir` attribute (Phase 17)
- `data-testid` on key nav, cart, and listing elements (Phase 17)
- Full WCAG 2.1 AA audit not yet performed

## These Are Not Blockers For

- Controlled beta launch
- Internal pharmacy network testing
- Demo and stakeholder review

## Blockers For Public Launch

1. Real OTP/SMS delivery integration
2. Privacy policy URL (Play Store requirement)
3. Production Firebase + HTTPS deployment
4. E2E test coverage for critical flows
