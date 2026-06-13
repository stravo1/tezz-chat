<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '~/stores/user';
import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';
import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';

const userStore = useUserStore();
const { isTemporaryChat } = storeToRefs(userStore);

const toggle = () => {
  userStore.toggleTemporaryChat();
};
</script>

<template>
  <Tooltip :delayDuration="300">
    <TooltipTrigger asChild>
      <button
        type="button"
        :aria-pressed="isTemporaryChat"
        :aria-label="
          isTemporaryChat
            ? 'Temporary chat on — disable to save history'
            : 'Temporary chat off — enable to chat without saving'
        "
        @click="toggle"
        class="focus-visible:ring-ring/50 relative inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-all outline-none focus-visible:ring-[3px]"
        :class="
          isTemporaryChat
            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
            : 'border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
        "
      >
        <!-- Flash / clock icon -->
        <svg
          class="size-3.5 shrink-0 transition-transform"
          :class="isTemporaryChat ? 'text-primary' : 'text-muted-foreground'"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 4.5V8l2.5 1.5" />
        </svg>

        <span class="hidden sm:inline">Temporary</span>

        <!-- Toggle pill -->
        <span
          class="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors duration-200"
          :class="isTemporaryChat ? 'border-primary/60 bg-primary' : 'border-border/80 bg-muted'"
          aria-hidden="true"
        >
          <span
            class="absolute h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform duration-200"
            :class="isTemporaryChat ? 'translate-x-3.5' : 'translate-x-0.5'"
          />
        </span>
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" class="max-w-[220px] text-center text-xs leading-relaxed">
      <p v-if="isTemporaryChat">
        <span class="text-foreground font-medium">Temporary chat on.</span>
        Messages won't be saved to history.
      </p>
      <p v-else>
        <span class="text-foreground font-medium">Temporary chat off.</span>
        Chats are saved to your history.
      </p>
    </TooltipContent>
  </Tooltip>
</template>
