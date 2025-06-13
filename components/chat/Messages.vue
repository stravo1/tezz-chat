<script setup lang="ts">
import type { UIMessage } from "ai";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

const props = defineProps<{
  messages: UIMessage[];
}>();
</script>

<template>
  <div
    class="flex h-full w-full flex-col overflow-y-scroll items-center"
    id="messages-container"
  >
    <div class="max-w-3xl w-full space-y-4">
      <div v-for="message in props.messages" :key="message.id" class="p-2 flex w-full" :class="{'justify-end': message.role === 'user'}">
        <div
          v-memo="[message]"
          :class="`${message.role === 'user' ? 'rounded-lg' : 'text-on-secondary-container'}`"
        >
          <div
            v-memo="[message.content]"
            class="no-tailwind-styles space-y-4"
            v-html="marked.parse(message.content)"
          ></div>
        </div>
      </div>
      <div id="padding" class="pb-[200px]"></div>
    </div>
  </div>
</template>
