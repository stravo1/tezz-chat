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

const convertToUIMessages = (messages: any, parse: boolean = true): UIMessage[] => {
  return messages?.map((message: any) => {
    const parts = message.parts ? (parse ? JSON.parse(message.parts) : message.parts) : [];
    // Merge file parts from attachments into the parts array
    const attachments = message.attachments
      ? parse
        ? JSON.parse(message.attachments)
        : message.attachments
      : [];
    // Add file parts from attachments to the parts array if they exist
    const allParts = [...parts, ...attachments.filter((a: any) => a.type === 'file')];

    return {
      id: message.$id,
      role: message.role,
      parts: allParts.length ? allParts : [{ type: 'text', text: message.content || '' }],
    };
  });
};

const messages = ref<UIMessage[]>([]);

onMounted(async () => {
  try {
    const chatDetails = await $fetch<{
      title: string;
      visibility: string;
      messages: any[];
    }>(`/api/chat/shared/${chatId.value}`, {
      method: 'GET',
    });
    console.log('Chat details fetched successfully:', chatDetails);
    messages.value = convertToUIMessages(chatDetails.messages || []);
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
    class="bg-background fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center backdrop-blur-2xl"
  >
    <LoaderCircle class="text-foreground animate-spin" />
  </div>
  <Chat
    v-if="messages.length"
    :key="chatId"
    :chatId="chatId"
    :initialMessages="messages"
    :is-public="true"
  />
</template>
