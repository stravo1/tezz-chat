<script setup lang="ts">
import { useChat } from "@ai-sdk/vue";
useAuthGuard()
const { messages, append } = useChat({
  id: "c34a6dfe-fb8b-4881-a5ec-daeb4b5b2170",
  body: {
    chatId: "c34a6dfe-fb8b-4881-a5ec-daeb4b5b2170",
  },
});
watch(
  messages,
  (newMessages) => {
    console.log("Messages updated:", newMessages);
  },
  { deep: true },
);
</script>

<template>
  <div class="flex h-screen w-screen">
    <div
      id="sidebar"
      class="flex w-[30vw] shrink-0 flex-row items-center justify-center border"
    >
      Placeholder for sidebar
    </div>
    <div id="chat-view" class="relative box-border flex w-[70vw] p-2 pb-15">
      <ChatMessages :messages />
      <ChatInput :append />
    </div>
  </div>
</template>
