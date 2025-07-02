<script setup lang="ts">
import { Check, Copy, WrapText } from 'lucide-vue-next';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { Marked } from 'marked';
import { ID } from 'appwrite';

const props = defineProps<{
  code: string;
}>();

const id = ID.unique();

const languageRef = ref('plaintext');
const isWrapped = ref(false);
const wrappedFeedBack = ref(false);
const copiedFeedback = ref(false);

const markedNew = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      if (language !== languageRef.value) {
        languageRef.value = language;
      }
      return hljs.highlight(code, { language }).value;
    },
  })
);

const toggleWrap = () => {
  isWrapped.value = !isWrapped.value;
  wrappedFeedBack.value = true;
  setTimeout(() => {
    wrappedFeedBack.value = false;
  }, 2000);
};

const copy = () => {
  const codeWrapper = document.querySelector(`#code-${id}`);
  if (codeWrapper) {
    const codeElement = codeWrapper.querySelector('.hljs');
    if (codeElement) {
      navigator.clipboard.writeText(codeElement.textContent || '');
      copiedFeedback.value = true;
      setTimeout(() => {
        copiedFeedback.value = false;
      }, 2000);
    }
  }
};
</script>
<template>
  <div class="my-10 w-full">
    <div
      class="codeblock-bar border-border bg-muted sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-lg rounded-tl-lg rounded-tr-lg border-b text-xs"
    >
      <div class="bg-background codeblock-bar-bg absolute inset-0 z-[-1] h-full w-full"></div>
      <div
        class="bg-muted z-10 flex h-full w-full items-center justify-between rounded-t-lg px-3 py-2"
      >
        <span class="font-mono" v-memo="[languageRef]">{{ languageRef }}</span>
        <div class="flex items-center gap-2">
          <button class="h-6 w-6 cursor-pointer" @click="toggleWrap">
            <WrapText v-if="!wrappedFeedBack" class="h-4 w-4" />
            <Check v-else class="h-4 w-4" />
          </button>
          <button class="h-6 w-6 cursor-pointer" @click="copy">
            <Copy v-if="!copiedFeedback" class="h-4 w-4" />
            <Check v-else class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <div :id="`code-${id}`" :class="{ wrap: isWrapped }" v-html="markedNew.parse(code)"></div>
  </div>
</template>
