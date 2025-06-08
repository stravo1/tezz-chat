<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';

const { messages, append } = useChat();
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