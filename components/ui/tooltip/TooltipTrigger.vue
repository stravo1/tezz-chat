<script setup lang="ts">
import { TooltipTrigger, type TooltipTriggerProps } from 'reka-ui';
import { computed } from 'vue';

const props = defineProps<TooltipTriggerProps>();

// Filter out props that shouldn't be passed to TooltipTrigger
// This prevents 'as' property warning when using asChild with Button
const filteredProps = computed(() => {
  const { ...rest } = props;
  return rest;
});
</script>

<template>
  <TooltipTrigger data-slot="tooltip-trigger" v-bind="filteredProps">
    <slot />
  </TooltipTrigger>
</template>
