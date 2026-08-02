import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'PharmEx',
        short_name: 'PharmEx',
        description: 'B2B Pharmacy Marketplace',
        theme_color: '#0F766E',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:3000\/api\/v1\/listings\/search/,
            handler: 'NetworkFirst',
            options: { cacheName: 'listings-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
