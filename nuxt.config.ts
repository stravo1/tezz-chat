// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';
import vueJsxPlugin from '@vitejs/plugin-vue-jsx';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@pinia/nuxt', '@vite-pwa/nuxt'],
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    cerebrasApiKey: process.env.CEREBRAS_API_KEY || '',
    public: {
      appwrite: {
        url: process.env.NUXT_PUBLIC_APPWRITE_URL,
        realtimeUrl: process.env.NUXT_PUBLIC_APPWRITE_REALTIME_URL,
        projectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID,
        databaseId: process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID,
        storageId: process.env.NUXT_PUBLIC_APPWRITE_STORAGE_ID,
      },
    },
  },
  vite: {
    plugins: [tailwindcss() as any, vueJsxPlugin() as any],
    optimizeDeps: {
      include: ['dexie', 'rxdb'],
    },
  },
  css: ['./assets/css/main.css'],
  $production: {
    build: {
      transpile: ['@uivjs/vue-markdown-preview', 'dexie', 'rxdb'],
    },
  },
  app: {
    head: {
      viewport:
        'width=device-width,initial-scale=1,user-scalable=no,interactive-widget=resizes-content',
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Tezz Chat',
      short_name: 'Tezz Chat',
      description: 'AI-powered chat application',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
        },
        {
          src: 'icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          src: 'icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
        },
        {
          src: 'icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: 'icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
        },
        {
          src: 'icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: 'icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
        },
        {
          src: 'icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
});
