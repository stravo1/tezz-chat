<script setup lang="ts">
import { useChat, type UIMessage } from "@ai-sdk/vue";
import { ID } from "appwrite";
definePageMeta({
  layout: "chat-auth",
})
const route = useRoute();
const chatId = ref((route.params.id as string) || "");
const tempChatId = ID.unique();

if (!chatId.value) {
  console.warn("No chat ID provided, creating a new chat.");
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
  <Chat :key="chatId" :chatId="chatId" />
</template>
