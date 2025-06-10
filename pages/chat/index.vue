<script setup lang="ts">
import { ID } from 'appwrite';
definePageMeta({
  layout: 'chat',
});
</script>

<template>
  <Chat :chatId="ID.unique()" />
</template>
