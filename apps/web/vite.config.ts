import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'AutoDiag – Συνεργείο',
        short_name: 'AutoDiag',
        description: 'Πελάτες, οχήματα, ραντεβού και κάρτες εργασίας',
        lang: 'el',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f1f5f9',
        theme_color: '#0f172a',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Offline ανάγνωση: πρόσφατα δεδομένα αν δεν υπάρχει σήμα μέσα στο συνεργείο
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth') &&
              !url.pathname.startsWith('/api/ics') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 4, expiration: { maxEntries: 300, maxAgeSeconds: 7 * 86400 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5180,
    strictPort: true,
    host: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
})
