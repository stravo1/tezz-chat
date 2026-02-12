<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { Primitive, type PrimitiveProps } from 'reka-ui';
import { cn } from '@/lib/utils';
import { type ButtonVariants, buttonVariants } from '.';

interface Props extends /* @vue-ignore */ PrimitiveProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: HTMLAttributes['class'];
  as?: PrimitiveProps['as'];
  asChild?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  asChild: false,
});
</script>

<template>
  <Primitive
    data-slot="button"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
