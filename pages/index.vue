<script setup lang="ts">
import { onMounted } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';

onMounted(() => {
  navigateTo("/chat/");
});
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center">
    <LoaderCircle class="h-8 w-8 animate-spin" />
  </div>
</template>
