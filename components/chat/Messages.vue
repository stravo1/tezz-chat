<script setup lang="tsx">
import type { ChatRequestOptions, UIMessage } from 'ai';

import { useElementHover, useTextareaAutosize } from '@vueuse/core';
import { ChevronsDown, File, LoaderCircle } from 'lucide-vue-next';
import { useScroll } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import Button from '../ui/button/Button.vue';

const props = defineProps<{
  chatId?: string;
  messages: UIMessage[];
  haventGottenFirstChunk?: boolean;
  setMessages: (messages: UIMessage[]) => void;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  status: string;
  isPublic?: boolean;
  scrollToBottom: () => void;
}>();

const messageStore = useMessageStore();
const userStore = useUserStore();
const modelStore = useModelStore();
const intentStore = useIntentStore();

const { textarea, input: contentBeingEdited } = useTextareaAutosize();
const el = useTemplateRef<HTMLElement>('messages-container');
const { isScrolling, arrivedState } = useScroll(el);
const myHoverableElement = useTemplateRef<HTMLButtonElement>('scroll-to-bottom-button');
const isHovered = useElementHover(myHoverableElement);

const isBeingEdited = ref(false);
const timeStampOfMessageBeingEdited = ref<string | null>(null);
const isScrollToBottomVisible = ref(false);
const scrollToBottomTimeout = ref<NodeJS.Timeout | null>(null);

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

const handleBranch = async (id: string, createdAt: any) => {
  // from the list of messages passed as props, remove all messages that are older than the createdAt timestamp
  const filteredMessages = props.messages.filter(message => {
    try {
      return new Date(message.createdAt as any) <= new Date(createdAt);
    } catch (error) {
      console.error('Error comparing dates:', error);
      return (message.createdAt as any) <= createdAt; // If there's an error, exclude the message
    }
  });
  console.log('Filtered messages for branching:', filteredMessages);

  // props.setMessages(filteredMessages);
  const res = await $fetch('/api/chat/branch', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + (await userStore.getJWT()),
    },
    body: {
      sourceChatId: props.chatId,
      branchFromTimestamp: createdAt,
      branchFromMessageId: id,
    },
  });
  console.log('Branching response:', res);
  // @ts-ignore
  messageStore.messages = filteredMessages;
  messageStore.isBranched = true;
  navigateTo(`/chat/${res.data.chatId}`);
};

const handleEdit = async (createdAt: any, content?: string) => {
  console.log('Editing message with createdAt:', createdAt, 'and content:', content);
  // from the list of messages passed as props, remove all messages that are older than the createdAt timestamp
  const filteredMessages = props.messages.filter(message => {
    try {
      return new Date(message.createdAt as any) <= new Date(createdAt);
    } catch (error) {
      console.error('Error comparing dates:', error);
      return (message.createdAt as any) >= createdAt; // If there's an error, exclude the message
    }
  });
  console.log('Filtered messages for editing:', filteredMessages);
  if (filteredMessages[filteredMessages.length - 1].role == 'assistant') {
    filteredMessages.pop(); // Remove the last assistant message if it exists
  } else if (!content) {
    console.error('Content is required for editing the last user message.');
    return;
  }
  if (content) {
    filteredMessages[filteredMessages.length - 1].content = content;
    filteredMessages[filteredMessages.length - 1].parts = [
      {
        type: 'text' as const,
        text: content,
      },
    ];
  }
  props.setMessages?.(filteredMessages);
  console.log('Filtered messages for branching:', filteredMessages);
  props.reload?.({
    body: {
      isEdited: true,
      editedFrom: filteredMessages[filteredMessages.length - 1].createdAt,
      editedFromId: filteredMessages[filteredMessages.length - 1].id,
      intent: intentStore.selectedIntent,
      model: modelStore.selectedModel,
    },
    headers: {
      Authorization: 'Bearer ' + (await userStore.getJWT()),
      ...getApiHeaders(modelStore.selectedModel),
    },
  });
};

const handleCopy = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log('Text copied to clipboard:', text);
    })
    .catch(err => {
      console.error('Failed to copy text:', err);
    });
};

watch(
  [arrivedState, isScrolling, isHovered],
  ([newState, isScrolling, isHovered]) => {
    // make the button visible while scrolling and if not already at bottom (using newState.bottom) and make it visible for a sec if idle
    if (isHovered) {
      if (scrollToBottomTimeout.value) {
        clearTimeout(scrollToBottomTimeout.value);
      }
      isScrollToBottomVisible.value = true;
      return;
    }
    if ((isScrolling && !newState.bottom) || !isHovered) {
      isScrollToBottomVisible.value = true;
      if (scrollToBottomTimeout.value) {
        clearTimeout(scrollToBottomTimeout.value);
      }
      scrollToBottomTimeout.value = setTimeout(() => {
        isScrollToBottomVisible.value = false;
      }, 2000);
    }
    if (newState.bottom) isScrollToBottomVisible.value = false;
  },
  { immediate: true }
);

console.log('Messages:', props.messages);
</script>

<template>
  <div
    class="flex h-full w-full flex-col items-center overflow-y-scroll"
    id="messages-container"
    ref="messages-container"
  >
    <div class="w-full space-y-4 lg:max-w-2xl">
      <!-- <div id="padding-top" class="pb-[15vh] lg:pb-[20vh]"></div> -->
      <div
        v-for="message in props.messages"
        :key="message.id"
        class="group flex w-full p-2"
        :class="{ 'justify-end': message.role === 'user' }"
      >
        <div
          v-memo="[message]"
          :id="`message-${message.id}`"
          :class="`${message.role === 'user' ? 'flex max-w-[70vw] flex-col items-end lg:max-w-[40vw]' : 'w-full'}`"
          class="group"
        >
          <textarea
            ref="textarea"
            class="max-h-[240px] w-full resize-none rounded-lg border p-4 outline-none"
            v-if="isBeingEdited && timeStampOfMessageBeingEdited == String(message.createdAt)"
            v-model="contentBeingEdited"
            name="input"
            id="chat-input"
            placeholder="Type your message here..."
            rows="2"
          ></textarea>
          <div v-else-if="message.role != 'user'">
            <div
              v-for="(part, index) in message.parts"
              class="mb-2"
              v-memo="[part, message.id, index]"
            >
              <div
                v-if="part.type == 'reasoning'"
                v-memo="[message.id, part.reasoning]"
                class="flex flex-col"
              >
                <ChatMessageReasoning :id="message.id" :message="part.reasoning" />
              </div>
              <div v-else-if="part.type == 'text'" v-memo="[message.id, part.text]">
                <ChatMessageMarkdown
                  v-if="part.text"
                  :content="part.text"
                  :id="message.id"
                  class="markdown-content"
                />
              </div>
              <div v-else-if="part.type == 'file'">
                <img
                  class="max-h-[240px] max-w-[240px] lg:max-h-[480px] lg:max-w-[480px]"
                  :src="'data:' + part.mimeType + ';base64,' + part.data"
                  :alt="'Image'"
                />
              </div>
            </div>
          </div>
          <div v-else-if="message.role == 'user'">
            <div v-if="message.experimental_attachments?.length">
              <div v-for="file in message.experimental_attachments">
                <File v-if="!file.contentType?.includes('image')" />
                <img
                  v-else
                  :src="file.url"
                  :alt="file.name"
                  class="max-h-40 max-w-full rounded-lg object-cover"
                />
                <br />
                {{ file.name }}
              </div>
            </div>
            <div
              class="border-border bg-secondary/50 text-foreground ml-auto max-w-md rounded-lg border px-4 py-2"
            >
              {{ message.content }}
            </div>
          </div>
          <div class="text-xs transition-all lg:opacity-0 lg:group-hover:opacity-100">
            <ChatMessageOptions
              :class="{ invisible: status == 'streaming' || isPublic }"
              :role="message.role"
              :message-id="message.id"
              :is-editing="isBeingEdited"
              :handle-copy="() => handleCopy(message.content)"
              :handle-branch="() => handleBranch(message.id, message.createdAt)"
              :handle-edit="
                () => {
                  isBeingEdited = true;
                  contentBeingEdited = message.content;
                  timeStampOfMessageBeingEdited = String(message.createdAt);
                }
              "
              :handle-retry="
                () => {
                  handleEdit(message.createdAt, message.role == 'user' ? message.content : '');
                }
              "
              :handle-save="
                () => {
                  handleEdit(message.createdAt, contentBeingEdited);
                  isBeingEdited = false;
                  timeStampOfMessageBeingEdited = null;
                }
              "
              :handle-discard="
                () => {
                  isBeingEdited = false;
                  timeStampOfMessageBeingEdited = null;
                }
              "
            />
          </div>
        </div>
      </div>
      <ChatLoader v-if="haventGottenFirstChunk" />
      <div class="h-6 w-6" v-if="intentStore.selectedIntent == 'image' && status == 'streaming'">
        <LoaderCircle class="animate-spin" />
      </div>
      <div id="padding-bottom" class="pb-[200px]"></div>
      <Button
        ref="scroll-to-bottom-button"
        v-if="isScrollToBottomVisible"
        class="absolute left-1/2 z-10 -translate-x-1/2 cursor-pointer text-sm opacity-100 hover:opacity-100 lg:opacity-50"
        :class="{ 'bottom-[125px]': !isPublic, 'bottom-[50px]': isPublic }"
        variant="secondary"
        @click="scrollToBottom"
      >
        <ChevronsDown class="h-4 w-4" />
        Scroll to Bottom
      </Button>
    </div>
  </div>
</template>
