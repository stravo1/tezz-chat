<script setup lang="ts">
import { inject, computed } from 'vue';
import type { HTMLAttributes } from 'vue';
import type { PopoverContentProps } from 'reka-ui';
import type { DialogContentProps } from 'reka-ui';
import { cn } from '@/lib/utils';
import PopoverContent from '../popover/PopoverContent.vue';
import DrawerContent from '../drawer/DrawerContent.vue';
import DrawerHeader from '../drawer/DrawerHeader.vue';
import DrawerTitle from '../drawer/DrawerTitle.vue';
import DrawerDescription from '../drawer/DrawerDescription.vue';

interface ResponsivePopoverContentProps {
  class?: HTMLAttributes['class'];
  title?: string;
  description?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  sideOffset?: number;
}

const props = withDefaults(defineProps<ResponsivePopoverContentProps>(), {
  side: 'bottom',
});

// Get context from parent ResponsivePopover
const context = inject<{ isMobile: import('vue').ComputedRef<boolean> }>(
  'responsive-popover-context'
);

if (!context) {
  throw new Error('ResponsivePopoverContent must be used within ResponsivePopover');
}

const { isMobile } = context;

// Props for popover content
const popoverContentProps = computed<PopoverContentProps & { class?: string }>(() => ({
  side: props.side,
  align: props.align,
  alignOffset: props.alignOffset,
  sideOffset: props.sideOffset,
  class: cn('bg-popover rounded-none md:rounded-md', props.class),
}));

// Props for drawer content
const drawerContentProps = computed(() => ({
  class: cn('max-h-[85dvh] overflow-y-auto bg-popover', props.class),
}));

const hasHeader = computed(() => props.title || props.description);
</script>

<template>
  <DrawerContent v-if="isMobile" class="w-full">
    <DrawerHeader v-if="hasHeader" class="pb-0">
      <DrawerTitle v-if="title">
        {{ title }}
      </DrawerTitle>
      <DrawerDescription v-if="description">
        {{ description }}
      </DrawerDescription>
    </DrawerHeader>
    <div :class="cn(!hasHeader && 'mt-4')">
      <slot />
    </div>
  </DrawerContent>
  <PopoverContent v-else v-bind="popoverContentProps">
    <slot />
  </PopoverContent>
</template>
