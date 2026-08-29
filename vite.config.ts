import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * `VITE_BASE` lets us build for a subpath host (GitHub Pages project sites need
 * `/algebaran/`) without hard-coding it for local dev.
 */
const base = process.env.VITE_BASE ?? '/';

const APP_VERSION = process.env.npm_package_version ?? '0.2.0';

export default defineConfig({
  server: {
    // Honour the port the harness assigns. Vite does not read PORT on its own,
    // and nothing here is tied to a fixed origin — no OAuth callback, no
    // webhook — so any free port will do.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  // Surfaced on the Settings > About row.
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  base,
  build: {
    // Vite 8 minifies CSS with lightningcss, a native module whose per-platform
    // binary is missing from a macOS-generated lockfile — which breaks the Linux
    // CI build. esbuild is pure-JS-addressable here and loses ~nothing on a
    // stylesheet this size.
    cssMinify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Algebaran — quadratic equations',
        short_name: 'Algebaran',
        description: 'Learn quadratic equations on a journey across the stars.',
        theme_color: '#0A0D24',
        background_color: '#0A0D24',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The whole app is static; precache it so it works offline once installed.
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,mp4}'],
      },
    }),
  ],
});
