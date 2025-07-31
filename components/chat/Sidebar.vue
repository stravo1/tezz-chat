<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '~/stores/user';
import { getThreads } from '~/utils/database/queries';
import type { RxDocument, RxQuery } from 'rxdb';
import { Search, Settings2 } from 'lucide-vue-next';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from '~/components/ui/sidebar';
import { Button } from '~/components/ui/button';
import ChatSection from './Sidebar/Section.vue';
import RenameModal from './RenameModal.vue';

const emit = defineEmits<{
  newChat: [];
  triggerSearch: [];
  openSettings: [];
}>();

// Reactive data
const route = useRoute();
const userStore = useUserStore();
const loadingStore = useLoadingStore();
const { isAuthenticated } = storeToRefs(userStore);

const arrayOfChats = ref(
  [] as { id: string; title: string; isBranched: boolean; visibility?: string; createdAt: string }[]
);
const allChats = ref(
  [] as { id: string; title: string; isBranched: boolean; visibility?: string; createdAt: string }[]
);
const searchQuery = ref('');
const isLoading = ref(false);
const loadingMessage = ref('');

// Rename modal state
const isRenameModalOpen = ref(false);
const renamingChatId = ref<string>('');
const renamingChatTitle = ref('');

// Computed
const filteredChats = computed(() => {
  let chats = searchQuery.value
    ? arrayOfChats.value.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : arrayOfChats.value;

  return groupChatsByTime(chats);
});

const totalChatCount = computed(() => {
  const groups = filteredChats.value;
  return (
    groups.today.length +
    groups.yesterday.length +
    groups.lastSevenDays.length +
    groups.lastThirtyDays.length +
    groups.older.length
  );
});

// Time-based grouping function
const groupChatsByTime = (chats: typeof arrayOfChats.value) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(now);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const groups = {
    today: [] as typeof chats,
    yesterday: [] as typeof chats,
    lastSevenDays: [] as typeof chats,
    lastThirtyDays: [] as typeof chats,
    older: [] as typeof chats,
  };

  chats.forEach(chat => {
    const chatDate = new Date(chat.createdAt);

    if (isToday(chatDate)) {
      groups.today.push(chat);
    } else if (isYesterday(chatDate)) {
      groups.yesterday.push(chat);
    } else if (chatDate > lastWeek) {
      groups.lastSevenDays.push(chat);
    } else if (chatDate > lastMonth) {
      groups.lastThirtyDays.push(chat);
    } else {
      groups.older.push(chat);
    }
  });

  return groups;
};

// Date helper functions
const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

// Methods
const loadChats = async () => {
  try {
    const threads = await (await getThreads()).exec();

    arrayOfChats.value = threads.map((thread: RxDocument) => ({
      id: thread.get('id'),
      title: thread.get('title') || 'No summary available',
      isBranched: thread.get('sourceChatId') ? true : false,
      visibility: thread.get('visibility') || 'private',
      createdAt: thread.get('createdAt') || new Date().toISOString(),
    }));

    allChats.value = [...arrayOfChats.value];

    // Subscribe to real-time updates
    ((await getThreads()) as RxQuery).$.subscribe(threads => {
      arrayOfChats.value = threads.map((thread: RxDocument) => ({
        id: thread.get('id'),
        title: thread.get('title') || 'No summary available',
        isBranched: thread.get('sourceChatId') ? true : false,
        visibility: thread.get('visibility') || 'private',
        createdAt: thread.get('createdAt') || new Date().toISOString(),
      }));
      allChats.value = [...arrayOfChats.value];
    });
  } catch (error) {
    console.error('Error loading chats:', error);
  }
};

const deleteThread = async (threadId: string) => {
  const confirmDelete = confirm(
    'Are you sure you want to delete this chat? This action cannot be undone.'
  );
  if (!confirmDelete) {
    return;
  }

  isLoading.value = true;
  try {
    await $fetch(`/api/chat/${threadId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
      },
    });

    // If we're deleting the current chat, navigate to new chat
    if (route.params.id === threadId) {
      navigateTo('/chat/');
    }
  } catch (error) {
    console.error(`Error deleting thread ${threadId}:`, error);
  } finally {
    isLoading.value = false;
  }
};

const startRename = (chatId: string, currentTitle: string) => {
  renamingChatId.value = chatId;
  renamingChatTitle.value = currentTitle;
  isRenameModalOpen.value = true;
};

const handleRename = async (chatId: string, newTitle: string) => {
  isLoading.value = true;
  loadingMessage.value = 'Renaming chat...';
  try {
    await $fetch(`/api/chat/${chatId}/rename`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
      },
      body: {
        name: newTitle,
      },
    });
  } catch (error) {
    console.error('Error renaming chat:', error);
    // You might want to show a toast or error message here
  } finally {
    isLoading.value = false;
  }
};

const closeRenameModal = () => {
  isRenameModalOpen.value = false;
  renamingChatId.value = '';
  renamingChatTitle.value = '';
};

const shareChat = async (chatId: string, currentVisibility: string) => {
  isLoading.value = true;
  try {
    const response = (await $fetch('/api/chat/visibility', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + (await userStore.getJWT()),
      },
      body: {
        chatId: chatId,
        visibility: currentVisibility === 'public' ? 'private' : 'public',
      },
    })) as any;

    // Update local state
    const chatIndex = arrayOfChats.value.findIndex(chat => chat.id === chatId);
    if (chatIndex !== -1 && response?.data) {
      arrayOfChats.value[chatIndex].visibility = response.data.visibility;
      allChats.value = [...arrayOfChats.value];
    }

    if (response?.data?.visibility === 'public') {
      // Copy link to clipboard
      const link = `${window.location.origin}/chat/shared/${chatId}`;
      await navigator.clipboard.writeText(link);
      // You might want to show a toast here
      console.log('Chat is now public! Link copied to clipboard.');
    } else {
      console.log('Chat is now private!');
    }
  } catch (error) {
    console.error('Error sharing chat:', error);
  } finally {
    isLoading.value = false;
  }
};

const isActiveChat = (chatId: string) => {
  return route.params.id === chatId;
};

const startNewChat = () => {
  emit('newChat');
  navigateTo('/chat/');
};

// Lifecycle
onMounted(() => {
  if (isAuthenticated.value) {
    loadChats();
  }
});

watch(
  () => isLoading.value,
  loading => {
    if (loading) {
      loadingStore.setLoading(true);
      loadingStore.setLoadingMessage(loadingMessage.value);
    } else {
      loadingStore.setLoading(false);
      loadingStore.setLoadingMessage('');
    }
  }
);

watch(isAuthenticated, authenticated => {
  if (authenticated) {
    loadChats();
  }
});
</script>

<template>
  <Sidebar class="!border-r-[0px]">
    <SidebarHeader class="border-border border-b">
      <div class="flex w-full items-center justify-center py-2">
        <h1 class="syne text-2xl font-black">tezz ⚡</h1>
      </div>
    </SidebarHeader>

    <SidebarContent class="p-2">
      <SidebarGroup>
        <SidebarGroupContent class="space-y-3">
          <!-- New Chat Button -->
          <Button
            @click="startNewChat"
            class="w-full cursor-pointer justify-center gap-2"
            variant="default"
          >
            New Chat
          </Button>

          <!-- Search Input -->
          <Button
            @click="emit('triggerSearch')"
            variant="outline"
            class="text-foreground hover:text-foreground/50 w-full cursor-pointer"
          >
            <Search className="h-4 w-4" />
            Search chats
            <div class="ml-auto flex items-center gap-1 text-xs">
              <kbd
                class="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono font-medium select-none lg:inline-flex"
              >
                <span class="text-sm">⌘</span>
                <span class="text-xs">K</span>
              </kbd>
            </div>
          </Button>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Chat List -->
      <SidebarGroup class="h-[80vh] overflow-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <ChatSection
              title="Today"
              :chats="filteredChats.today"
              :active-chat="isActiveChat"
              @start-rename="startRename"
              @share-chat="shareChat"
              @delete-thread="deleteThread"
            />

            <ChatSection
              title="Yesterday"
              :chats="filteredChats.yesterday"
              :active-chat="isActiveChat"
              @start-rename="startRename"
              @share-chat="shareChat"
              @delete-thread="deleteThread"
            />

            <ChatSection
              title="Last 7 Days"
              :chats="filteredChats.lastSevenDays"
              :active-chat="isActiveChat"
              @start-rename="startRename"
              @share-chat="shareChat"
              @delete-thread="deleteThread"
            />

            <ChatSection
              title="Last 30 Days"
              :chats="filteredChats.lastThirtyDays"
              :active-chat="isActiveChat"
              @start-rename="startRename"
              @share-chat="shareChat"
              @delete-thread="deleteThread"
            />

            <ChatSection
              title="Older"
              :chats="filteredChats.older"
              :active-chat="isActiveChat"
              @start-rename="startRename"
              @share-chat="shareChat"
              @delete-thread="deleteThread"
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <div class="text-muted-foreground relative p-2 text-center text-xs">
        {{ totalChatCount }} chat{{ totalChatCount !== 1 ? 's' : '' }}
        <button
          @click="emit('openSettings')"
          class="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
        >
          <Settings2 class="h-4 w-4" />
        </button>
      </div>
    </SidebarFooter>

    <!-- Rename Modal -->
    <RenameModal
      :is-open="isRenameModalOpen"
      :chat-id="renamingChatId"
      :current-title="renamingChatTitle"
      @close="closeRenameModal"
      @save="handleRename"
    />
  </Sidebar>
</template>
