<template>
  <div class="flex flex-col min-h-screen text-gray-800">
    <main class="flex-1 container">
      <slot />
    </main>
  </div>
</template>

<script setup>
// You can dynamically set metadata if needed
const route = useRoute()

useHead({
  title: route.meta.title || 'My Nuxt App',
  meta: [
    { name: 'description', content: route.meta.description || 'Default site description' }
  ]
})
</script>
