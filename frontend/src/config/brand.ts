/**
 * MedLink B2B – Brand assets configuration
 *
 * Place your files in frontend/public/brand/:
 *   - icon.png  (or icon.svg)  → square app icon, min 512×512
 *   - logo.png  (optional)     → horizontal logo for login/splash screens
 *
 * Then run: npm run icons --workspace=frontend
 */

export const brand = {
  name: 'MedLink B2B',
  tagline: 'B2B Pharmacy Marketplace',

  /** Square icon – PWA, favicon, app icon */
  icon: '/icons/icon-512.png',
  icon192: '/icons/icon-192.png',

  /** Wide logo for splash/login (falls back to icon if missing) */
  logo: '/brand/logo.png',
  logoOnDark: '/brand/logo-light.png',

  themeColor: '#0F766E',
} as const;
