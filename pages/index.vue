<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';
import {v4 as uuid} from 'uuid';
const { messages, append } = useChat(
  {
    id: "c0ec810d-9a0b-4a92-baa8-60e455e68e76",
    body: {
      chatId: "c0ec810d-9a0b-4a92-baa8-60e455e68e76",
    }
  }
);
watch(messages, (newMessages) => {
  console.log('Messages updated:', newMessages);
}, { deep: true });


</script>

<template>
  <div class="flex w-screen h-screen">
    <div id="sidebar" class="flex flex-row w-[30vw] shrink-0 justify-center items-center border">
      Placeholder for sidebar
    </div>
    <div id="chat-view" class="flex w-[70vw] relative p-2 box-border pb-15">
      <ChatMessages :messages />
      <ChatInput :append />
    </div>
  </div>
</template>