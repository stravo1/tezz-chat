<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center bg-[rgba(255,255,255,0.5)] text-black backdrop-blur-sm dark:bg-[rgba(0,0,0,0.5)] dark:text-white"
  >
    <LoaderCircle class="animate-spin text-white" />
  </div>
</template>
