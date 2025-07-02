<script setup lang="tsx">
import { useMemoize } from '@vueuse/core';
import MarkdownPreview from '@uivjs/vue-markdown-preview';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
  id: string;
}>();

function parseMarkdownIntoBlocks(markdown: string): Array<{ type: string; text: string }> {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => ({ type: token.type, text: token.raw }));
}
const getBlocks = useMemoize((content: string) => parseMarkdownIntoBlocks(content));

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
        v-if="block.type !== 'code'"
        v-memo="[block]"
        :class="[
          'prose dark:prose-invert sm:prose-sm md:prose-base prose-ol:my-2 prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 prose-pre:bg-transparent prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background relative max-w-none leading-[1.65rem] [&_.ignore-pre-bg>div]:bg-transparent [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8',
          'prose-img:mx-auto prose-img:my-4 prose-pre:grid prose-code:before:hidden prose-code:after:hidden',
        ]"
      >
        {{ block.text }}
      </MarkdownPreview>
      <ChatCodeBlock v-else v-memo="[block]" :code="block.text" />
    </div>
  </div>
</template>
