<script setup lang="ts">
import { useChat, type UIMessage } from '@ai-sdk/vue';
import { ID } from 'appwrite';
const userStore = useUserStore();
const props = defineProps<{
  chatId: string;
  initialMessages: UIMessage[];
}>();

const route = useRoute();
const id = route.params.id;

const chatId = props.chatId || '';

if (!chatId) {
  console.warn('No chat ID provided!');
}

const { messages, append } = useChat({
  id: chatId,
  initialMessages: props.initialMessages || [],
  body: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  headers: {
    Authorization: 'Bearer ' + (await userStore.getJWT()),
  },
});

const handleSubmit = async (message: string) => {
  if (!id) {
    navigateTo(`/chat/${chatId}`);
    console.log('New chat created with ID:', chatId);
  }
  const messageId = ID.unique();
  const userMessage = createUserMessage(messageId, message);
  append(userMessage);
};

watch(
  messages,
  newMessages => {
    console.log('Messages updated:', newMessages);
    document.getElementById('messages-container')?.scrollTo({
      top: document.getElementById('messages-container')?.scrollHeight,
      behavior: 'smooth',
    });
  },
  { deep: true }
);
</script>

<template>
  <div class="relative h-full w-full overflow-y-auto">
    <ChatMessages :messages="messages" />
    <ChatInput :handleSubmit />
  </div>
</template>
