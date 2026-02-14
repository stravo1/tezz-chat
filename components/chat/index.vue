<script setup lang="ts">
import { Chat } from '@ai-sdk/vue';
import type { ChatRequestOptions } from 'ai';
import { ID } from 'appwrite';
import type { AppUIMessage, ChatAttachment } from '~/shared/types/ui-message';
const userStore = useUserStore();
const props = defineProps<{
  chatId: string;
  initialMessages?: AppUIMessage[];
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
if (!props.isPublic) await userStore.getJWT();
const chat = new Chat<AppUIMessage>({
  id: chatId,
  messages: props.initialMessages || [],
  generateId: () => ID.unique(),
  onError: (err: Error) => {
    console.error('Chat error:', err);
  },
});

const messages = computed(() => chat.messages);
const status = computed(() => chat.status);

const setMessages = (newMessages: AppUIMessage[]) => {
  chat.messages = newMessages;
};

const reload = (options?: ChatRequestOptions) => chat.regenerate(options);
const stop = () => chat.stop();

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
  attachments?: ChatAttachment[],
  selectedModel?: string
) => {
  if (!id) {
    navigateTo(`/chat/${chatId}`);
    console.log('New chat created with ID:', chatId);
  }
  const messageId = ID.unique();
  const userMessage = createUserMessage(messageId, message) as AppUIMessage;
  if (attachments?.length) {
    userMessage.experimental_attachments = attachments;
  }
  await chat.sendMessage(userMessage, {
    body: {
      intent: intentStore.selectedIntent,
      model: selectedModel || 'gemini-3-flash-preview',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    headers: {
      Authorization: 'Bearer ' + (await userStore.getJWT()),
      ...getApiHeaders(selectedModel),
    },
  });
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
  (newMessages: AppUIMessage[]) => {
    console.log('Messages updated:', newMessages);
    // @ts-ignore
    messageStore.messages = newMessages;
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
  if (!props.isPublic) {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }
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
      :scroll-to-bottom
    />
    <ChatInput v-if="!isPublic" :handleSubmit :status :stop />
  </div>
</template>
