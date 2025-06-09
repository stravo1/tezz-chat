<template>
  <div class="flex flex-col min-h-screen text-gray-800">
    <header class="absolute top-0 right-0 p-4 z-50">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="flex-1 container">
      <slot />
    </main>
  </div>
</template>

<script setup>
// You can dynamically set metadata if needed
const route = useRoute()
import Session from "supertokens-web-js/recipe/session";

async function logout () {
  await Session.signOut(); 
  navigateTo("/auth"); // or redirect to wherever the login page is
}
useHead({
  title: route.meta.title || 'My Nuxt App',
  meta: [
    { name: 'description', content: route.meta.description || 'Default site description' }
  ]
})
</script>
