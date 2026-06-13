<script setup lang="ts">
interface SourceItem {
  title: string;
  url: string;
  domain: string;
  favicon: string;
  publishedDate?: string;
}

defineProps<{
  results: SourceItem[];
}>();

const onFaviconError = (e: Event) => {
  (e.target as HTMLImageElement).style.visibility = 'hidden';
};
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <a
      v-for="(source, index) in results"
      :key="source.url + index"
      :href="source.url"
      target="_blank"
      rel="noopener noreferrer"
      :title="source.title"
      class="border-border bg-secondary/40 hover:bg-secondary/70 group flex w-[180px] flex-col gap-1.5 rounded-lg border p-2.5 text-xs transition-colors"
    >
      <div class="text-muted-foreground flex items-center gap-1.5">
        <span
          class="bg-primary/10 text-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
        >
          {{ index + 1 }}
        </span>
        <img
          :src="source.favicon"
          alt=""
          class="h-3.5 w-3.5 shrink-0 rounded-sm"
          @error="onFaviconError"
        />
        <span class="truncate">{{ source.domain }}</span>
      </div>
      <span class="text-foreground line-clamp-2 leading-snug font-medium">{{ source.title }} </span>
    </a>
  </div>
</template>
