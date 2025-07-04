<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import { useDark } from '@vueuse/core';
import 'vue-sonner/style.css';
import { Analytics } from '@vercel/analytics/nuxt';

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
});
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
  <ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ClientOnly>
</template>
