<script setup lang="ts">
import { ID } from 'appwrite';
definePageMeta({
  layout: 'chat-auth',
});
</script>

<template>
  <Chat :chatId="ID.unique()" />
</template>
