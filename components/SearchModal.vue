<template>
  <div
    @click="closeModal"
    class="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center bg-[rgba(0,0,0,0.25)] backdrop-blur-lg"
  >
    <div class="h-[60vh] w-[80vw] lg:h-[40vh] lg:w-[55vw]">
      <div
        @click.stop
        :class="{ 'rounded-b-lg': matchedThreads.length === 0 }"
        class="bg-background text-foreground flex w-full items-center justify-center gap-2 rounded-t-lg p-4 px-6 dark:text-white/50"
      >
        <Search class="text-foreground/50" />
        <input
          ref="searchInput"
          @keydown="handleKeyPress"
          type="text"
          placeholder="Search..."
          class="w-full border-black/50 p-1 outline-none focus:outline-none dark:border-white/50"
          @input="listAllMatches(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="h-[45vh] overflow-y-auto rounded-b-lg lg:h-[33vh]">
        <div class="group flex list-none flex-col p-0">
          <NuxtLink
            v-for="thread in matchedThreads"
            :key="thread.id"
            :to="`/chat/${thread.id}`"
            class="group bg-background text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer overflow-hidden p-4 text-ellipsis whitespace-nowrap"
          >
            <div class="flex flex-col gap-1">
              <span class="font-semibold">{{ thread.title }}</span>
              <span
                v-if="thread.sectionOfContentWhichMatches"
                class="text-sm opacity-50"
                v-html="`...${thread.sectionOfContentWhichMatches}...`"
              >
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { getThreadByNameMatching } from '../utils/database/queries';

interface Thread {
  id: string;
  title: string;
  sectionOfContentWhichMatches?: string;
}

const searchInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  searchInput.value?.focus();
});

const props = defineProps<{
  closeModal: () => void;
}>();
const matchedThreads = ref<Thread[]>([]);
const listAllMatches = async (query: string) => {
  try {
    let threads = await getThreadByNameMatching(query ? query.trim() : '');
    matchedThreads.value = threads;
  } catch (error) {
    console.error('Error fetching threads:', error);
    matchedThreads.value = [];
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  //   console.log('Key pressed:', event.key);
  if (event.key === 'Escape') {
    console.log('Escape key pressed, closing modal');
    props.closeModal();
  }
};
</script>
