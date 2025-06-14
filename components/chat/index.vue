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

const { messages, append, status } = useChat({
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
  scrollToBottom();
};

const scrollToBottom = () => {
  document.getElementById('messages-container')?.scrollTo({
    top: document.getElementById('messages-container')?.scrollHeight,
    behavior: 'smooth',
  });
};

watch(
  messages,
  newMessages => {
    console.log('Messages updated:', newMessages);
    scrollToBottom();
  },
  { deep: true }
);

watch(status, newStatus => {
  console.log('Status updated:', newStatus);
});

console.log('Chat initialized with ID:', chatId, status.value);

onMounted(() => {
  scrollToBottom();
});

const haventGottenFirstChunk = computed(() => {
  return status.value == 'submitted';
});
</script>

<template>
  <div class="relative flex h-full w-full justify-center overflow-y-auto">
    <div class="text-on-background h-fit pt-[25vh] text-3xl" v-if="!messages.length">
      Hello, {{ userStore.currentUser?.name || 'how can I help?' }}!
    </div>
    <ChatMessages v-else :messages="messages" :haventGottenFirstChunk />
    <ChatInput :handleSubmit />
  </div>
</template>
