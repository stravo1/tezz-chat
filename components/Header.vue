<template>
  <header class="bg-white shadow sticky top-0 z-50">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
      <NuxtLink to="/" class="text-xl font-bold">MyNuxtSite</NuxtLink>
      <div class="space-x-4">
        <NuxtLink to="/" class="hover:underline">Home</NuxtLink>
        <NuxtLink to="/about" class="hover:underline">About</NuxtLink>
        <NuxtLink to="/contact" class="hover:underline">Contact</NuxtLink>
      </div>
    </nav>
  </header>
</template>
