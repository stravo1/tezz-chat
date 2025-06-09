<script setup lang="ts">
import type { UIMessage } from "ai";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
const marked = new Marked(
  markedHighlight({
	emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

const props = defineProps<{
  messages: UIMessage[];
}>();
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden" id="messages-container">
    <div v-for="message in props.messages" :key="message.id" class="p-2">
      <div v-memo="[message]" :class="`${message.role === 'user' ? 'text-gray-600' : 'text-gray-900'}`">
        <strong>{{ message.role }}:</strong>
        <br/>
        <div v-memo="[message.content]" class="no-tailwind-styles" v-html="marked.parse(message.content)"></div>
      </div>
    </div>
  </div>
</template>
