# BL-04 + BL-05: Privacy Policy + Terms & Conditions + Play Store compliance

Closes: **BL-04** and **BL-05** (Launch Blockers · Sprint 4)

## Summary

Publishes production-ready Privacy Policy and Terms & Conditions pages,
wires them into the app (login, OTP-login, signup checkbox, settings),
and adds the Play Store compliance answers. No existing UI/UX was changed —
only additive components, one new form field (`acceptedTerms`), and a
Settings row.

## What's in this PR

- **Frontend**
  - `frontend/src/features/legal/legal-page.tsx` — shared layout (SEO,
    print, back / print buttons, `<main>` landmark).
  - `frontend/src/features/legal/privacy-policy-page.tsx` — 13-section
    Privacy Policy covering data collection, Firebase Auth, Razorpay,
    MSG91, FCM, device permissions, cookies, retention, user rights and
    deletion.
  - `frontend/src/features/legal/terms-and-conditions-page.tsx` —
    19-section T&Cs covering marketplace usage, buyer/seller
    responsibilities, listing rules, payments, refunds, cancellations,
    IP, prohibited activities, liability, governing law (Bangladesh).
  - Routes `/privacy-policy`, `/terms-and-conditions`, plus `/privacy`
    and `/terms` aliases — all unauthenticated.
  - Legal links added to login footer, OTP-login footer, Settings.
  - Signup form now requires an `acceptedTerms` checkbox before submit.
  - Print + dark-mode CSS in `index.css`.
- **Tests**
  - `frontend/tests/legal-pages.test.tsx` — asserts every required BL-04
    / BL-05 heading exists on the rendered pages.
- **Docs**
  - `docs/PRIVACY-POLICY.md` (Markdown copy for legal review)
  - `docs/TERMS-AND-CONDITIONS.md`
  - `docs/PLAY-STORE-COMPLIANCE.md` (Data Safety form, User Data Policy
    alignment, sub-processor list, permission rationales, submission
    checklist)
  - `docs/sprint-reports/sprint-04.md` + `sprint-04-pr.md`

## Test evidence

| Gate | Result |
|---|---|
| `tsc --noEmit` (frontend + backend) | ✅ 0 errors |
| Frontend Vitest | ✅ 84/84 (2 new + 82 previous) |
| Backend Vitest (single-fork) | ✅ 124/124 |
| Frontend production build | ✅ (PWA precache 89 entries) |
| Backend production build | ✅ |
| Secret scan of the PR diff | ✅ 0 findings |

## Behaviour changes

- New users must tick the terms checkbox before submitting the sign-up
  form; the form displays a validation error otherwise.
- Deep links `/privacy` and `/terms` now redirect to the canonical URLs.

## Out of scope

- Data-deletion CTA inside Settings — deferred; today the flow is
  in-app cancel + email. Compliance still satisfied because the mechanism
  is described in the Privacy Policy and the email address is monitored.
- Translations — pages are English-only for the current release. Bangla
  translation will land in a follow-up once legal review approves both
  languages.

## Deployment notes

- After merge, redeploy and paste the two live URLs into the Play Console
  (Privacy policy + Terms of service).
- Fill the Data Safety form using the table in
  `docs/PLAY-STORE-COMPLIANCE.md § 2`.
