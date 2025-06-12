<script setup lang="ts">
import { useChat, type UIMessage } from "@ai-sdk/vue";
import { ID } from "appwrite";
import { getMessagesByThreadId } from "~/utils/database/queries";
definePageMeta({
  layout: "chat-auth",
});
const route = useRoute();
const chatId = ref((route.params.id as string) || "");
const tempChatId = ID.unique();

if (!chatId.value) {
  console.warn("No chat ID provided, creating a new chat.");
}

const convertToUIMessages = (messages: any) => {
    return messages?.map((message: any) => ({
      id: message.id,
      role: message.role,
      parts: message.parts as UIMessage['parts'],
      content: message.content || '',
      createdAt: message.createdAt,
    }));
  };

const messages = await getMessagesByThreadId(chatId.value);
if (messages.length > 0) {
  console.log("Messages found for chat ID:", chatId);
  messages.forEach((msg: any) => {
    console.log("found message:", msg);
    // const userMessage = createUserMessage(msg.id, msg.text);
    // append(userMessage);
  });
} else {
  console.log("No messages found for chat ID:", chatId);
}
watch(
  () => route.params.id,
  (newId) => {
    if (newId !== chatId.value) {
      chatId.value = newId as string;
      console.log("Chat ID updated:", chatId.value);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Chat :key="chatId" :chatId="chatId" :initialMessages="convertToUIMessages(messages)" />
</template>
