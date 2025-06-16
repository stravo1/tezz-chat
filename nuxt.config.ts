// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';
import vueJsxPlugin from '@vitejs/plugin-vue-jsx';
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon', '@pinia/nuxt'],
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
    plugins: [tailwindcss(), vueJsxPlugin()],
    optimizeDeps: {
      include: ['dexie', 'rxdb'],
    },
  },
  css: ['./assets/css/main.css'],
  build: {
    transpile: ['@uivjs/vue-markdown-preview', 'dexie', 'rxdb'],
  },
});
