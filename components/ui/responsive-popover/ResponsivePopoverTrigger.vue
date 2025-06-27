<script setup lang="ts">
import { inject, computed } from 'vue';
import type { PopoverTriggerProps } from 'reka-ui';
import type { DrawerTriggerProps } from 'vaul-vue';
import PopoverTrigger from '../popover/PopoverTrigger.vue';
import DrawerTrigger from '../drawer/DrawerTrigger.vue';

interface ResponsivePopoverTriggerProps {
  asChild?: boolean;
}

const props = withDefaults(defineProps<ResponsivePopoverTriggerProps>(), {
  asChild: false,
});

// Get context from parent ResponsivePopover
const context = inject<{ isMobile: import('vue').ComputedRef<boolean> }>(
  'responsive-popover-context'
);

if (!context) {
  throw new Error('ResponsivePopoverTrigger must be used within ResponsivePopover');
}

const { isMobile } = context;

// Props for trigger components
const triggerProps = computed(() => ({
  asChild: props.asChild,
}));
</script>

<template>
  <DrawerTrigger v-if="isMobile" v-bind="triggerProps">
    <slot />
  </DrawerTrigger>
  <PopoverTrigger v-else v-bind="triggerProps">
    <slot />
  </PopoverTrigger>
</template>
