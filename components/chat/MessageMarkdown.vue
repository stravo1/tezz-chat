<script setup lang="tsx">
import { useMemoize } from '@vueuse/core';
import MarkdownPreview from '@uivjs/vue-markdown-preview';
import rehypeHighlight from 'rehype-highlight';
import { ID } from 'appwrite';
import { marked } from 'marked';
import { Copy, WrapText } from 'lucide-vue-next';
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
    };
    const toggleWrap = () => {
      const codeElement = document.getElementById(`pre-${id}`);
      if (codeElement) {
        codeElement.classList.toggle('wrap');
      }
    };

    const language = options.class?.replace('language-', '') || 'plaintext';
    return (
      <div class="my-10 w-full">
        <div class="border-border bg-muted sticky top-0 flex items-center justify-between gap-2 rounded-t-md rounded-tl-lg rounded-tr-lg border-b px-3 py-2 text-xs">
          <span class="font-mono">{language}</span>
          <div class="flex items-center gap-2">
            <button class="h-6 w-6 cursor-pointer" data-copy-button={id} onClick={toggleWrap}>
              <WrapText class="h-4 w-4" />
            </button>
            <button class="h-6 w-6 cursor-pointer" data-copy-button={id} onClick={clickCopied}>
              <Copy class="h-4 w-4" />
            </button>
          </div>
        </div>
        <pre id={`pre-${id}`} class="hljs not-prose">
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
    // console.log('Content updated:', newContent, blocks.value);
  },
  { immediate: true }
);
</script>
<template>
  <div class="markdown-content" v-memo="[content, id]">
    <div
      v-for="(block, index) in blocks"
      v-memo="[block, id]"
      :key="`key-${index}-${id}`"
      class="markdown-block p-1"
    >
      <MarkdownPreview
        v-memo="[block]"
        :components="components"
        :class="[
          'prose dark:prose-invert sm:prose-sm md:prose-base prose-ol:my-2 prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 prose-pre:bg-transparent prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background relative max-w-none leading-[1.65rem] [&_.ignore-pre-bg>div]:bg-transparent [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8',
          'prose-img:mx-auto prose-img:my-4 prose-pre:grid prose-code:before:hidden prose-code:after:hidden',
        ]"
        :rehype-plugins="[[rehypeHighlight]]"
      >
        {{ block }}
      </MarkdownPreview>
    </div>
  </div>
</template>
