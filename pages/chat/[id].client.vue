<script setup lang="ts">
import { ID } from 'appwrite';
import { getMessagesByThreadId } from '~/utils/database/queries';
import type { BranchBootstrap } from '~/utils/database/queries';

definePageMeta({
  layout: 'chat-auth',
});

const route = useRoute();
const chatId = ref((route.params.id as string) || '');
const messageStore = useMessageStore();

if (!chatId.value) {
  console.warn('No chat ID provided, creating a new chat.');
}

const branchBootstrap = (history.state?.branchBootstrap ?? null) as BranchBootstrap | null;

const convertToUIMessages = (messages: any) => {
  return messages?.map((message: any) => {
    const parts = message.parts ? JSON.parse(message.parts) : [];
    const attachments = message.attachments ? JSON.parse(message.attachments) : [];
    const allParts = [...parts, ...attachments.filter((a: any) => a.type === 'file')];

    return {
      id: message.$id,
      role: message.role,
      parts: allParts.length ? allParts : [{ type: 'text', text: message.content || '' }],
    };
  });
};

let initialMessages: any[] = [];
if (messageStore.messages.length > 0) {
  console.log('Using messages from store:', messageStore.messages);
  initialMessages = messageStore.messages;
} else {
  const dbMessages = chatId.value
    ? await getMessagesByThreadId(chatId.value, branchBootstrap ?? undefined)
    : [];
  if (dbMessages.length > 0) {
    console.log('Messages found for chat ID:', chatId);
    initialMessages = convertToUIMessages(dbMessages);
  } else {
    console.log('No messages found for chat ID:', chatId);
  }
}
</script>

<template>
  <Chat :key="chatId" :chatId="chatId" :initialMessages="initialMessages" />
</template>
