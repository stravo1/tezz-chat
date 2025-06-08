<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';
import {v4 as uuid} from 'uuid';
const { messages, append } = useChat(
  {
    id: "c34a6dfe-fb8b-4881-a5ec-daeb4b5b2170",
    body: {
      chatId: "c34a6dfe-fb8b-4881-a5ec-daeb4b5b2170",
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