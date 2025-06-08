<script setup lang="ts">
import {marked} from "marked";
import type { UIMessage } from "ai";

const props = defineProps<{
  messages: UIMessage[];
}>();
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
    <div v-for="message in props.messages" :key="message.id" class="p-2">
      <div v-memo="[message]" :class="`${message.role === 'user' ? 'text-gray-600' : 'text-gray-900'}`">
        <strong>{{ message.role }}:</strong>
        <br/>
        <div v-memo="[message.content]" class="no-tailwind-styles" v-html="marked.parse(message.content)"></div>
      </div>
    </div>
  </div>
</template>
