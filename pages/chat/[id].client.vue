<script setup lang="ts">
import { ID } from 'appwrite';
import { getMessagesByThreadId, getTitle } from '~/utils/database/queries';
definePageMeta({
  layout: 'chat-auth',
});
const route = useRoute();
const chatId = ref((route.params.id as string) || '');
const tempChatId = ID.unique();

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
    };
  });
};

const messages = chatId.value ? await getMessagesByThreadId(chatId.value) : [];
if (messages.length > 0) {
  console.log('Messages found for chat ID:', chatId);
  messages.forEach((msg: any) => {
    // console.log('found message:', msg);
    // const userMessage = createUserMessage(msg.id, msg.text);
    // append(userMessage);
  });
} else {
  console.log('No messages found for chat ID:', chatId);
}
</script>

<template>
  <Chat :key="chatId" :chatId="chatId" :initialMessages="convertToUIMessages(messages)" />
</template>
