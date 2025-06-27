<script setup lang="ts">
import { ref } from 'vue';
import { ChevronUp, ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
  message: string;
  id: string;
}>();

const isExpanded = ref(true);
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
// console.log('MessageReasoning component initialized with message:', props.message);
</script>

<template>
  <div class="flex w-full flex-col gap-2 pb-2 lg:max-w-3xl" v-memo="[message, id, isExpanded]">
    <button
      @click="toggleExpand"
      class="text-muted-foreground flex cursor-pointer items-center gap-2"
    >
      <span>
        <ChevronUp v-if="isExpanded" class="h-4 w-4" />
        <ChevronDown v-else class="h-4 w-4" />
      </span>
      <span>Reasoning</span>
    </button>

    <div v-if="isExpanded" class="bg-secondary/10 rounded-md border p-4 opacity-75">
      <ChatMessageMarkdown :content="message" :id="id" />
    </div>
  </div>
</template>
