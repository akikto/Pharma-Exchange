# Play Store Readiness Checklist — PharmEx

PharmEx is a PWA. Play Store distribution requires wrapping the PWA as a Trusted Web Activity (TWA) or Capacitor app.

## Assets (In Repo)

- [x] App icon SVG: `frontend/public/icons/icon.svg`
- [x] PNG 192x192: `frontend/public/icons/icon-192.png`
- [x] PNG 512x512: `frontend/public/icons/icon-512.png`
- [x] Maskable icon: `frontend/public/icons/icon-maskable-512.png`
- [x] PWA manifest with theme/background colors
- [x] Splash via PWA `background_color` + icon

## Required Before Submission

- [ ] Host PWA on HTTPS production domain
- [ ] Generate TWA with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or Capacitor
- [ ] Privacy policy URL (required by Google Play)
- [ ] Data safety form in Play Console
- [ ] Target API level compliance (Android 14+ recommended)

## Permissions Review

Current PWA permissions (minimal):
- Notifications (FCM) — request at runtime
- Camera/files — only if license upload uses native picker in TWA

Avoid requesting unnecessary permissions.

## Release Build Steps (TWA Example)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://your-app.vercel.app/manifest.webmanifest
bubblewrap build
```

Upload AAB to Play Console internal testing track first.

## Store Listing

- App name: PharmEx
- Short description: B2B Pharmacy Marketplace
- Category: Business / Medical
- Screenshots: phone + tablet (required sizes per Play Console)
- Feature graphic: 1024x500

## Compliance

- Pharmacy verification workflow supports regulatory requirements
- Document data retention and user deletion process in privacy policy
