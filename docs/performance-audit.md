# Performance Audit — Pharma-Exchange v1.0.1-rc1

**Date:** 2026-08-04  
**Scope:** Bundle analysis, Core Web Vitals plan, Lighthouse, accessibility  
**Build:** `npm run build --workspace=frontend` (post code-split, RC branch)

---

## Summary

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Main JS (gzip) | < 200 KB | **55.78 KB** (`index`) | ✅ |
| Vendor chunk (gzip) | < 100 KB | **74.74 KB** | ✅ |
| Largest route chunk (gzip) | < 30 KB | **~5.5 KB** (`home-page`) | ✅ |
| PWA precache | < 5 MB | **4.35 MB** | ⚠️ Monitor |
| Lighthouse Performance | ≥ 90 | ⬜ Not run on HTTPS prod | Pending |
| Lighthouse CI (preview) | thresholds in `lighthouserc.cjs` | ✅ `npm run lighthouse:ci` | ✅ |
| LCP (CI gate) | < 5.0s | enforced in LHCI | ✅ |
| CLS (CI gate) | < 0.15 | enforced in LHCI | ✅ |
| LCP | < 2.5s | ⬜ Pending prod | Pending |
| WCAG 2.1 AA | Pass | ⬜ Full audit pending | Partial |

---

## 1. Bundle Analysis (Vite production build)

| Chunk | Raw | Gzip |
|-------|-----|------|
| `index` | 192.24 KB | 55.78 KB |
| `vendor` (react, react-dom, react-router) | 233.40 KB | 74.74 KB |
| `firebase` | 218.07 KB | 43.67 KB |
| `ui` (radix, lucide) | 87.04 KB | 26.05 KB |
| `i18n` | 57.94 KB | 19.06 KB |
| `query` (@tanstack) | 42.68 KB | 12.63 KB |
| Route chunks | 7–18 KB each | 2–5.5 KB each |

**Optimizations already applied (v1.0.1-rc1):**
- `React.lazy` on all routes
- Manual chunks in `vite.config.ts` (vendor, firebase, i18n, ui, query)
- PWA Workbox precaching + NetworkFirst for listing search
- Vercel immutable caching for `/assets/*` (1 year)

**Recommendations (non-blocking):**
- [ ] Lazy-load Firebase only when user opens Google sign-in or enables push
- [ ] Audit precache size — icons + logo contribute ~1 MB+; consider excluding `logo-source.png` from precache glob
- [ ] Run `rollup-plugin-visualizer` in CI to track regressions

---

## 2. Core Web Vitals (plan)

Production measurement requires deployed HTTPS URL. Run after staging deploy:

```bash
npx lighthouse https://<frontend-url> \
  --only-categories=performance \
  --form-factor=mobile \
  --output=json --output-path=./lighthouse-prod.json
```

| Vital | Target | Expected (based on bundle) | Notes |
|-------|--------|---------------------------|-------|
| **LCP** | ≤ 2.5s | Good on fast 4G | Hero feed + fonts; verify on real device |
| **INP** | ≤ 200ms | Good | React 19 + minimal main thread on route chunks |
| **CLS** | ≤ 0.1 | Good | Skeleton loaders on lazy routes |

**Local dev caveat:** Lighthouse on `localhost` is not representative (no CDN, HMR, no TLS).

---

## 3. Lighthouse Audit Checklist

Run on **staging/production HTTPS** before launch:

| Category | Target | Status |
|----------|--------|--------|
| Performance | ≥ 90 | ⬜ |
| Accessibility | ≥ 90 | ⬜ |
| Best Practices | ≥ 90 | ⬜ |
| SEO | ≥ 90 | ⬜ |
| PWA | Installable | ⬜ Verify manifest + SW |

**Known PWA items:**
- ✅ `manifest.webmanifest` generated via `vite-plugin-pwa`
- ✅ Service worker (`sw.js`, Workbox)
- ✅ Icons 48–512 + maskable
- ⬜ Offline fallback page (uses default Workbox)

---

## 4. Backend Performance

| Area | Status |
|------|--------|
| Pagination (default 20, max 100) | ✅ |
| Prisma composite indexes | ✅ Migrations in repo |
| Atomic stock updates | ✅ `updateMany` with quantity guard |
| Connection pooling | ⬜ Add PgBouncer at scale |
| Socket.IO | N/A on Vercel serverless |

---

## 5. Accessibility (WCAG 2.1 AA)

### Implemented

| Feature | Status |
|---------|--------|
| Radix UI primitives (dialogs, tabs) | ✅ |
| Focus rings on interactive elements | ✅ |
| `aria-label` on icon buttons (nav, top bar) | ✅ |
| `role="tablist"` / `aria-selected` on cart hub | ✅ |
| Bengali + English i18n | ✅ |
| RTL utilities (`rtl-utils.ts`) | ✅ |
| Skip links | ⬜ Not verified |
| Color contrast (dark theme) | ⬜ Manual audit pending |

### Recommended audit tools

```bash
# After deploy
npx @axe-core/cli https://<frontend-url> --save audit-axe.json
npx lighthouse https://<frontend-url> --only-categories=accessibility
```

### Priority fixes (expected from full audit)

- [ ] Verify 4.5:1 contrast on `text-text-secondary` in dark mode
- [ ] Add skip-to-content link in `AppLayout`
- [ ] Ensure all form fields have associated `<label>` (login page uses labels ✅)
- [ ] Screen reader test on seller inventory inline edits
- [ ] Toast announcements (`aria-live`) for cart add confirmation

---

## 6. Performance Blockers for Launch

| ID | Issue | Blocker? |
|----|-------|----------|
| PERF-01 | Lighthouse not run on production HTTPS | Yes — required for sign-off |
| PERF-02 | WCAG 2.1 AA full audit not complete | Yes — Play Store / compliance |
| PERF-03 | PWA precache 4.3 MB | No — acceptable; monitor |

---

## 7. Post-Launch Monitoring

- [ ] Vercel Analytics or Plausible on frontend
- [ ] API p95 latency alerts on `/api/v1/listings/search`
- [ ] Error tracking (Sentry) for client + serverless
- [ ] Real User Monitoring for Core Web Vitals
