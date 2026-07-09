import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest (rather than the default generateSW) lets us ship a
      // hand-written service worker (src/sw.js) with custom `push` and
      // `notificationclick` listeners, while vite-plugin-pwa still handles
      // injecting the precache manifest into it at build time.
      strategies: 'injectManifest',
      srcDir:     'src',
      filename:   'sw.js',
      injectManifest: {
        // Keep the precached asset list reasonably small — big media files
        // (equipment/workout photos, videos) are loaded from the API and
        // Cloudinary directly, not part of the app shell.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'FitOS Member Portal',
        short_name: 'FitOS',
        description: 'View your membership, plans, invoices and workout schedule.',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        // Lets you test the install prompt + push notifications during `npm run dev`
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
