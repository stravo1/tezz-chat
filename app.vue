<script setup lang="ts">
import useDatabase from './utils/database/db';
useDatabase();
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
