import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// En GitHub Pages la app cuelga de /<repo>/ salvo que haya dominio propio.
// Se controla con VITE_BASE en el momento de compilar.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icono-192.png', 'icono-512.png'],
      manifest: {
        name: 'Estook · Tu cocina, bajo control',
        short_name: 'Estook',
        description: 'Gestión para bares y restaurantes.',
        lang: 'es-ES',
        id: base,
        scope: base,
        start_url: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111C1F',
        theme_color: '#111C1F',
        icons: [
          { src: `${base}icono-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icono-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${base}icono-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            // Datos de Supabase: red primero, con copia para poder abrir la app sin cobertura.
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'datos-estook',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ficheros-estook',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
