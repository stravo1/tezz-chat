<script setup lang="ts">
import useDatabase from './utils/database/db';
useDatabase();
console.log("Database initialized");
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
