<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Bot, User } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const messageStore = useMessageStore();

const openRef = ref(props.open);

watch(
  () => props.open,
  newValue => {
    openRef.value = newValue;
  },
  { immediate: true }
);

/** Extract the first non-empty text from a message's parts. */
const getPreview = (message: any): string => {
  const textPart = message.parts?.find((p: any) => p.type === 'text');
  const raw: string = textPart?.text || message.content || '';
  // Strip markdown heading chars and trim
  return raw.replace(/^#+\s*/m, '').trim();
};

const handleScrollToMessage = (messageId: string) => {
  const el = document.getElementById(`message-${messageId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    openRef.value = false;
    emit('update:open', false);
  }
};

// Only show user + assistant pairs — filter out tool/system roles
const visibleMessages = computed(() =>
  messageStore.messages.filter((m: any) => m.role === 'user' || m.role === 'assistant')
);
</script>

<template>
  <Sheet v-model:open="openRef" @update:open="emit('update:open', $event)">
    <SheetContent class="flex w-80 flex-col gap-0 p-0 sm:w-96">
      <SheetHeader class="border-border/60 border-b px-5 py-4">
        <SheetTitle class="text-sm font-semibold">Chat Navigator</SheetTitle>
        <SheetDescription class="text-xs">
          Jump to any message in this conversation.
        </SheetDescription>
      </SheetHeader>

      <!-- Empty state -->
      <div
        v-if="!visibleMessages.length"
        class="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-12 text-center"
      >
        <svg
          class="text-muted-foreground/40 size-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.25"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
        <p class="text-muted-foreground text-xs">No messages yet.</p>
      </div>

      <!-- Message list -->
      <ul v-else class="flex-1 overflow-y-auto px-2 py-3">
        <li
          v-for="(message, index) in visibleMessages"
          :key="message.id"
          @click="handleScrollToMessage(message.id)"
          class="group hover:bg-muted/60 focus-visible:ring-ring/40 mb-0.5 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors outline-none focus-visible:ring-2"
          tabindex="0"
          @keydown.enter="handleScrollToMessage(message.id)"
          @keydown.space.prevent="handleScrollToMessage(message.id)"
          :aria-label="`Jump to ${message.role === 'user' ? 'your' : 'assistant'} message ${index + 1}`"
        >
          <!-- Role icon -->
          <span
            class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
            :class="
              message.role === 'user'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-primary/10 text-primary'
            "
          >
            <User v-if="message.role === 'user'" class="size-3" />
            <Bot v-else class="size-3" />
          </span>

          <!-- Preview text -->
          <div class="min-w-0 flex-1">
            <p
              class="text-muted-foreground group-hover:text-foreground line-clamp-2 text-xs leading-relaxed transition-colors"
            >
              {{
                getPreview(message) ||
                (message.role === 'user' ? 'User message' : 'Assistant response')
              }}
            </p>
          </div>

          <!-- Index badge -->
          <span class="text-muted-foreground/50 mt-0.5 shrink-0 font-mono text-[10px]">
            {{ index + 1 }}
          </span>
        </li>
      </ul>

      <SheetFooter class="border-border/60 border-t px-5 py-3">
        <p class="text-muted-foreground text-xs">
          {{ visibleMessages.length }} message{{ visibleMessages.length !== 1 ? 's' : '' }}
        </p>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
