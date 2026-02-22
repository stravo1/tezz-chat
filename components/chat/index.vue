<script setup lang="ts">
import { Chat } from '@ai-sdk/vue';
import type { ChatRequestOptions, UIMessage, FileUIPart } from 'ai';
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
const modelStore = useModelStore();

if (!chatId) {
  console.warn('No chat ID provided!');
}
if (!props.isPublic) await userStore.getJWT();
const chat = new Chat<UIMessage>({
  id: chatId,
  messages: props.initialMessages || [],
  generateId: () => ID.unique(),
  onError: (err: Error) => {
    console.error('Chat error:', err);
  },
});

const messages = computed(() => chat.messages);
const status = computed(() => chat.status);
const lastMessage = computed(() => {
  const msgs = chat.messages;
  return msgs.length > 0 ? msgs[msgs.length - 1] : null;
});

const setMessages = (newMessages: UIMessage[]) => {
  chat.messages = newMessages;
};

const reload = (options?: { messageId?: string } & ChatRequestOptions) => chat.regenerate(options);
const stop = () => chat.stop();

const getApiHeaders = (model?: string) => {
  const headers: Record<string, string> = {};
  const geminiKey = localStorage.getItem('gemini-api-key');
  const openRouterKey = localStorage.getItem('openrouter-api-key');
  const openaiKey = localStorage.getItem('openai-api-key');
  const anthropicKey = localStorage.getItem('anthropic-api-key');

  // For custom models, include all available keys
  if (model?.startsWith('custom-')) {
    if (geminiKey) headers['x-gemini-api-key'] = geminiKey;
    if (openRouterKey) headers['x-openrouter-api-key'] = openRouterKey;
    if (openaiKey) headers['x-openai-api-key'] = openaiKey;
    if (anthropicKey) headers['x-anthropic-api-key'] = anthropicKey;
  } else if (model?.includes('gemini') && geminiKey) {
    headers['x-gemini-api-key'] = geminiKey;
  } else if (openRouterKey) {
    headers['x-openrouter-api-key'] = openRouterKey;
  }

  return headers;
};

// Get custom model config if selected model is a custom model
const getCustomModelConfig = (modelId?: string) => {
  if (!modelId?.startsWith('custom-')) return undefined;
  const customModel = modelStore.customModels.find((m: any) => m.id === modelId);
  return customModel || undefined;
};

const handleSubmit = async (message: string, files?: FileUIPart[], selectedModel?: string) => {
  const isNewChat = !id;
  const customModelConfig = getCustomModelConfig(selectedModel);

  // Send message with files using the new AI SDK pattern
  // Don't await - let it start streaming while we navigate
  const sendPromise = chat.sendMessage(
    {
      text: message,
      files: files,
    },
    {
      body: {
        intent: intentStore.selectedIntent,
        model: selectedModel || 'gemini-3-flash-preview',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        customModelConfig: customModelConfig,
      },
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
        ...getApiHeaders(selectedModel),
      },
    }
  );

  // For new chats, navigate after a small delay to ensure message is added to chat state
  if (isNewChat) {
    await nextTick();
    // Use replace to avoid adding to history stack
    navigateTo(`/chat/${chatId}`, { replace: true });
    console.log('New chat created with ID:', chatId);
  }

  await sendPromise;
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
  (newMessages: UIMessage[]) => {
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

const haventGottenFirstChunk = computed(
  () =>
    status.value === 'submitted' ||
    (status.value === 'streaming' &&
      lastMessage?.value?.role === 'assistant' &&
      lastMessage?.value?.parts?.length === 0)
);
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
