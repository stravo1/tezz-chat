<script setup lang="ts">
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
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

const getApiHeaders = (model?: string): Record<string, string> => {
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

const chat = new Chat<UIMessage>({
  id: chatId,
  messages: props.initialMessages || [],
  generateId: () => ID.unique(),
  transport: new DefaultChatTransport({
    api: '/api/chat',
    // Static defaults included in every request automatically
    body: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    // Use prepareSendMessagesRequest for auth headers + dynamic fields.
    // When this returns a body it fully replaces the default, so we must
    // re-include the SDK-managed fields (id, messages, trigger, messageId).
    prepareSendMessagesRequest: async ({
      id: reqChatId,
      messages,
      body,
      headers,
      trigger,
      messageId,
    }) => {
      const jwt = await userStore.getJWT();
      const currentModel = modelStore.selectedModel || 'gemini-3-flash-preview';
      return {
        body: {
          // Re-include SDK-managed fields (required when overriding body)
          id: reqChatId,
          messages,
          trigger,
          messageId,
          // Merge any extra fields passed via ChatRequestOptions.body
          // (e.g. isEdited, editedFrom, editedFromId from regenerate calls)
          ...body,
          // Dynamic per-request fields
          intent: intentStore.selectedIntent,
          model: currentModel,
        },
        headers: {
          ...(headers as Record<string, string>),
          Authorization: `Bearer ${jwt}`,
          ...getApiHeaders(currentModel),
        },
      };
    },
  }),
  onError: (err: Error) => {
    console.error('Chat error:', err);
  },
});

const messages = computed(() => chat.messages);
const status = computed(() => chat.status);

const setMessages = (newMessages: UIMessage[]) => {
  chat.messages = newMessages;
};

const reload = (options?: ChatRequestOptions) => chat.regenerate(options);
const stop = () => chat.stop();

const handleSubmit = async (message: string, files?: FileUIPart[], selectedModel?: string) => {
  const isNewChat = !id;

  // Update model in store if provided so prepareSendMessagesRequest picks it up
  if (selectedModel) {
    modelStore.selectedModel = selectedModel;
  }

  // Send message with files using the new AI SDK v6 pattern.
  // Don't await - let it start streaming while we navigate
  const sendPromise = chat.sendMessage({
    text: message,
    files: files,
  });

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
