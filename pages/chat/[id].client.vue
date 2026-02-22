<script setup lang="ts">
import { ID } from 'appwrite';
import { getMessagesByThreadId, getTitle } from '~/utils/database/queries';
definePageMeta({
  layout: 'chat-auth',
});
const route = useRoute();
const chatId = ref((route.params.id as string) || '');
const tempChatId = ID.unique();
const messageStore = useMessageStore();

if (!chatId.value) {
  console.warn('No chat ID provided, creating a new chat.');
}

const convertToUIMessages = (messages: any) => {
  return messages?.map((message: any) => {
    const parts = message.parts ? JSON.parse(message.parts) : [];
    // Merge file parts from attachments into the parts array
    const attachments = message.attachments ? JSON.parse(message.attachments) : [];
    // Add file parts from attachments to the parts array if they exist
    const allParts = [...parts, ...attachments.filter((a: any) => a.type === 'file')];

    return {
      id: message.$id,
      role: message.role,
      parts: allParts.length ? allParts : [{ type: 'text', text: message.content || '' }],
      createdAt: message.createdAt,
    };
  });
};

// If the message store has messages (from ongoing chat), use those
// Otherwise fetch from database
let initialMessages: any[] = [];
if (messageStore.messages.length > 0) {
  console.log('Using messages from store:', messageStore.messages);
  initialMessages = messageStore.messages;
} else {
  const dbMessages = chatId.value ? await getMessagesByThreadId(chatId.value) : [];
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
