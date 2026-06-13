<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronUp, ChevronDown, Wrench, LoaderCircle } from 'lucide-vue-next';
import ToolInvocation from './ToolInvocation.vue';

interface ToolPart {
  type: string;
  toolCallId?: string;
  state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: any;
  output?: any;
  errorText?: string;
}

const props = defineProps<{
  parts: ToolPart[];
}>();

// Any tool still running?
const isRunning = computed(() =>
  props.parts.some(p => p.state === 'input-streaming' || p.state === 'input-available')
);

// Total sources gathered across all search/news tool calls
const totalSources = computed(() =>
  props.parts.reduce((sum, p) => {
    const results = p.output?.data?.results;
    return sum + (Array.isArray(results) ? results.length : 0);
  }, 0)
);

const headerLabel = computed(() => {
  const n = props.parts.length;
  if (isRunning.value) return `Using tools (${n})…`;
  const toolWord = n === 1 ? 'tool' : 'tools';
  return totalSources.value
    ? `Used ${n} ${toolWord} · ${totalSources.value} sources`
    : `Used ${n} ${toolWord}`;
});

// Expanded while running; collapses once all tools are done.
const manualOverride = ref<boolean | null>(null);
const isExpanded = computed(() => {
  if (manualOverride.value !== null) return manualOverride.value;
  return isRunning.value;
});
const toggleExpand = () => {
  manualOverride.value = !isExpanded.value;
};
</script>

<template>
  <div
    v-if="parts.length"
    class="my-2 flex w-full flex-col gap-2 lg:max-w-3xl"
    v-memo="[parts, isExpanded]"
  >
    <button
      @click="toggleExpand"
      class="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors"
    >
      <LoaderCircle v-if="isRunning" class="h-4 w-4 shrink-0 animate-spin" />
      <Wrench v-else class="h-4 w-4 shrink-0" />
      <span class="truncate">{{ headerLabel }}</span>
      <ChevronUp v-if="isExpanded" class="h-4 w-4 shrink-0" />
      <ChevronDown v-else class="h-4 w-4 shrink-0" />
    </button>

    <div v-if="isExpanded" class="border-border/60 ml-2 flex flex-col gap-4 border-l pl-4">
      <ToolInvocation v-for="(part, index) in parts" :key="part.toolCallId || index" :part="part" />
    </div>
  </div>
</template>
