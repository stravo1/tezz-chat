<template>
  <div class="relative flex min-h-screen flex-col text-gray-800">
    <header class="absolute top-0 right-0 z-50 p-4">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="flex h-screen w-screen">
      <div
        id="sidebar"
        class="flex w-[30vw] shrink-0 flex-col items-center justify-center gap-10 border"
      >
        <NuxtLink to="87839f3b-c33b-420d-869a-03ece8d80370"> one </NuxtLink>
        <NuxtLink to="a4970ed3-1dff-422a-bc11-d362bbe7d1c9"> two </NuxtLink>
      </div>
      <div
        id="chat-view"
        class="relative box-border flex w-[70vw] shrink-0 p-2 pb-15"
      >
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
// You can dynamically set metadata if needed
const route = useRoute();
import Session from "supertokens-web-js/recipe/session";

async function logout() {
  await Session.signOut();
  navigateTo("/auth"); // or redirect to wherever the login page is
}
useHead({
  title: route?.meta?.title || "My Nuxt App",
  meta: [
    {
      name: "description",
      content: route?.meta?.description || "Default site description",
    },
  ],
});
</script>
