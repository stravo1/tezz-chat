<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import 'vue-sonner/style.css';
import { Analytics } from '@vercel/analytics/nuxt';
defineOgImageComponent('Pergel', {
  headline: 'Open-Source ChatGPT Alternative',
  title: 'Tezz Chat',
  description: 'Advanced AI Assistant & ChatGPT Alternative',
  theme: '#FFE245',
  colorMode: 'light',
});
</script>

<template>
  <Analytics />
  <Toaster />
  <NuxtPwaManifest />
  <ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ClientOnly>
</template>
