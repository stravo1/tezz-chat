<script setup lang="ts">
defineOgImageComponent('Pergel', {
  headline: 'Open-Source ChatGPT Alternative',
  title: 'Tezz Chat',
  description: 'Advanced AI Assistant & ChatGPT Alternative',
  theme: '#FFE245',
  colorMode: 'light',
});
</script>

<template>
  <NuxtPwaManifest />
  <ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ClientOnly>
</template>
