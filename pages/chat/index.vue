<script setup lang="ts">
import { v4 as uuid } from "uuid";
useAuthGuard();
</script>

<template>
  <Chat :chatId="uuid()" />
</template>
