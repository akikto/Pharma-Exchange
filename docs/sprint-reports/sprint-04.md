# Sprint 4 · BL-04 + BL-05 — Legal Compliance · Completion Report

**Branch:** `feature/bl-04-bl-05-legal-compliance` → `main`
**Status:** ✅ Complete — ready for review

---

## Deliverables

| # | Item | Status |
|---|---|---|
| 1 | `/privacy-policy` route rendering a full production Privacy Policy | ✅ |
| 2 | `/terms-and-conditions` route rendering full T&Cs | ✅ |
| 3 | Alias redirects `/privacy` → `/privacy-policy` and `/terms` → `/terms-and-conditions` | ✅ |
| 4 | Legal links in Login page footer + OTP-login footer + Settings page | ✅ |
| 5 | Registration form requires an "I agree to the T&Cs and Privacy Policy" checkbox before submit | ✅ |
| 6 | Mobile-first, dark-mode friendly layout that respects the existing design tokens | ✅ |
| 7 | Accessible (single `<h1>`, ordered headings, keyboard-reachable back / print buttons) | ✅ |
| 8 | Print-friendly (`@media print` in `index.css`, chrome hidden) | ✅ |
| 9 | SEO metadata set on mount (`document.title`, `meta[name=description]`) | ✅ |
| 10 | Docs: PRIVACY-POLICY.md, TERMS-AND-CONDITIONS.md, PLAY-STORE-COMPLIANCE.md | ✅ |
| 11 | Sprint report + PR body | ✅ |

---

## Files changed

### Added
- `frontend/src/features/legal/legal-page.tsx` — shared layout (back button, print button, `<main>` landmark, `useEffect`-based SEO tags, print CSS hooks).
- `frontend/src/features/legal/privacy-policy-page.tsx` — the Privacy Policy render (BL-04 body).
- `frontend/src/features/legal/terms-and-conditions-page.tsx` — the T&Cs render (BL-05 body).
- `frontend/tests/legal-pages.test.tsx` — smoke tests asserting every required BL-04 / BL-05 section heading is present.
- `docs/PRIVACY-POLICY.md`, `docs/TERMS-AND-CONDITIONS.md`
- `docs/PLAY-STORE-COMPLIANCE.md` (Data Safety form answers, sub-processor disclosures, User Data Policy alignment, submission checklist)
- `docs/sprint-reports/sprint-04.md` (this file)
- `docs/sprint-reports/sprint-04-pr.md`

### Modified
- `frontend/src/app/router.tsx` — lazy-load and mount `/privacy-policy`, `/terms-and-conditions`, `/privacy`, `/terms`.
- `frontend/src/features/auth/login-page.tsx` — added the `acceptedTerms` schema field, an in-form checkbox with links to both legal pages that opens each in a new tab, a legal-links footer at the bottom of the login screen.
- `frontend/src/features/auth/register-page.tsx` (the OTP-login screen) — added a matching legal-links footer.
- `frontend/src/features/profile/profile-page.tsx` — added a "Legal" section under Settings with links to both policies.
- `frontend/src/index.css` — `.legal-prose` typography helpers + `@media print` rules that hide app chrome, force black-on-white and prevent orphan headings.

---

## Compliance audit summary

Full details in [`docs/PLAY-STORE-COMPLIANCE.md`](../PLAY-STORE-COMPLIANCE.md).

| Requirement | Status |
|---|---|
| Privacy Policy URL is publicly accessible unauthenticated | ✅ Route is outside `<ProtectedRoute>` |
| Terms of service URL is publicly accessible | ✅ Same |
| Play Data Safety — data types disclosed | ✅ Privacy § 2 lists every category |
| Play Data Safety — purposes disclosed | ✅ Privacy § 3 |
| Play Data Safety — sharing disclosed | ✅ Privacy § 5 |
| Play Data Safety — deletion mechanism | ✅ Privacy § 9 + in-app link |
| Play User Data Policy — TLS 1.2+ | ✅ HSTS 1y preload (BL-03) |
| Firebase Auth disclosure | ✅ Privacy § 2.5 + § 5 |
| FCM disclosure & runtime permission rationale | ✅ Privacy § 2.7, § 6 |
| Razorpay payment disclosure | ✅ Privacy § 2.4 |
| MSG91 OTP disclosure | ✅ Privacy § 2.6 |
| Content parity between rendered page and Markdown copy | ✅ Both authored together |

Remaining manual actions (dashboard-only, called out in Compliance doc):
- Enter the two live URLs in Play Console → App content → Privacy policy / Support email.
- Fill the Data Safety form using the table in `docs/PLAY-STORE-COMPLIANCE.md § 2`.
- Capture 7 phone + 5 tablet screenshots on a real device.
- Bind production domain, redeploy, then flip Play internal test track.

---

## Test / build results

| Gate | Result |
|---|---|
| `tsc --noEmit` (frontend) | ✅ 0 errors |
| `tsc --noEmit` (backend) | ✅ 0 errors |
| Frontend Vitest | ✅ **84/84** (2 new legal-pages tests + previous 82) |
| Backend Vitest (`--pool=forks --singleFork`) | ✅ **124/124** — the pre-existing `Cart API MOQ` flake now also passes against fresh DB |
| Frontend production build | ✅ 89 precache entries |
| Backend production build | ✅ tsc OK |
| Secret scan of PR diff | ✅ 0 findings |

---

## Confirmation

- ✅ Branch created: `feature/bl-04-bl-05-legal-compliance` off latest `main`.
- ✅ Existing UI/UX preserved — no visual redesign of any existing screen; only additive components + a footer link + a signup checkbox.
- ✅ No secrets committed.
- ✅ No breaking changes to auth, payments or order flows.
- ✅ **Feature branch ready for GitHub PR into `main`.** PR body at
  [`docs/sprint-reports/sprint-04-pr.md`](sprint-04-pr.md).

Sprint 5 is **not** started. Waiting for approval.
