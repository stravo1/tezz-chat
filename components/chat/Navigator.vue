<script setup lang="ts">
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Button from '../ui/button/Button.vue';
import { Bot, Ghost, User } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
}>();

const messageStore = useMessageStore();

const openRef = ref(props.open);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

watch(
  () => props.open,
  newValue => {
    openRef.value = newValue;
  },
  { immediate: true }
);

const handleScrollToMessage = (messageId: string) => {
  const messageElement = document.getElementById(`message-${messageId}`);
  if (messageElement) {
    messageElement.scrollIntoView({ behavior: 'smooth' });
    openRef.value = false; // Close the navigator after scrolling
    emit('update:open', false);
  }
};
</script>
<template>
  <Sheet v-model:open="openRef" @update:open="emit('update:open', $event)">
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Chat Navigator</SheetTitle>
        <SheetDescription> Quickly jump to any message in the chat history. </SheetDescription>
      </SheetHeader>
      <div class="h-full overflow-auto">
        <ul class="space-y-2 p-4">
          <li
            v-for="message in messageStore.messages"
            :key="message.id"
            class="hover:bg-muted/50 cursor-pointer rounded p-2"
            @click="() => handleScrollToMessage(message.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="text-foreground/70 line-clamp-1 text-base">
                {{ message.content.split('.')[0] }}
              </div>
              <div class="text-foreground/30">
                <Bot v-if="message.role != 'user'" class="inline h-5 w-5" />
                <User v-else class="inline h-5 w-5" />
              </div>
            </div>
          </li>
        </ul>
      </div>
      <SheetFooter class="text-foreground/70 flex items-center justify-center text-xs">
        {{ messageStore.messages.length }} messages
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
