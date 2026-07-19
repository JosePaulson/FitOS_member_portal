import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

// A fresh value every time `vite build` runs. Baked into the JS bundle via
// `define` (so the already-loaded app knows what version IT is), and also
// written to dist/version.json (a plain static file, always reflecting
// whatever's actually deployed) — the update-checker compares the two.
const BUILD_VERSION = String(Date.now())

function versionFilePlugin() {
  return {
    name: 'write-version-json',
    apply: 'build',
    writeBundle(options) {
      fs.writeFileSync(
        path.join(options.dir || 'dist', 'version.json'),
        JSON.stringify({ version: BUILD_VERSION })
      )
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  plugins: [
    react(),
    versionFilePlugin(),
    VitePWA({
      // injectManifest (rather than the default generateSW) lets us ship a
      // hand-written service worker (src/sw.js) with custom `push` and
      // `notificationclick` listeners, while vite-plugin-pwa still handles
      // injecting the precache manifest into it at build time.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // Keep the precached asset list reasonably small — big media files
        // (equipment/workout photos, videos) are loaded from the API and
        // Cloudinary directly, not part of the app shell.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Must NEVER be precached — the update-checker relies on fetching
        // this fresh (network, no-store) to detect a new deploy. If the
        // service worker served it from cache, updates would never be
        // detected.
        globIgnores: ['version.json'],
      },
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'FitOS Member Portal',
        short_name: 'FitOS',
        description: 'View your membership, plans, pt-sessions, diet plans, invoices and workout schedule.',
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
