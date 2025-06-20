<script setup lang="tsx">
import type { ChatRequestOptions, UIMessage } from 'ai';

import { useTextareaAutosize } from '@vueuse/core';
import { File, LoaderCircle } from 'lucide-vue-next';

const props = defineProps<{
  chatId?: string;
  messages: UIMessage[];
  haventGottenFirstChunk?: boolean;
  setMessages: (messages: UIMessage[]) => void;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  status: string;
  isPublic?: boolean;
}>();

const messageStore = useMessageStore();
const userStore = useUserStore();
const modelStore = useModelStore();
const intentStore = useIntentStore();

const { textarea, input: contentBeingEdited } = useTextareaAutosize();
const isBeingEdited = ref(false);
const timeStampOfMessageBeingEdited = ref<string | null>(null);

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

console.log('Messages:', props.messages);
</script>

<template>
  <div class="flex h-full w-full flex-col items-center overflow-y-scroll" id="messages-container">
    <div class="w-full max-w-3xl space-y-4">
      <div
        v-for="message in props.messages"
        :key="message.id"
        class="group flex w-full p-2"
        :class="{ 'justify-end': message.role === 'user' }"
      >
        <div
          v-memo="[message]"
          :class="`${message.role === 'user' ? 'flex max-w-[50vw] flex-col items-end lg:max-w-[33vw]' : 'text-on-secondary-container w-full'}`"
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
            <div class="bg-secondary-container text-on-secondary-container rounded-lg p-2 px-4">
              {{ message.content }}
            </div>
          </div>
          <div
            class="text-on-secondary-container text-xs transition-all lg:opacity-0 lg:group-hover:opacity-100"
          >
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
      <div id="padding" class="pb-[200px]"></div>
    </div>
  </div>
</template>
