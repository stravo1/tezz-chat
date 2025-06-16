<script setup lang="tsx">
import type { ChatRequestOptions, UIMessage } from 'ai';
import MarkdownPreview from '@uivjs/vue-markdown-preview';
import rehypeHighlight from 'rehype-highlight';
import { ID } from 'appwrite';
import { useTextareaAutosize } from '@vueuse/core';
import { File } from 'lucide-vue-next';

const props = defineProps<{
  chatId?: string;
  messages: UIMessage[];
  haventGottenFirstChunk?: boolean;
  setMessages: (messages: UIMessage[]) => void;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
}>();

const messageStore = useMessageStore();
const userStore = useUserStore();
const modelStore = useModelStore();

const { textarea, input: contentBeingEdited } = useTextareaAutosize();
const isBeingEdited = ref(false);
const timeStampOfMessageBeingEdited = ref<string | null>(null);

const handleBranch = async (createdAt: any) => {
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
      intent: 'text',
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

const components = {
  // @ts-ignore
  pre: ({ children, ...options }) => {
    function getLastChildElement(parentId: string): HTMLElement | null {
      const parentElement = document.getElementById(parentId);
      if (!parentElement) return null;

      const children = (parentElement as HTMLElement).children;
      return children[children.length - 1] as HTMLElement | null;
    }

    const id = ID.unique();
    const clickCopied = () => {
      const elem = getLastChildElement(id);
      if (!elem) return;
      console.log(elem);
      elem?.click();
      let copyButtonSpan = document.querySelector(`[data-copy-button="${id}"]`);
      if (copyButtonSpan) {
        copyButtonSpan.textContent = 'Copied!';
        setTimeout(() => {
          copyButtonSpan.textContent = 'Copy';
        }, 2000);
      }
    };

    const language = options.class?.replace('language-', '') || 'plaintext';
    return (
      <div class="keep-tailwind my-10 w-full">
        <div class="text-on-secondary-container bg-secondary-container flex w-full items-center justify-between rounded-tl-lg rounded-tr-lg px-3 py-2 text-xs">
          <span class="font-mono">{language}</span>
          <span class="cursor-pointer" data-copy-button={id} onClick={clickCopied}>
            Copy
          </span>
        </div>
        <pre class="hljs">
          <code id={id} {...options}>
            {children}
          </code>
        </pre>
      </div>
    );
  },
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
          :class="`${message.role === 'user' ? 'flex max-w-[33vw] flex-col items-end' : 'text-on-secondary-container w-full'}`"
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
          <MarkdownPreview
            v-else-if="message.role !== 'user'"
            :components="components"
            class="no-tailwind"
            :rehype-plugins="[[rehypeHighlight]]"
          >
            {{ message.content }}
          </MarkdownPreview>
          <div v-else>
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
            {{ message.content }}
          </div>
          <div
            class="text-on-secondary-container text-xs opacity-0 transition-all group-hover:opacity-100"
          >
            <ChatMessageOptions
              :role="message.role"
              :message-id="message.id"
              :is-editing="isBeingEdited"
              :handle-copy="() => handleCopy(message.content)"
              :handle-branch="() => handleBranch((message as any).$createdAt)"
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
      <div id="padding" class="pb-[200px]"></div>
    </div>
  </div>
</template>
