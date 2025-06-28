<template>
  <div
    v-if="layoutLoading"
    class="bg-background text-foreground fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center backdrop-blur-2xl"
  >
    <LoaderCircle class="animate-spin" />
  </div>

  <div
    v-if="!layoutLoading"
    class="bg-background text-foreground relative flex min-h-[100dvh] flex-col"
    vaul-drawer-wrapper
  >
    <LoaderModal v-if="isLoading" />

    <SidebarProvider
      :open="isSidebarOpen"
      :open-mobile-prop="isSidebarOpen"
      @update:open="event => (isSidebarOpen = event)"
      class="flex h-[100dvh] w-screen"
    >
      <!-- New Shadcn-vue Sidebar -->
      <ChatSidebar
        @new-chat="startNewChat"
        @trigger-search="() => (isSearchModalOpen = true)"
        @open-settings="() => (isSettingsModalOpen = true)"
      />

      <!-- Main Content Area -->
      <SidebarInset
        class="bg-sidebar box-border w-full p-2 pb-0 lg:pb-2"
        :class="{ 'pl-0': isSidebarOpen }"
      >
        <!-- Top left controls (mobile) -->
        <!-- <div class="absolute top-5 left-4 z-50 flex lg:hidden">
          <button
            @click="() => (isSearchModalOpen = true)"
            class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded p-2 transition-all"
          >
            <Search />
          </button>
          <button
            @click="startNewChat"
            class="text-tertiary/50 hover:text-tertiary cursor-pointer rounded p-2 transition-all"
          >
            <PlusIcon />
          </button>
        </div> -->

        <!-- Chat view content -->
        <div
          id="chat-view"
          class="bg-background relative box-border flex h-full w-full justify-center overflow-hidden rounded-lg px-2 pt-0 lg:px-4"
        >
          <!-- Top right controls -->
          <div class="absolute top-4 right-4 z-30 flex gap-2">
            <div class="hidden items-center gap-2 lg:flex">
              <Tooltip v-if="visibilityRef != 'na'" :delayDuration="300">
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    @click="share()"
                    class="text-foreground hover:!bg-accent border-border/70 flex cursor-pointer rounded border p-2 transition-all"
                  >
                    <Share2 v-if="visibilityRef == 'private'" />
                    <EyeOff v-if="visibilityRef == 'public'" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p v-if="visibilityRef == 'private'">Share Chat</p>
                  <p v-else>Make Chat Private</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip v-if="visibilityRef == 'public'" :delayDuration="300">
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    @click="copy()"
                    class="text-foreground hover:!bg-accent border-border/70 flex cursor-pointer rounded border p-2 transition-all"
                  >
                    <Link2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Copy Link</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip :delayDuration="300" v-if="visibilityRef != 'na'">
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    class="text-foreground hover:!bg-accent border-border/70 flex cursor-pointer rounded border p-2 transition-all"
                  >
                    <ListTree />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Chat Navigator</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div class="flex items-center gap-2 lg:hidden">
              <Button
                size="sm"
                variant="outline"
                class="text-foreground hover:!bg-accent border-border/70 flex h-6 w-6 cursor-pointer rounded border p-0 transition-all"
              >
                <ListTree class="h-3 w-3" />
              </Button>
              <DropdownMenu v-model:open="isMobileChatOptionMenuOpen">
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="sm" class="h-6 w-6 p-0" @click.prevent>
                    <MoreHorizontal class="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="border-border/50 lg:border-border w-48">
                  <DropdownMenuItem v-if="visibilityRef == 'public'" @click="copy()">
                    <Link2 class="mr-2 h-4 w-4" />
                    Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="share()">
                    <Share2 v-if="visibilityRef == 'private'" class="mr-2 h-4 w-4" />
                    <EyeOff v-if="visibilityRef == 'public'" class="mr-2 h-4 w-4" />
                    {{ visibilityRef == 'private' ? 'Share Chat' : 'Make Chat Private' }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div
            class="from-background to-background/0 absolute top-0 left-0 z-10 h-[20vh] w-full bg-gradient-to-b"
          ></div>
          <NuxtPage />
          <SidebarTrigger
            class="text-foreground hover:!bg-accent absolute top-4 left-4 z-20 cursor-pointer rounded p-2 transition-all"
          />
        </div>
      </SidebarInset>
    </SidebarProvider>

    <!-- Modals -->
    <SearchModal v-if="isSearchModalOpen" :close-modal="() => (isSearchModalOpen = false)" />
    <SettingsModal
      v-if="isSettingsModalOpen"
      :close-modal="() => (isSettingsModalOpen = false)"
      :set-is-loading="() => (isLoading = true)"
    />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';
import { onMounted, computed, watch, ref } from 'vue';
import { useHead } from '#imports'; // Import useHead from #imports
import {
  EyeOff,
  Link2,
  ListTree,
  LoaderCircle,
  MoreHorizontal,
  Settings2,
  Share2,
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

// Import new sidebar components
import ChatSidebar from '~/components/chat/Sidebar.vue';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '~/components/ui/sidebar';
import { useEventListener, useMediaQuery } from '@vueuse/core';
import Button from '~/components/ui/button/Button.vue';
import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';
import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
import DropdownMenu from '~/components/ui/dropdown-menu/DropdownMenu.vue';
import DropdownMenuTrigger from '~/components/ui/dropdown-menu/DropdownMenuTrigger.vue';
import DropdownMenuContent from '~/components/ui/dropdown-menu/DropdownMenuContent.vue';
import DropdownMenuItem from '~/components/ui/dropdown-menu/DropdownMenuItem.vue';

useDatabase();
console.log('Database initialized');
const route = useRoute();
const userStore = useUserStore();
const isMobile = useMediaQuery('(max-width: 768px)');
const { isAuthenticated, isAuthChecked, isLoading: isUserStateLoading } = storeToRefs(userStore);
const layoutLoading = ref(true);

const pageTitle = ref('New Chat');

// Set up page title with useHead
useHead({
  title: computed(() => pageTitle.value),
});

const isSidebarOpen = ref(true);
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const isLoading = ref(false);
const visibilityRef = ref<'na' | 'public' | 'private'>('na');
const threadDetailsSubscription = ref<Subscription>();
const isSearchModalOpen = ref(false);
const isSettingsModalOpen = ref(false);
const isMobileChatOptionMenuOpen = ref(false);

onMounted(async () => {
  if (!isAuthChecked.value) {
    await userStore.fetchUser();
    if (!isAuthenticated.value) {
      console.warn('User is not authenticated, redirecting to auth page');
      navigateTo('/auth');
      return;
    }
  }
  layoutLoading.value = false;

  if (route.params.id) {
    threadDetailsSubscription.value = (
      (await getThreadDetailsQuery(route.params.id as string)) as RxQuery
    ).$.subscribe(async thread => {
      console.log(thread, 'thread info');
      let threadInfo = route.params.id
        ? await getThreadDetails(route.params.id as string)
        : {
            title: 'New Chat',
            visibility: 'na',
          };
      const { title, visibility } = threadInfo;
      document.title = title;
      pageTitle.value = title;
      visibilityRef.value = visibility;
      console.log(threadInfo);
    });
  }

  if (route.params.id) {
    changeTitle(route.params.id as string);
  } else {
    pageTitle.value = 'New Chat';
  }
});

const startNewChat = () => {
  navigateTo(`/chat/`);
};

const changeTitle = async (newId: string) => {
  const title = await getTitle(newId);
  pageTitle.value = title ? `${title}` : 'New Chat';
};

watch([isAuthenticated, isAuthChecked], async ([authenticated, checked]) => {
  if (checked && !authenticated) {
    console.warn('User is not authenticated, redirecting to auth page');
    try {
      await navigateTo('/auth');
      console.log('Redirected to auth page');
    } catch (error) {
      console.error('Error navigating to auth page:', error);
    }
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
      pageTitle.value = 'New Chat';
      visibilityRef.value = 'na';
      if (isMobile.value) isSidebarOpen.value = false; // Ensure sidebar is open on new chat
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
            title: 'New Chat',
            visibility: 'na',
          };
      const { title, visibility } = threadInfo;
      document.title = title;
      visibilityRef.value = visibility;
      console.log(threadInfo);
    });

    console.log('Route changed from', oldId, 'to', newId);
    changeTitle(newId as string);
    if (isMobile.value) {
      isSidebarOpen.value = false; // Close sidebar on mobile when route changes
      isSearchModalOpen.value = false; // Close search modal on mobile when route changes
    }
    // scrollToSelectedChat();
  }
);

const copy = async (suppressToast: boolean = false) => {
  try {
    const link = `${window.location.origin}/chat/shared/${route.params.id}`;
    await navigator.clipboard.writeText(link);
    console.log('Chat link copied to clipboard:', link);
    if (!suppressToast) toast.success('Link copied!');
  } catch (error) {
    console.error('Error copying chat link:', error);
    isLoading.value = false;
  }
};
const share = async () => {
  isLoading.value = true;
  try {
    const response = (await $fetch('/api/chat/visibility', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
      },
      body: {
        chatId: route.params.id,
        visibility: visibilityRef.value == 'public' ? 'private' : 'public',
      },
    })) as any;
    console.log('Share response:', response);
    if (response?.data?.visibility == 'public') {
      visibilityRef.value = 'public';
      toast.success('Chat is now public! Link copied to clipboard.');
      copy(true); // Automatically copy the link when made public
    } else {
      visibilityRef.value = 'private';
      toast.success('Chat is now private!');
    }
    isLoading.value = false;
    // Handle share success, e.g., show a notification or copy link to clipboard
  } catch (error) {
    console.error('Error sharing chat:', error);
    isLoading.value = false;
  }
};

watch([isAuthenticated, isAuthChecked], async ([authenticated, checked]) => {
  if (checked && !authenticated) {
    console.warn('User is not authenticated, redirecting to auth page');
    try {
      await navigateTo('/auth');
      console.log('Redirected to auth page');
    } catch (error) {
      console.error('Error navigating to auth page:', error);
    }
  }
});

watch(
  () => route.params.id,
  async (newId, oldId) => {
    // react to route changes...
    if (!newId) {
      console.warn('No chat ID provided in route params.');
      pageTitle.value = 'New Chat';
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
            title: 'New Chat',
            visibility: 'na',
          };
      const { title, visibility } = threadInfo;
      document.title = title;
      pageTitle.value = title;
      visibilityRef.value = visibility;
      console.log(threadInfo);
    });

    console.log('Route changed from', oldId, 'to', newId);
    changeTitle(newId as string);
  }
);

watch([isSearchModalOpen, isSettingsModalOpen], ([searchOpen, settingsOpen]) => {
  console.log(
    'Search modal open:',
    searchOpen,
    'Settings modal open:',
    settingsOpen,
    'isMobile:',
    isMobile.value
  );
  if ((searchOpen || settingsOpen) && isMobile.value) {
    isSidebarOpen.value = false; // Close sidebar when modals are open
    console.log('Sidebar closed due to modal open', isSidebarOpen.value);
  }
});

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    isSearchModalOpen.value = !isSearchModalOpen.value;
  }
});
</script>
