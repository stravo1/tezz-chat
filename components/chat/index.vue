<script setup lang="ts">
import { useChat, type UIMessage } from '@ai-sdk/vue';
import { ID } from 'appwrite';
const userStore = useUserStore();
const props = defineProps<{
  chatId: string;
  initialMessages?: UIMessage[];
  isPublic?: boolean;
}>();

const route = useRoute();
const id = route.params.id;
const chatId = props.chatId || '';

const messageStore = useMessageStore();
const intentStore = useIntentStore();

if (!chatId) {
  console.warn('No chat ID provided!');
}

const { messages, append, status, setMessages, reload, error, stop } = useChat({
  id: chatId,
  initialMessages: props.initialMessages || [],
  body: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  generateId: () => ID.unique(),
  sendExtraMessageFields: true,
  onError: err => {
    console.error('Chat error:', err);
    error.value = err;
  },
});

const getApiHeaders = (model?: string) => {
  const headers: Record<string, string> = {};
  const geminiKey = localStorage.getItem('gemini-api-key');
  const openRouterKey = localStorage.getItem('openrouter-api-key');

  if (model?.includes('gemini') && geminiKey) {
    headers['x-gemini-api-key'] = geminiKey;
  } else if (openRouterKey) {
    headers['x-openrouter-api-key'] = openRouterKey;
  }

  return headers;
};

const handleSubmit = async (
  message: string,
  attachments?: UIMessage['experimental_attachments'],
  selectedModel?: string
) => {
  if (!id) {
    navigateTo(`/chat/${chatId}`);
    console.log('New chat created with ID:', chatId);
  }
  const messageId = ID.unique();
  const userMessage = createUserMessage(messageId, message);
  append(userMessage, {
    experimental_attachments: attachments?.length ? attachments : undefined,
    body: {
      intent: intentStore.selectedIntent,
      model: selectedModel || 'gemini-2.0-flash-exp',
    },
    headers: {
      Authorization: 'Bearer ' + (await userStore.getJWT()),
      ...getApiHeaders(selectedModel),
    },
  });
  scrollToBottom();
};

const scrollToBottom = () => {
  if (props.isPublic) return; // Skip scrolling for public chats
  document.getElementById('messages-container')?.scrollTo({
    top: document.getElementById('messages-container')?.scrollHeight,
    behavior: 'smooth',
  });
};

watch(
  messages,
  newMessages => {
    console.log('Messages updated:', newMessages);
    // scrollToBottom();
  },
  { deep: true }
);

watch(status, newStatus => {
  console.log('Status updated:', newStatus);
});

console.log('Chat initialized with ID:', chatId, status.value);

onMounted(() => {
  if (messageStore.isBranched) {
    console.log('Chat has been branched, setting messages from store');
    // @ts-ignore
    setMessages(messageStore.messages);
    messageStore.isBranched = false; // Reset the branched state
    messageStore.messages = []; // Clear messages in store
  } else {
    if (status.value == 'submitted') {
      return;
    }
    console.log('No branching detected, using initial messages');
    setMessages(props.initialMessages || []);
    if (chatId && !messages.value.length) {
      navigateTo('/chat');
    }
  }
  scrollToBottom();
});

const haventGottenFirstChunk = computed(() => {
  return status.value == 'submitted';
});
</script>

<template>
  <div class="relative flex h-full w-full justify-center overflow-y-auto">
    <div
      class="text-on-background h-fit pt-[25vh] text-3xl"
      v-if="!messages.length && status != 'submitted'"
    >
      Hello, {{ userStore.currentUser?.name || 'how can I help?' }}!
    </div>
    <ChatMessages
      v-else
      :messages
      :chat-id
      :set-messages
      :reload
      :haventGottenFirstChunk
      :status
      :is-public
    />
    <ChatInput v-if="!isPublic" :handleSubmit :status :stop />
  </div>
</template>
