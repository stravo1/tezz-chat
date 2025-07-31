<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
interface Props {
  message?: string;
}
const props = defineProps<Props>();
</script>

<template>
  <div
    class="bg-background/90 text-foreground fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center backdrop-blur-xs"
  >
    <LoaderCircle class="text-foreground animate-spin" />
    <span v-if="props.message" class="text-foreground ml-2 text-lg">{{ props.message }}</span>
  </div>
</template>
