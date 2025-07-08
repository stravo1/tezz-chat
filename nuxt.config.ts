// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process';
const sw = process.env.SW === 'true';

import tailwindcss from '@tailwindcss/vite';
import vueJsxPlugin from '@vitejs/plugin-vue-jsx';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@pinia/nuxt', 'nuxt-og-image', 'nuxt-seo-utils'],
  site: {
    url: 'https://www.tezz.chat',
    name: 'Tezz Chat',
  },
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
    resolve: {
      alias: {
        'micromark-extension-math': 'micromark-extension-llm-math',
      },
    },
  },
  css: ['./assets/css/main.css'],
  $production: {
    build: {
      transpile: ['dexie', 'rxdb'],
    },
    // pwa: {
    //   strategies: sw ? 'injectManifest' : 'generateSW',
    //   srcDir: sw ? 'service-worker' : undefined,
    //   filename: sw ? 'sw.ts' : undefined,
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'Tezz Chat',
    //     short_name: 'Tezz Chat',
    //     description: 'AI-powered chat application',
    //     theme_color: '#fcd195',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     icons: [
    //       {
    //         src: 'icons/icon-72x72.png',
    //         sizes: '72x72',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icons/icon-96x96.png',
    //         sizes: '96x96',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icons/icon-128x128.png',
    //         sizes: '128x128',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icons/icon-144x144.png',
    //         sizes: '144x144',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icons/icon-152x152.png',
    //         sizes: '152x152',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icons/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any maskable',
    //       },
    //       {
    //         src: 'icons/icon-384x384.png',
    //         sizes: '384x384',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icons/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //       },
    //     ],
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    //   },
    //   client: {
    //     installPrompt: true,
    //   },
    //   devOptions: {
    //     enabled: true,
    //     type: 'module',
    //   },
    // },
  },
  app: {
    head: {
      viewport:
        'width=device-width,initial-scale=1,user-scalable=no,interactive-widget=resizes-content',
      title: 'Tezz Chat',
      link: [
        {
          rel: 'shortcut icon',
          type: 'image/x-icon',
          href: 'favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'apple-touch-startup-image',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href: '/android-chrome-192x192.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '512x512',
          href: '/android-chrome-512x512.png',
        },
      ],
    },
  },
});
