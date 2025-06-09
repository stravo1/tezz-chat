<script setup lang="ts">
import { useChat } from "@ai-sdk/vue";
import { createMessage, createThread } from "~/utils/database/queries";
import {v4 as uuid} from "uuid";

const props = defineProps<{
  chatId: string;
}>();

const route = useRoute();
const id = route.params.id;

const chatId = props.chatId || "";

if (!chatId) {
  console.warn("No chat ID provided!");
}

const { messages, append } = useChat({
  id: chatId,
});

const handleSubmit = async (message: string) => {
  if (!id) {
    navigateTo(`/chat/${chatId}`);
    console.log("New chat created with ID:", chatId);
    await createThread(chatId);
  }
  const messageId = uuid();
  const userMessage = createUserMessage(messageId, message);
  await createMessage(chatId, userMessage);
  append(userMessage);
};

watch(
  messages,
  (newMessages) => {
    console.log("Messages updated:", newMessages);
    document.getElementById("messages-container")?.scrollTo({
      top: document.getElementById("messages-container")?.scrollHeight,
      behavior: "smooth",
    });
  },
  { deep: true },
);
</script>

<template>
    <ChatMessages :messages="messages" />
    <ChatInput :handleSubmit />
</template>
