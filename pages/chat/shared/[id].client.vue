<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
import { onMounted, computed, watch } from 'vue';
import type { UIMessage } from 'ai';
definePageMeta({
  layout: 'chat',
});
const route = useRoute();
const chatId = ref((route.params.id as string) || '');
const isLoading = ref(true);

const convertToUIMessages = (messages: any, parse: boolean = true) => {
  return messages?.map((message: any) => {
    console.log('Converting message:', message);
    return {
      id: message.$id,
      role: message.role,
      parts: message.parts ? (parse ? JSON.parse(message.parts) : message.parts) : [],
      experimental_attachments: message.attachments
        ? parse
          ? JSON.parse(message.attachments)
          : message.attachments
        : [],
      content: message.content || '',
      createdAt: message.createdAt,
      $createdAt: message.$createdAt,
    };
  });
};

const messages = ref<UIMessage[]>([]);

onMounted(async () => {
  try {
    const chatDetails = await $fetch(`/api/chat/shared/${chatId.value}`, {
      method: 'GET',
    });
    console.log('Chat details fetched successfully:', chatDetails);
    messages.value = convertToUIMessages(chatDetails.chatMessageId || [], false);
    document.title = chatDetails.title || 'Chat';
    isLoading.value = false;
  } catch (error) {
    console.error('Error fetching chat details:', error);
    navigateTo('/chat/', { replace: true });
  }
});

console.log('Chat ID:', chatId.value);
</script>

<template>
  <div
    v-if="isLoading"
    class="bg-inverse-surface fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center backdrop-blur-2xl"
  >
    <LoaderCircle class="text-inverse-on-surface animate-spin" />
  </div>
  <Chat
    v-if="messages.length"
    :key="chatId"
    :chatId="chatId"
    :initialMessages="convertToUIMessages(messages)"
    :is-public="true"
  />
</template>
