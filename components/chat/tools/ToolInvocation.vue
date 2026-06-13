<script setup lang="ts">
import { computed } from 'vue';
import { Globe, Newspaper, FileSearch, LoaderCircle, TriangleAlert } from 'lucide-vue-next';
import SourceCards from './SourceCards.vue';

// AI SDK v6 streams tool parts as `tool-<toolName>` with a `state` field.
// The part comes from a broad SDK discriminated union, so we accept it loosely
// and narrow via the `state` field below.
interface ToolPart {
  type: string;
  toolCallId?: string;
  state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: any;
  output?: any;
  errorText?: string;
}

const props = defineProps<{
  part: ToolPart;
}>();

const toolName = computed(() => props.part.type.replace(/^tool-/, ''));

const meta = computed(() => {
  switch (toolName.value) {
    case 'web_search':
      return { icon: Globe, verb: 'Searching the web', noun: 'Web search' };
    case 'news_search':
      return { icon: Newspaper, verb: 'Searching news', noun: 'News search' };
    case 'fetch_url':
      return { icon: FileSearch, verb: 'Reading pages', noun: 'Read pages' };
    default:
      return { icon: Globe, verb: 'Working', noun: 'Tool call' };
  }
});

const query = computed(() => props.part.input?.query ?? '');
const urls = computed<string[]>(() => props.part.input?.urls ?? []);

const isRunning = computed(
  () => props.part.state === 'input-streaming' || props.part.state === 'input-available'
);

const isError = computed(
  () =>
    props.part.state === 'output-error' ||
    (props.part.state === 'output-available' && !props.part.output?.success)
);

const succeeded = computed(
  () => props.part.state === 'output-available' && props.part.output?.success
);

const results = computed(() => props.part.output?.data?.results ?? []);

const errorMessage = computed(
  () => props.part.errorText || props.part.output?.error || 'Something went wrong.'
);

// One-line label summarising this single tool call
const itemLabel = computed(() => {
  if (isRunning.value) {
    if (query.value) return `${meta.value.verb} for “${query.value}”…`;
    if (urls.value.length)
      return `${meta.value.verb} (${urls.value.length} page${urls.value.length > 1 ? 's' : ''})…`;
    return `${meta.value.verb}…`;
  }
  if (isError.value) return `${meta.value.noun} failed`;
  const count = results.value.length;
  if (query.value)
    return `${meta.value.noun}: “${query.value}”${count ? ` · ${count} sources` : ''}`;
  if (urls.value.length) return `${meta.value.noun} · ${urls.value.length} pages`;
  return `${meta.value.noun}${count ? ` · ${count} sources` : ''}`;
});
</script>

<template>
  <div class="flex flex-col gap-2" v-memo="[part.state, query, results.length]">
    <!-- Status row for this tool call -->
    <div class="text-muted-foreground flex items-center gap-2 text-sm">
      <LoaderCircle v-if="isRunning" class="h-4 w-4 shrink-0 animate-spin" />
      <TriangleAlert v-else-if="isError" class="text-destructive h-4 w-4 shrink-0" />
      <component :is="meta.icon" v-else class="h-4 w-4 shrink-0" />
      <span class="truncate">{{ itemLabel }}</span>
    </div>

    <!-- Error detail -->
    <div
      v-if="isError"
      class="text-destructive bg-destructive/10 border-destructive/30 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
    >
      <TriangleAlert class="h-4 w-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Source cards -->
    <SourceCards v-else-if="succeeded && results.length" :results="results" />
  </div>
</template>
