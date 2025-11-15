import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Activer le PWA en mode développement (optionnel, mais utile)
      
      // Il lira votre manifest.json existant, mais voici une config explicite
      // basée sur vos fichiers.
      manifest: {
        name: 'Flash - Flashcards Intelligentes',
        short_name: 'Flash',
        description: 'Application de flashcards avec répétition espacée et synchronisation cloud',
        theme_color: '#3B82F6',
        background_color: '#0E1116',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/PWA.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      // Configuration du Service Worker (Workbox)
      workbox: {
        // Mettre en cache tous les assets générés par Vite (js, css, html, etc.)
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        
        // Définir votre page offline.html comme fallback
        navigateFallback: '/offline.html',

        // Stratégie pour les requêtes Supabase (toujours réseau, ne pas mettre en cache)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
})