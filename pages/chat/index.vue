<script setup lang="ts">
import { ID } from 'appwrite';
useAuthGuard();
</script>

<template>
  <Chat :chatId="ID.unique()" />
</template>
