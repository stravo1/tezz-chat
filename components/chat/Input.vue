<script setup lang="ts">
import type { ChatRequestOptions, CreateMessage, Message } from "ai";

const props = defineProps<{
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}>();
const message = ref("");
const handleSubmit = () => {
  if (message.value.trim() === "") return;
  let newMessage: Message | CreateMessage = {
    role: "user",
    content: message.value,
  };
  props.append(newMessage);
  message.value = "";
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="absolute right-2 bottom-2 left-2 box-border flex gap-4">
    <input
      v-model="message"
      placeholder="Type your message..."
      class="rounded-lg border-2 bg-white p-3 focus:outline-none w-full"
    />
    <button type="submit" class="border-2 p-3 rounded-lg">Send</button>
  </form>
</template>
