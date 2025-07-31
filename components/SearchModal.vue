<template>
  <div
    @click="closeModal"
    class="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center bg-[rgba(0,0,0,0.25)] backdrop-blur-lg"
  >
    <div class="h-[60vh] w-[80vw] lg:h-[40vh] lg:w-[55vw]">
      <div
        @click.stop
        :class="{ 'rounded-b-lg': !isLoading && matchedThreads.length === 0 }"
        class="bg-background text-foreground flex w-full items-center justify-center gap-2 rounded-t-lg p-4 px-6 dark:text-white/50"
      >
        <Search class="text-foreground/50" />
        <input
          ref="searchInput"
          @keydown="handleKeyPress"
          type="text"
          placeholder="Search..."
          class="w-full border-black/50 p-1 outline-none focus:outline-none dark:border-white/50"
          @input="handleSearchInput"
          v-model="searchQuery"
        />
      </div>
      <div class="h-[45vh] overflow-y-auto rounded-b-lg lg:h-[33vh]">
        <div v-if="isLoading" class="flex items-center justify-center p-8">
          <span class="text-foreground/50">Searching...</span>
        </div>
        <div v-else-if="error" class="flex items-center justify-center p-8">
          <span class="text-red-500">Error: {{ error.message }}</span>
        </div>
        <div
          v-else-if="!isLoading && matchedThreads.length != 0"
          class="group flex list-none flex-col p-0"
        >
          <NuxtLink
            v-for="thread in matchedThreads"
            :key="thread.id"
            :to="`/chat/${thread.id}`"
            class="group bg-background text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer overflow-hidden p-4 text-ellipsis whitespace-nowrap"
          >
            <div class="flex flex-col gap-1">
              <span class="font-semibold">{{ thread.title }}</span>
              <span v-if="thread.content" class="text-sm opacity-50" v-html="`${thread.content}`">
              </span>
            </div>
          </NuxtLink>
        </div>
        <div
          v-else-if="!isLoading && debouncedSearchTerm"
          class="group flex list-none items-center justify-center p-8"
        >
          <span class="text-foreground/50">No results found</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { useQuery } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import { getThreadByNameMatching } from '~/utils/database/queries';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  chatId: string;
  updatedAt: string;
  visibility: string;
}

const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const debouncedSearchTerm = ref('');
const userStore = useUserStore();

onMounted(() => {
  searchInput.value?.focus();
});

const props = defineProps<{
  closeModal: () => void;
}>();

// Debounced search function
const debouncedSearch = useDebounceFn((query: string) => {
  debouncedSearchTerm.value = query.trim();
}, 500); // Increased from 300ms to 500ms (half a second)

const handleSearchInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  searchQuery.value = value;
  debouncedSearch(value);
};

// TanStack Query for search
const {
  data: searchResults,
  isLoading,
  error,
} = useQuery({
  queryKey: ['search', debouncedSearchTerm],
  queryFn: async () => {
    if (!debouncedSearchTerm.value) {
      return { results: [] };
    }

    const response = await $fetch('/api/chat/search', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
      },
      body: {
        searchTerm: debouncedSearchTerm.value,
      },
    });

    if (!response.success) {
      throw new Error((response as any).error?.message || 'Search failed');
    }

    if (!response || !('data' in response)) {
      throw new Error('Invalid response format');
    }
    const results = response.data.results;
    let resultAggregate = results.map(message => {
      let content = message.content; // Get the first message content that matches the search term

      let splitContent = content.split(' ');
      let matchingTermIndex = splitContent.findIndex(word =>
        word.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase())
      );
      let sectionOfContentWhichMatches = '';
      if (matchingTermIndex !== -1) {
        // Get a section of content around the matching term
        const start = Math.max(0, matchingTermIndex - 5); // Get 5 words before the matching term
        const end = Math.min(splitContent.length, matchingTermIndex + 5); // Get 5 words after the matching term
        sectionOfContentWhichMatches = splitContent
          .slice(start, end)
          .join(' ')
          .replace(new RegExp(`(${debouncedSearchTerm.value})`, 'gi'), '<mark>$1</mark>'); // Highlight the matching term
      }

      return {
        id: message.chatId,
        title: message.title,
        content: `...${sectionOfContentWhichMatches}...`, // Get the section of content that matches the search term
      };
    });
    let threads = await getThreadByNameMatching(debouncedSearchTerm.value);
    return { results: [...threads, ...resultAggregate] };
  },
  enabled: computed(() => debouncedSearchTerm.value.length > 0),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

const matchedThreads = computed(() => {
  return searchResults.value?.results || [];
});

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    console.log('Escape key pressed, closing modal');
    props.closeModal();
  }
};
</script>
