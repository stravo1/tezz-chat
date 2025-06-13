<script setup lang="tsx">
import type { UIMessage } from 'ai';
import 'highlight.js/styles/monokai.css';
import MarkdownPreview from '@uivjs/vue-markdown-preview';
import rehypeHighlight from 'rehype-highlight';
import { ID } from 'appwrite';

const components = {
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
      <div class="my-10 w-full">
        <div class="text-on-secondary-container bg-secondary-container flex w-full items-center justify-between rounded-tl-lg rounded-tr-lg px-3 py-2 text-xs">
          <span class="font-mono">{language}</span>
          <span class="cursor-pointer" data-copy-button={id} onClick={clickCopied}>
            Copy
          </span>
        </div>
        <pre class="hljs">
          <code onClick={clickCopied} id={id} {...options}>
            {children}
          </code>
        </pre>
      </div>
    );
  },
};

const props = defineProps<{
  messages: UIMessage[];
}>();
</script>

<template>
  <div class="flex h-full w-full flex-col items-center overflow-y-scroll" id="messages-container">
    <div class="w-full max-w-3xl space-y-4">
      <div
        v-for="message in props.messages"
        :key="message.id"
        class="flex w-full p-2"
        :class="{ 'justify-end': message.role === 'user' }"
      >
        <div
          v-memo="[message]"
          :class="`${message.role === 'user' ? 'rounded-lg' : 'text-on-secondary-container w-full'}`"
        >
          <MarkdownPreview :components="components" :rehype-plugins="[[rehypeHighlight]]">
            {{ message.content }}
          </MarkdownPreview>
        </div>
      </div>
      <div id="padding" class="pb-[200px]"></div>
    </div>
  </div>
</template>
