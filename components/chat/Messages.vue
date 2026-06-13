<script setup lang="tsx">
import type { ChatRequestOptions, UIMessage } from 'ai';

// Extended message type with additional properties used in this app
interface ExtendedUIMessage extends UIMessage {
  createdAt?: string | Date;
  content?: string;
}

// Extended file part type
interface FilePart {
  type: 'file';
  url: string;
  filename?: string;
  mediaType?: string;
}

import { useElementHover, useMediaQuery, useTextareaAutosize } from '@vueuse/core';
import { ChevronsDown, FileText, LoaderCircle } from 'lucide-vue-next';
import { useScroll } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import { useVueToPrint } from 'vue-to-print';
import Button from '../ui/button/Button.vue';

const props = defineProps<{
  chatId?: string;
  messages: ExtendedUIMessage[];
  haventGottenFirstChunk?: boolean;
  setMessages: (messages: ExtendedUIMessage[]) => void;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<void>;
  status: string;
  isPublic?: boolean;
  scrollToBottom: () => void;
}>();

// Helper to get text content from message
const getMessageContent = (message: ExtendedUIMessage): string => {
  if (message.content) return message.content;
  const textPart = message.parts?.find((p: any) => p.type === 'text') as
    | { text?: string }
    | undefined;
  return textPart?.text || '';
};

// Helper to get file parts from message
const getFileParts = (message: ExtendedUIMessage): FilePart[] => {
  return (message.parts?.filter((p: any) => p.type === 'file') || []) as FilePart[];
};

// Helper to detect AI SDK v6 tool parts (type starts with "tool-")
const isToolPart = (part: any): boolean =>
  typeof part?.type === 'string' && part.type.startsWith('tool-');

// All tool-call parts for a message, in order, for the grouped collapsible.
const getToolParts = (message: ExtendedUIMessage): any[] =>
  ((message.parts as any[]) || []).filter(isToolPart);

// Collect search/news result sources from a message's tool parts, flattened in
// call order, for inline [n] citation linking. Only web_search / news_search
// contribute to citation numbering (fetch_url is excluded to keep indices aligned).
const CITATION_TOOL_TYPES = ['tool-web_search', 'tool-news_search'];
const getCitationSources = (message: ExtendedUIMessage) => {
  const sources: { title: string; url: string; domain: string; favicon: string }[] = [];
  for (const part of (message.parts as any[]) || []) {
    if (!CITATION_TOOL_TYPES.includes(part?.type)) continue;
    const results = part?.output?.data?.results;
    if (Array.isArray(results)) {
      for (const r of results) {
        sources.push({ title: r.title, url: r.url, domain: r.domain, favicon: r.favicon });
      }
    }
  }
  return sources;
};

const messageStore = useMessageStore();
const userStore = useUserStore();
const modelStore = useModelStore();
const intentStore = useIntentStore();
const loadingStore = useLoadingStore();

const { textarea, input: contentBeingEdited } = useTextareaAutosize();
const el = useTemplateRef<HTMLElement>('messages-container');
const { isScrolling, arrivedState } = useScroll(el);
const myHoverableElement = useTemplateRef<HTMLButtonElement>('scroll-to-bottom-button');
const isHovered = useElementHover(myHoverableElement);
const isMobile = useMediaQuery('(max-width: 640px)');

const isBeingEdited = ref(false);
const timeStampOfMessageBeingEdited = ref<string | null>(null);
const isScrollToBottomVisible = ref(false);
const scrollToBottomTimeout = ref<NodeJS.Timeout | null>(null);

// Initialize an object to store refs for each message
const messageRefs = ref<{ [key: string]: any }>({});
// Function to handle printing for a specific message
const handleMessagePrint = (messageId: string) => {
  const { handlePrint } = useVueToPrint({
    content: messageRefs.value[messageId],
    documentTitle: `Chat Message - ${document.title}`,
    copyStyles: true,
  });
  handlePrint();
};

const handleBranch = async (id: string, createdAt: any) => {
  loadingStore.setLoading(true);
  loadingStore.setLoadingMessage('Branching chat...');
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
  loadingStore.setLoading(false);
  loadingStore.setLoadingMessage('');
  // @ts-ignore
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
  // Auth headers are handled by the DefaultChatTransport.prepareSendMessagesRequest
  // Only pass the edit metadata in the body
  props.reload?.({
    body: {
      isEdited: true,
      editedFrom: filteredMessages[filteredMessages.length - 1].createdAt,
      editedFromId: filteredMessages[filteredMessages.length - 1].id,
      intent: intentStore.selectedIntent,
      model: modelStore.selectedModel,
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
    if (isHovered && !isMobile.value) {
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
            <!-- All tool calls for this response grouped under one collapsible -->
            <ChatToolsToolCalls
              v-if="getToolParts(message).length"
              :parts="getToolParts(message) as any"
            />
            <template v-for="(part, index) in message.parts" :key="`${message.id}-${index}`">
              <div
                v-if="!isToolPart(part)"
                class="mb-2"
                v-memo="[part, message.id, index]"
                :ref="el => (messageRefs[message.id] = el)"
              >
                <div
                  v-if="part.type == 'reasoning'"
                  v-memo="[message.id, part.text]"
                  class="flex flex-col"
                >
                  <ChatMessageReasoning :id="message.id" :message="part.text" />
                </div>
                <div
                  v-else-if="part.type == 'text'"
                  v-memo="[message.id, part.text, getCitationSources(message).length]"
                >
                  <ChatMessageMarkdown
                    v-if="part.text"
                    :content="part.text"
                    :id="message.id"
                    :sources="getCitationSources(message)"
                    class="markdown-content"
                  />
                </div>
                <div v-else-if="part.type == 'file'">
                  <img
                    class="max-h-[240px] max-w-[240px] lg:max-h-[480px] lg:max-w-[480px]"
                    :src="part.url"
                    :alt="part.filename || 'Image'"
                  />
                </div>
              </div>
            </template>
          </div>
          <div v-else-if="message.role == 'user'" class="flex flex-col items-end">
            <div v-if="getFileParts(message).length">
              <div class="mr-2 mb-2" v-for="file in getFileParts(message)" :key="file.url">
                <a
                  class="cursor-pointer"
                  title="View Document"
                  target="_blank"
                  :href="file.url"
                  v-if="!file.mediaType?.includes('image')"
                  ><FileText class="h-8 w-8" :stroke-width="1.5"
                /></a>
                <img
                  v-else
                  :src="file.url"
                  :alt="file.filename"
                  class="max-h-40 max-w-full rounded-lg object-cover"
                />
                {{ file.filename }}
              </div>
            </div>
            <div
              class="border-border bg-secondary/50 text-foreground ml-auto max-w-md rounded-lg border px-4 py-2"
            >
              {{ getMessageContent(message) }}
            </div>
          </div>
          <div class="text-xs transition-all lg:opacity-0 lg:group-hover:opacity-100">
            <ChatMessageOptions
              v-if="!isPublic"
              :class="{ invisible: status == 'streaming' }"
              :role="message.role"
              :message-id="message.id"
              :is-editing="isBeingEdited"
              :handle-copy="() => handleCopy(getMessageContent(message))"
              :handle-branch="() => handleBranch(message.id, message.createdAt)"
              :handle-print="() => handleMessagePrint(message.id)"
              :handle-edit="
                () => {
                  isBeingEdited = true;
                  contentBeingEdited = getMessageContent(message);
                  timeStampOfMessageBeingEdited = String(message.createdAt);
                }
              "
              :handle-retry="
                () => {
                  handleEdit(
                    message.createdAt,
                    message.role == 'user' ? getMessageContent(message) : ''
                  );
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
