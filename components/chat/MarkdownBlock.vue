<script setup lang="ts">
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import rehypeSanitize from 'rehype-sanitize';
import { unified } from 'unified';

const props = defineProps<{
  content: string;
}>();

const markdown = ref(props.content);

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeKatex)
  .use(rehypeStringify);

const paresedContent = (content: string) => processor.processSync(content).toString();

watch(
  () => props.content,
  newContent => {
    markdown.value = newContent;
  },
  { immediate: true }
);
</script>

<template>
  <div
    :class="[
      'prose dark:prose-invert sm:prose-sm md:prose-base prose-ol:my-2 prose-p:my-0 prose-pre:my-2 prose-ul:my-2 prose-li:mt-1 prose-li:mb-0 prose-pre:bg-transparent prose-pre:p-0 font-claude-message prose-headings:font-semibold prose-strong:font-medium prose-pre:text-foreground [&_pre>div]:border-0.5 [&_pre>div]:border-border [&_pre>div]:bg-background relative max-w-none leading-[1.65rem] [&_.ignore-pre-bg>div]:bg-transparent [&>div>div>:is(p,blockquote,h1,h2,h3,h4,h5,h6)]:pl-2 [&>div>div>:is(p,blockquote,ul,ol,h1,h2,h3,h4,h5,h6)]:pr-8',
      'prose-img:mx-auto prose-img:my-4 prose-pre:grid prose-code:before:hidden prose-code:after:hidden',
    ]"
  >
    <div v-html="paresedContent(markdown)" />
  </div>
</template>
