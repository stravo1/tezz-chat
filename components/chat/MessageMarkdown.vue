<script setup lang="tsx">
import { marked } from 'marked';

interface CitationSource {
  title: string;
  url: string;
  domain: string;
  favicon: string;
}

const props = defineProps<{
  content: string;
  id: string;
  sources?: CitationSource[];
}>();

// Replace inline [n] / [n, m] citation markers with markdown links to the
// corresponding source URL so they render as clickable references.
function linkifyCitations(text: string, sources?: CitationSource[]): string {
  if (!sources || sources.length === 0) return text;
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (match, group: string) => {
    const nums = group.split(',').map(n => parseInt(n.trim(), 10));
    const links = nums
      .map(n => {
        const src = sources[n - 1];
        if (!src) return null;
        return `[${n}](${src.url})`;
      })
      .filter(Boolean);
    return links.length ? links.join('') : match;
  });
}

function parseMarkdownIntoBlocks(markdown: string): Array<{ type: string; text: string }> {
  const tokens = marked.lexer(markdown);
  // Only linkify citations in non-code blocks so markers inside code stay literal.
  return tokens.map(token => ({
    type: token.type,
    text: token.type === 'code' ? token.raw : linkifyCitations(token.raw, props.sources),
  }));
}
const getBlocks = (content: string) => parseMarkdownIntoBlocks(content);

const blocks = ref(getBlocks(props.content));

watch(
  () => [props.content, props.sources] as const,
  ([newContent]) => {
    blocks.value = getBlocks(newContent as string);
  },
  { immediate: true }
);
</script>
<template>
  <div class="markdown-content" v-memo="[content, id, blocks]">
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
