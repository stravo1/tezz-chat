<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner';

const props = defineProps<ToasterProps>();
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="{
      '--normal-bg': 'var(--color-tertiary-container)',
      '--normal-text': 'var(--color-on-tertiary-container)',
      '--normal-border': 'var(--border)',
    }"
  />
</template>
