<script setup lang="ts">
import { SidebarGroupLabel } from '~/components/ui/sidebar';
import ChatItem from './Item.vue';

interface Chat {
  id: string;
  title: string;
  isBranched: boolean;
  visibility?: string;
  createdAt: string;
}

interface Props {
  title: string;
  chats: Chat[];
  activeChat: (chatId: string) => boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  startRename: [chatId: string, currentTitle: string];
  shareChat: [chatId: string, visibility: string];
  deleteThread: [chatId: string];
}>();
</script>

<template>
  <template v-if="chats.length > 0">
    <SidebarGroupLabel class="syne text-muted-foreground mt-4 mb-2 text-xs font-medium">
      {{ title }}
    </SidebarGroupLabel>
    <ChatItem
      v-for="chat in chats"
      :key="chat.id"
      :chat="chat"
      :is-active="props.activeChat(chat.id)"
      @start-rename="(chatId, title) => $emit('startRename', chatId, title)"
      @share-chat="(chatId, visibility) => $emit('shareChat', chatId, visibility)"
      @delete-thread="chatId => $emit('deleteThread', chatId)"
    />
  </template>
</template>
