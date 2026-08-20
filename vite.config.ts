import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Rutas relativas: la app funciona igual en la raíz de un dominio propio que
// colgando de /LO_QUE_SEA/ en GitHub Pages, sin tener que acertar con ninguna
// variable. Junto con el enrutado por almohadilla, esto elimina la pantalla
// en blanco por ruta equivocada.
const base = process.env.VITE_BASE ?? './'

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
        id: './',
        scope: './',
        start_url: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111C1F',
        theme_color: '#111C1F',
        icons: [
          { src: './icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: './icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
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
