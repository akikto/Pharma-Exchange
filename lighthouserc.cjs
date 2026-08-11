/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview --workspace=frontend -- --host 127.0.0.1 --port 4173',
      startServerReadyPattern: 'Local',
      url: [
        'http://127.0.0.1:4173/login',
        'http://127.0.0.1:4173/',
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 800 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
