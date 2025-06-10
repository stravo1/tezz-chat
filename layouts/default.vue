<template>
    <header class="absolute top-0 right-0 z-50 p-4">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="h-screen w-screen">
      <slot />
    </main>
</template>

<script setup>
// You can dynamically set metadata if needed
useHead({
  title:  "My Nuxt App",
  meta: [
    {
      name: "description",
      content:  "Default site description",
    },
  ],
});

</script>
