<script setup lang="tsx">
import { useMemoize } from '@vueuse/core';
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
      <ChatMarkdownBlock v-if="block.type !== 'code'" v-memo="[block]" :content="block.text" />

      <ChatCodeBlock v-else v-memo="[block]" :code="block.text" />
    </div>
  </div>
</template>
