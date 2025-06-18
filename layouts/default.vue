<template>
  <main class="h-screen w-screen">
    <NuxtPage />
  </main>
</template>

<script setup>
// You can dynamically set metadata if needed
useHead({
  title: 'Tezz Chat',
  meta: [
    {
      name: 'description',
      content: 'ChatGPT Gemini open-source alternative',
    },
  ],
});
</script>
