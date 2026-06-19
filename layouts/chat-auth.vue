<template>
  <TooltipProvider>
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
      <LoaderModal v-if="isLoading" :message="loadingMessage" />

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
            class="bg-background relative box-border flex h-full w-full justify-center overflow-hidden rounded-lg px-2 pt-16 lg:px-4 lg:pt-20"
          >
            <!-- Top right controls -->
            <div class="absolute top-4 right-4 z-30 flex items-center gap-2">
              <!-- Guest badge (all viewports) -->
              <Tooltip v-if="isGuest" :delayDuration="300">
                <TooltipTrigger asChild>
                  <NuxtLink
                    to="/auth"
                    class="border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 bg-background inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all outline-none focus-visible:ring-[3px]"
                  >
                    <svg
                      class="size-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="1.75"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                    <span class="hidden sm:inline">Guest</span>
                  </NuxtLink>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="text-xs">
                  Sign in to save chats and access history
                </TooltipContent>
              </Tooltip>

              <!-- Temporary chat toggle: only on new chats (no chat started yet), non-guests, desktop -->
              <ChatTemporaryChatToggle
                v-if="!isGuest && visibilityRef === 'na'"
                class="hidden lg:inline-flex"
              />

              <!-- Chat-specific actions: only when inside an existing saved chat -->
              <template v-if="visibilityRef !== 'na'">
                <!-- Desktop -->
                <div class="hidden items-center gap-2 lg:flex">
                  <!-- Chat Navigator -->
                  <Tooltip :delayDuration="300">
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        class="text-foreground hover:!bg-accent border-border/70 size-8 cursor-pointer transition-all"
                        @click="isChatNavigatorOpen = true"
                      >
                        <ListTree class="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Chat Navigator</TooltipContent>
                  </Tooltip>

                  <!-- Share / Copy dropdown — plain DropdownMenu, no nested Tooltip on trigger -->
                  <DropdownMenu v-model:open="isDesktopChatMenuOpen">
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        class="text-foreground hover:!bg-accent border-border/70 size-8 cursor-pointer transition-all"
                        aria-label="Chat options"
                      >
                        <MoreHorizontal class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="border-border/60 w-52">
                      <DropdownMenuItem @click="share()">
                        <Share2 v-if="visibilityRef === 'private'" class="mr-2 size-4" />
                        <EyeOff v-if="visibilityRef === 'public'" class="mr-2 size-4" />
                        {{ visibilityRef === 'private' ? 'Share chat' : 'Make private' }}
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="visibilityRef === 'public'" @click="copy()">
                        <Link2 class="mr-2 size-4" />
                        Copy share link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <!-- Mobile: Chat Navigator + options dropdown -->
                <div class="flex items-center gap-1.5 lg:hidden">
                  <Button
                    size="icon"
                    variant="outline"
                    class="text-foreground hover:!bg-accent border-border/70 size-7 cursor-pointer transition-all"
                    @click="isChatNavigatorOpen = true"
                    aria-label="Chat Navigator"
                  >
                    <ListTree class="size-3.5" />
                  </Button>
                  <DropdownMenu v-model:open="isMobileChatOptionMenuOpen">
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        class="text-foreground hover:!bg-accent border-border/70 size-7 cursor-pointer transition-all"
                        aria-label="Chat options"
                      >
                        <MoreHorizontal class="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="border-border/60 w-52">
                      <DropdownMenuItem @click="share()">
                        <Share2 v-if="visibilityRef === 'private'" class="mr-2 size-4" />
                        <EyeOff v-if="visibilityRef === 'public'" class="mr-2 size-4" />
                        {{ visibilityRef === 'private' ? 'Share chat' : 'Make private' }}
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="visibilityRef === 'public'" @click="copy()">
                        <Link2 class="mr-2 size-4" />
                        Copy share link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </template>
            </div>
            <!-- <div
            class="from-background to-background/0 absolute top-0 left-0 z-10 h-[20vh] w-full bg-gradient-to-b"
          ></div> -->
            <NuxtPage :key="route.params.id || 'new'" />
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
        :initial-provider="settingsInitialProvider"
      />
      <ChatNavigator
        :open="isChatNavigatorOpen"
        @update:open="val => (isChatNavigatorOpen = val)"
      />
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, computed, watch, ref } from 'vue';
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
import TooltipProvider from '~/components/ui/tooltip/TooltipProvider.vue';

useDatabase();
console.log('Database initialized');
const route = useRoute();
const userStore = useUserStore();
const loadingStore = useLoadingStore();
const isMobile = useMediaQuery('(max-width: 768px)');
const {
  isAuthenticated,
  isAuthChecked,
  isLoading: isUserStateLoading,
  isGuest,
} = storeToRefs(userStore);
const isUserLoading = isUserStateLoading; // alias for clarity in the auth watcher
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
const settingsInitialProvider = ref<string | null>(null);
const isMobileChatOptionMenuOpen = ref(false);
const isDesktopChatMenuOpen = ref(false);
const isChatNavigatorOpen = ref(false);
const loadingMessage = ref('');

// Open the SettingsModal from anywhere via:
//   window.dispatchEvent(new CustomEvent('open-settings', { detail: { providerId } }))
// Used by ModelSelector's "Configure" CTA for disabled providers.
const handleOpenSettings = (e: Event) => {
  const detail = (e as CustomEvent<{ providerId?: string } | undefined>).detail;
  settingsInitialProvider.value = detail?.providerId ?? null;
  isSettingsModalOpen.value = true;
};

onMounted(() => {
  window.addEventListener('open-settings', handleOpenSettings);
});
onUnmounted(() => {
  window.removeEventListener('open-settings', handleOpenSettings);
});

onMounted(async () => {
  if (!isAuthChecked.value) {
    try {
      await userStore.fetchUser();
    } catch (err) {
      console.error('Error fetching user:', err);
      navigateTo('/auth');
      return;
    }
  }
  if (!isAuthenticated.value) {
    console.warn('User is not authenticated, redirecting to auth page');
    navigateTo('/auth');
    return;
  }

  // Guests see the chat UI but with the sidebar closed (no history)
  if (isGuest.value) {
    isSidebarOpen.value = false;
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
  // Only redirect when auth check is done, user is definitely not authenticated,
  // AND we are not currently in the middle of a loading/transition (e.g. logOut
  // called from auth page clears the guest session briefly).
  if (checked && !authenticated && !isUserLoading.value) {
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
    // Clear the message store when navigating to a different chat so the
    // new page instance doesn't pick up stale messages from the previous chat.
    if (oldId && newId !== oldId) {
      const messageStore = useMessageStore();
      messageStore.clearMessages();
    }

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
      // console.log(thread, 'thread info');
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

watch(
  () => loadingStore.isLoading,
  loading => {
    isLoading.value = loading as boolean;
    loadingMessage.value = loadingStore.loadingMessage;
  }
);

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    isSearchModalOpen.value = !isSearchModalOpen.value;
  }
});

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'o' && (event.metaKey || event.ctrlKey) && event.shiftKey) {
    event.preventDefault();
    startNewChat();
  }
});
</script>
