<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
</script>

<template>
  <div
    class="bg-background text-foreground fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center"
  >
    <LoaderCircle class="text-foreground animate-spin" />
  </div>
</template>
