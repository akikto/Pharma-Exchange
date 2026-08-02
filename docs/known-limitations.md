# Known Limitations — PharmEx

**Date:** August 2, 2026

## Functional Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| OTP delivery not integrated (SMS/email) | OTP only works in dev mode or with manual code | Use Firebase phone auth or `OTP_DEV_MODE=true` in dev |
| Geo/radius search not implemented | Nearby filter unavailable | Use city/district filters |
| `paymentStatus` unused | No payment gateway integration | Manual payment tracking outside app |
| Firebase client SDK not wired in UI | No Google login button | Use email/password or OTP login |
| Settings not persisted to API | Theme/language local only | Persist via user profile API in future |
| No E2E test suite | Manual QA required | Run smoke tests from deployment checklist |
| Play Store requires TWA wrapper | No APK in repo | Use Bubblewrap/Capacitor (see play-store-checklist.md) |

## Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| In-memory rate limiting | Doesn't scale horizontally | Redis rate limiter for multi-instance |
| Single-instance cron jobs | Duplicate jobs if scaled | Distributed lock or dedicated worker |
| Legacy `/api/*` routes | Maintenance overhead | Deprecate in v2, use `/api/v1/*` only |
| `npm audit` vulnerabilities | Dependency risk | Run `npm audit fix` regularly |
| No Redis/Socket.IO adapter | Socket doesn't scale multi-instance | Redis adapter when scaling |

## Accessibility

- Basic semantic HTML via Radix primitives
- Full WCAG 2.1 AA audit not yet performed
- Icon buttons partially labeled (improved in audit)

## These Are Not Blockers For

- Controlled beta launch
- Internal pharmacy network testing
- Demo and stakeholder review

## Blockers For Public Launch

1. Real OTP/SMS delivery integration
2. Privacy policy URL (Play Store requirement)
3. Production Firebase + HTTPS deployment
4. E2E test coverage for critical flows
