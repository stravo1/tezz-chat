<template>
  <div
    v-if="layoutLoading"
    class="fixed inset-0 flex h-screen w-screen items-center justify-center bg-white"
  >
    <LoaderCircle class="animate-spin" />
  </div>
  <div
    v-if="!layoutLoading"
    class="bg-surface-container text-on-surface relative flex min-h-screen flex-col"
  >
    <header class="absolute top-0 right-0 z-50 p-4">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="flex h-screen w-screen">
      <button
        @click="toggleSidebar"
        class="absolute top-5 left-4 z-50 cursor-pointer rounded p-2 transition-all"
        :class="{
          'text-tertiary-container bg-transparent': !isSidebarOpen,
          'text-on-surface-container bg-transparent': isSidebarOpen,
        }"
      >
        <PanelLeft v-if="!isSidebarOpen" />
        <PanelLeftClose v-else />
      </button>
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
              <div class="mb-4">
                <NuxtLink
                  to="/chat/"
                  class="bg-secondary text-secondary-container hover:bg-secondary-container/[1] hover:text-on-secondary-container flex w-full items-center justify-center gap-2 rounded-lg p-2 text-center transition-all"
                >
                  <Plus /> New Chat
                </NuxtLink>
              </div>
              <div class="mt-6 flex h-full flex-col gap-1 overflow-y-auto">
                <div v-for="chat in arrayOfChats" :key="chat.id" class="w-full">
                  <NuxtLink
                    :to="`/chat/${chat.id}`"
                    :id="getIfActive(chat.id)"
                    :class="{
                      'bg-secondary-container text-on-secondary-container':
                        $route.params.id === chat.id,
                      'hover:bg-surface-container-high hover:text-on-surface-container-high':
                        $route.params.id !== chat.id,
                    }"
                    class="block w-full overflow-hidden rounded-lg p-2 px-4 text-sm text-ellipsis whitespace-nowrap transition-all"
                  >
                    {{ chat.title }}
                  </NuxtLink>
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';
import { onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { LoaderCircle, PanelLeft, PanelLeftClose, Plus } from 'lucide-vue-next';
import { getThreads } from '~/utils/database/queries';
import type { isRxDocument, RxDocument, RxQuery } from 'rxdb';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { isAuthenticated, isAuthChecked, isLoading } = storeToRefs(userStore);
const layoutLoading = computed(() => isLoading.value || !isAuthChecked.value);

const arrayOfChats = ref([] as { id: string; title: string }[]);
const isSidebarOpen = ref(false);
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
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
      arrayOfChats.value.push({
        id: thread.get('id'),
        title: thread.get('title') || 'No summary available',
      });
    });
  }
  let threadSubscription = ((await getThreads()) as RxQuery).$.subscribe(threads => {
    console.log('Threads updated:', threads);
    arrayOfChats.value = threads.map((thread: RxDocument) => ({
      id: thread.get('id'),
      title: thread.get('title') || 'No summary available',
    }));
  });
  // scroll to current chat on sidebar
  scrollToSelectedChat();
});

const getIfActive = (chatId: string) => {
  return route.params.id === chatId ? 'active-chat' : '';
};
const scrollToSelectedChat = () => {
  const currentChatId = router.currentRoute.value.params.id;
  if (currentChatId) {
    const chatElement = document.querySelector(`#sidebar a[id="active-chat"]`) as HTMLElement;
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

watch([isAuthenticated, isAuthChecked], ([authenticated, checked]) => {
  if (checked && !authenticated) {
    router.push('/auth');
  }
});

// watch(
//   route,
//   () => {
//     scrollToSelectedChat();
//   },
//   { immediate: true }
// );
const logout = async () => {
  console.log('Logging out...');
  await userStore.logOut();
  router.push('/auth');
};
</script>
