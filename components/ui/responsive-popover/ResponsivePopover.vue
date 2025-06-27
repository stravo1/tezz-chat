<script setup lang="ts">
import { provide, computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import type { PopoverRootProps } from 'reka-ui';
import type { DrawerRootProps } from 'vaul-vue';
import Popover from '../popover/Popover.vue';
import Drawer from '../drawer/Drawer.vue';

interface ResponsivePopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

const props = withDefaults(defineProps<ResponsivePopoverProps>(), {
  modal: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [open: boolean];
}>();

// Use mobile breakpoint - you can adjust this as needed
const isMobile = useMediaQuery('(max-width: 768px)');

// Provide context for child components
provide('responsive-popover-context', {
  isMobile: computed(() => isMobile.value),
});

// Handle open state updates
const handleOpenChange = (open: boolean) => {
  emit('update:open', open);
  emit('openChange', open);
  props.onOpenChange?.(open);
};

// Props for popover/drawer
const popoverProps = computed<PopoverRootProps>(() => ({
  open: props.open,
  modal: props.modal,
}));

const drawerProps = computed<DrawerRootProps>(() => ({
  open: props.open,
  modal: props.modal,
}));
</script>

<template>
  <Drawer v-if="isMobile" v-bind="drawerProps" @update:open="handleOpenChange" class="w-full">
    <slot />
  </Drawer>
  <Popover v-else v-bind="popoverProps" @update:open="handleOpenChange">
    <slot />
  </Popover>
</template>
