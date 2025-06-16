<script setup lang="tsx">
import { useMemoize } from '@vueuse/core';
import MarkdownPreview from '@uivjs/vue-markdown-preview';
import rehypeHighlight from 'rehype-highlight';
import { ID } from 'appwrite';
import { marked } from 'marked';
const props = defineProps<{
  content: string;
  id: string;
}>();
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}
const getBlocks = useMemoize((content: string) => parseMarkdownIntoBlocks(content));

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

const blocks = ref(getBlocks(props.content));

watch(
  () => props.content,
  newContent => {
    blocks.value = getBlocks(newContent);
    console.log('Content updated:', newContent, blocks.value);
  },
  { immediate: true }
);
</script>
<template>
  <div class="markdown-content" v-memo="[content, id]">
    <div v-for="(block, index) in blocks" :key="index" class="markdown-block">
      <MarkdownPreview
        v-memo="[block]"
        :components="components"
        class="no-tailwind"
        :rehype-plugins="[[rehypeHighlight]]"
      >
        {{ block }}
      </MarkdownPreview>
    </div>
  </div>
</template>
