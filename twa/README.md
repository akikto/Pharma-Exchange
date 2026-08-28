# Pharma Exchange — Android TWA

Trusted Web Activity wrapper for Google Play. Loads the **production** PWA:

`https://pharma-exchange-frontend.vercel.app`

Full guide: **[docs/android-twa-release.md](../docs/android-twa-release.md)**

Quick start:

```bash
node twa/scripts/validate-twa-manifest.mjs
bash twa/scripts/prepare-android-resources.sh
bash twa/scripts/build-release.sh   # requires keystore.properties + release.keystore
```

Package: `com.pharmex.exchange`
