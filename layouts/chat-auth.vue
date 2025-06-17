<template>
  <div
    v-if="layoutLoading"
    class="bg-inverse-surface text-inverse-on-surface fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center backdrop-blur-2xl"
  >
    <LoaderCircle class="animate-spin" />
  </div>
  <div
    v-if="!layoutLoading"
    class="bg-surface-container text-on-surface relative flex min-h-screen flex-col"
  >
    <LoaderModal v-if="isLoading" />
    <main class="flex h-screen w-screen">
      <div class="absolute top-5 right-4 z-50 flex" v-if="!isSidebarOpen">
        <div
          class="group flex rounded-lg px-2"
          :class="{ 'hover:bg-surface-container-low': visibilityRef == 'public' }"
        >
          <button
            v-if="visibilityRef != 'na'"
            @click="copy"
            class="text-tertiary/50 hover:text-tertiary hidden cursor-pointer rounded bg-transparent p-2 transition-all group-hover:flex"
          >
            <Link2 v-if="visibilityRef == 'public'" />
          </button>
          <button
            v-if="visibilityRef != 'na'"
            @click="share"
            class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded bg-transparent p-2 transition-all"
          >
            <Share2 v-if="visibilityRef == 'private'" />
            <EyeOff v-if="visibilityRef == 'public'" />
          </button>
        </div>
        <button
          @click="toggleSidebar"
          class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded p-2 transition-all"
        >
          <Settings2 />
        </button>
        <!-- <button
          @click="logout"
          class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded p-2 transition-all"
        >
          <LogOut />
        </button> -->
      </div>
      <div class="absolute top-5 left-4 z-50 flex">
        <button
          @click="toggleSidebar"
          class="cursor-pointer rounded p-2 transition-all"
          :class="{
            'text-tertiary/50 hover:text-tertiary bg-transparent': !isSidebarOpen,
            'text-on-surface-container bg-transparent': isSidebarOpen,
          }"
        >
          <PanelLeft v-if="!isSidebarOpen" />
          <PanelLeftClose v-else />
        </button>
        <button
          @click="() => (isSearchModalOpen = true)"
          class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded p-2 transition-all"
        >
          <Search v-if="!isSidebarOpen" />
        </button>
        <button
          @click="startNewChat"
          class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded p-2 transition-all"
        >
          <PlusIcon v-if="!isSidebarOpen" />
        </button>
      </div>
      <div
        id="sidebar"
        class="flex h-full min-w-[0px] shrink-0 overflow-hidden transition-all"
        :class="{
          'w-0': !isSidebarOpen,
          'w-[20vw] min-w-[300px]': isSidebarOpen,
        }"
      >
        <div
          class="bg-surface-container-lowest text-on-surface-container-lowest flex h-full w-[20vw] min-w-[300px] shrink-0 flex-col gap-10 p-4"
        >
          <h1 class="mt-2 text-center text-lg font-medium">tezz-chat</h1>
          <div class="h-[95%] w-full max-w-md overflow-hidden">
            <div class="flex h-full flex-col">
              <div class="mb-2">
                <NuxtLink
                  to="/chat/"
                  class="bg-secondary text-secondary-container hover:bg-secondary-container/[1] hover:text-on-secondary-container flex w-full items-center justify-center gap-2 rounded-lg p-2 text-center transition-all"
                >
                  <Plus /> New Chat
                </NuxtLink>
              </div>
              <div class="relative mt-6 flex h-full flex-col gap-1 overflow-y-auto">
                <div class="bg-surface-container-lowest sticky top-0 z-10 pb-4">
                  <div
                    class="bg-surface-container-lowest flex w-full items-center justify-center gap-2 rounded-lg p-2 px-6 text-black/50 dark:text-white/50"
                  >
                    <Search class="text-black/50 dark:text-white/50" />
                    <input
                      @input="filterChats(($event.target as HTMLInputElement)?.value)"
                      ref="searchInput"
                      type="text"
                      placeholder="Search..."
                      class="w-full border-black/50 p-1 outline-none focus:outline-none dark:border-white/50"
                    />
                  </div>
                </div>
                <div v-for="chat in arrayOfChats" :key="chat.id" class="group relative w-full">
                  <NuxtLink
                    :to="`/chat/${chat.id}`"
                    :id="getIfActive(chat.id)"
                    :class="{
                      'bg-secondary-container text-on-secondary-container':
                        $route.params.id === chat.id,
                      'group-hover:bg-surface-container-high group-hover:text-on-surface-container-high':
                        $route.params.id !== chat.id,
                    }"
                    class="flex space-x-2 rounded-lg p-2 px-4 transition-all"
                  >
                    <Split :size="18" v-if="chat.isBranched" class="shrink-0 opacity-50" />
                    <div class="w-full overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                      {{ chat.title }}
                    </div>
                  </NuxtLink>
                  <button
                    class="text-on-surface-container-highest group: from-surface-container-highest to-surface-container-highest/1 absolute top-0 right-0 bottom-0 flex w-[75px] cursor-pointer items-center justify-end rounded-r-lg bg-gradient-to-l pr-2 opacity-0 transition-all group-hover:opacity-100 hover:text-white"
                  >
                    <Trash2 :size="18" class="opacity-50 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="chat-view"
        class="relative box-border flex h-full w-full justify-center overflow-hidden px-4 pt-24"
      >
        <NuxtPage />
      </div>
      <SearchModal v-if="isSearchModalOpen" :close-modal="() => (isSearchModalOpen = false)" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';
import { onMounted, computed, watch } from 'vue';
import {
  EyeOff,
  Link,
  Link2,
  LoaderCircle,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Plus,
  PlusIcon,
  Search,
  Settings2,
  Share2,
  Split,
  Trash,
  Trash2,
} from 'lucide-vue-next';
// @ts-ignore
import { toast } from 'vue-sonner';

import {
  getThreads,
  getTitle,
  getThreadDetails,
  getThreadDetailsQuery,
} from '~/utils/database/queries';
import type { isRxDocument, RxDocument, RxQuery } from 'rxdb';
import type { Subscription } from 'rxjs';
import useDatabase from '../utils/database/db';

useDatabase();
console.log('Database initialized');
const route = useRoute();
const userStore = useUserStore();
const { isAuthenticated, isAuthChecked, isLoading: isUserStateLoading } = storeToRefs(userStore);
const layoutLoading = computed(() => isUserStateLoading.value || !isAuthChecked.value);

const arrayOfChats = ref([] as { id: string; title: string; isBranched: boolean }[]);
const allChats = ref([] as { id: string; title: string; isBranched: boolean }[]);
const isSidebarOpen = ref(false);
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const isLoading = ref(false);
const visibilityRef = ref<'na' | 'public' | 'private'>('na');
const threadDetailsSubscription = ref<Subscription>();
const isSearchModalOpen = ref(false);

onMounted(async () => {
  if (!isAuthChecked.value) {
    await userStore.fetchUser();
  }
  let threads = await (await getThreads()).exec();
  if (threads.length === 0) {
    console.log('No threads found, redirecting to create thread page');
  } else {
    console.log('Threads found:', threads);
    threads.forEach((thread: RxDocument) => {
      // console.log('Thread ID:', thread.get('id'));
      // console.log('Thread Title:', thread.get('title') || 'No title available');
      // console.log('Is Branched:', thread.get('sourceChatId') ? true : false);
      arrayOfChats.value.push({
        id: thread.get('id'),
        title: thread.get('title') || 'No summary available',
        isBranched: thread.get('sourceChatId') ? true : false,
      });
      allChats.value.push({
        id: thread.get('id'),
        title: thread.get('title') || 'No summary available',
        isBranched: thread.get('sourceChatId') ? true : false,
      });
    });
  }
  ((await getThreads()) as RxQuery).$.subscribe(threads => {
    console.log('Threads updated:', threads);
    arrayOfChats.value = threads.map((thread: RxDocument) => {
      if (thread.get('id') == route.params.id) {
        console.log('Current chat found:', thread.get('id'));
        document.title = thread.get('title') || 'No title - tezz-chat';
      }
      return {
        id: thread.get('id'),
        title: thread.get('title') || 'No summary available',
        isBranched: thread.get('sourceChatId') ? true : false,
      };
    });
    allChats.value = arrayOfChats.value; // Update allChats with the latest threads
  });
  if (route.params.id) {
    threadDetailsSubscription.value = (
      (await getThreadDetailsQuery(route.params.id as string)) as RxQuery
    ).$.subscribe(async thread => {
      console.log(thread, 'thread info');
      let threadInfo = route.params.id
        ? await getThreadDetails(route.params.id as string)
        : {
            title: 'New Chat - tezz-chat',
            visibility: 'na',
          };
      const { title, visibility } = threadInfo;
      document.title = title;
      visibilityRef.value = visibility;
      console.log(threadInfo);
    });
  }

  // scroll to current chat on sidebar
  scrollToSelectedChat();
  route.params.id
    ? changeTitle(route.params.id as string)
    : (document.title = 'New Chat - tezz-chat');
});

const filterChats = (query: string | null | undefined) => {
  if (!query) {
    arrayOfChats.value = allChats.value; // Reset to all chats if query is empty
    return;
  }
  arrayOfChats.value = arrayOfChats.value.filter(chat =>
    chat.title.toLowerCase().includes(query.toLowerCase())
  );
};

const getIfActive = (chatId: string) => {
  return route.params.id === chatId ? 'active-chat' : '';
};

const startNewChat = () => {
  navigateTo(`/chat/`);
};

const scrollToSelectedChat = () => {
  const currentChatId = route.params.id;
  if (currentChatId) {
    const chatElement = document.querySelector(`#sidebar a[id="active-chat"]`) as HTMLElement;
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

const changeTitle = async (newId: string) => {
  const title = await getTitle(newId);
  if (title) {
    document.title = title + ' - tezz-chat';
  } else {
    document.title = 'tezz-chat';
  }
};

watch([isAuthenticated, isAuthChecked], ([authenticated, checked]) => {
  if (checked && !authenticated) {
    navigateTo('/auth');
  }
});

// watch(
//   route,
//   () => {
//     scrollToSelectedChat();
//   },
//   { immediate: true }
// );

watch(
  () => route.params.id,
  async (newId, oldId) => {
    // react to route changes...
    if (!newId) {
      console.warn('No chat ID provided in route params.');
      document.title = 'New Chat - tezz-chat';
      visibilityRef.value = 'na';
      return;
    }
    if (threadDetailsSubscription.value) {
      threadDetailsSubscription.value.unsubscribe();
    }
    threadDetailsSubscription.value = (
      (await getThreadDetailsQuery(route.params.id as string)) as RxQuery
    ).$.subscribe(async thread => {
      console.log(thread, 'thread info');
      let threadInfo = route.params.id
        ? await getThreadDetails(route.params.id as string)
        : {
            title: 'New Chat - tezz-chat',
            visibility: 'na',
          };
      const { title, visibility } = threadInfo;
      document.title = title;
      visibilityRef.value = visibility;
      console.log(threadInfo);
    });

    console.log('Route changed from', oldId, 'to', newId);
    changeTitle(newId as string);
    // scrollToSelectedChat();
  }
);

const logout = async () => {
  console.log('Logging out...');
  await userStore.logOut();
  navigateTo('/auth');
};

const copy = async () => {
  try {
    const link = `${window.location.origin}/chat/shared/${route.params.id}`;
    await navigator.clipboard.writeText(link);
    console.log('Chat link copied to clipboard:', link);
    toast('Link copied!', {
      description: 'Your chat link has been copied to the clipboard.',
    });
  } catch (error) {
    console.error('Error copying chat link:', error);
    isLoading.value = false;
  }
};
const share = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch('/api/chat/visibility', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
      },
      body: {
        chatId: route.params.id,
        visibility: visibilityRef.value == 'public' ? 'private' : 'public',
      },
    });
    console.log('Share response:', response);
    isLoading.value = false;
    // Handle share success, e.g., show a notification or copy link to clipboard
  } catch (error) {
    console.error('Error sharing chat:', error);
    isLoading.value = false;
  }
};
</script>
