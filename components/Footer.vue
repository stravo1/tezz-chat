<template>
  <footer class="bg-gray-100 text-center py-6">
    <p>&copy; {{ year }} MyNuxtSite. All rights reserved.</p>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
