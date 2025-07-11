<template>
  <div
    @click="props.closeModal"
    class="fixed inset-0 z-[75] flex h-[100dvh] w-screen items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-lg dark:backdrop-blur-sm"
  >
    <div @click.stop class="h-fit max-h-[50vh] w-[90vw] max-w-[540px] lg:w-[55vw]">
      <div
        class="bg-background text-foreground flex w-full items-center justify-between rounded-t-lg p-4 px-6"
      >
        <div class="flex items-center gap-2">
          <Settings2 />
        </div>
        <X class="cursor-pointer hover:opacity-75" @click="props.closeModal" />
      </div>

      <div class="bg-background h-full overflow-y-auto rounded-b-lg p-6">
        <!-- User Profile Section -->
        <div class="mb-8 flex justify-between">
          <div class="flex items-center gap-4">
            <User :size="32" />
            <div>
              <p class="font-medium">{{ userProfile.name || 'Anonymous User' }}</p>
              <p
                class="max-w-[35vw] overflow-hidden text-sm text-ellipsis whitespace-nowrap opacity-75"
              >
                {{ userProfile.email || 'No email provided' }}
              </p>
            </div>
          </div>
          <div class="flex items-center justify-center gap-2">
            <button
              @click="toggleDarkMode()"
              class="text-primary/70 hover:text-primary cursor-pointer rounded px-4 py-2"
            >
              <Sun v-if="isDark" />
              <Moon v-else />
            </button>
            <button
              @click="logout"
              class="text-primary/50 cursor-pointer rounded px-4 py-2 hover:bg-red-100 dark:hover:bg-red-400/20"
            >
              <LogOut class="text-red-500 dark:text-red-300" />
            </button>
          </div>
        </div>

        <!-- API Keys Section -->
        <div class="space-y-6">
          <!-- Gemini API Key -->
          <div class="space-y-2">
            <div class="flex gap-2">
              <input
                v-model="geminiKey"
                placeholder="Enter your Gemini API key"
                style="font-family: monospace"
                class="w-full rounded border border-black/10 bg-white/10 p-3 outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
              />
              <button
                @click="saveGeminiKey"
                class="text-primary/70 hover:text-primary cursor-pointer rounded px-4 py-2"
              >
                <Save />
              </button>
            </div>
          </div>

          <!-- OpenRouter API Key -->
          <div class="space-y-2">
            <div class="flex gap-2">
              <input
                v-model="openRouterKey"
                placeholder="Enter your OpenRouter API key"
                style="font-family: monospace"
                class="w-full rounded border border-black/10 bg-white/10 p-3 outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
              />
              <button
                @click="saveOpenRouterKey"
                class="text-primary/70 hover:text-primary cursor-pointer rounded px-4 py-2"
              >
                <Save />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LogOut, Moon, Save, Settings, Settings2, Sun, User, X } from 'lucide-vue-next';
import { ref, onMounted, onUnmounted } from 'vue';
// @ts-ignore
import { toast } from 'vue-sonner';
import { useDark, useToggle } from '@vueuse/core';

interface UserProfile {
  name: string;
  email: string;
}

const props = defineProps<{
  closeModal: () => void;
  setIsLoading: (isLoading: boolean) => void;
}>();

// User data mock - replace with actual user store/data
const userProfile = ref<UserProfile>({
  name: '',
  email: '',
});

const userStore = useUserStore();
// API key management
const geminiKey = ref('');
const openRouterKey = ref('');
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
});
const toggleDarkMode = useToggle(isDark);
const saveGeminiKey = () => {
  if (geminiKey.value) {
    localStorage.setItem('gemini-api-key', geminiKey.value);
    toast.success('Gemini API key saved successfully');
  }
};

const saveOpenRouterKey = () => {
  if (openRouterKey.value) {
    localStorage.setItem('openrouter-api-key', openRouterKey.value);
    toast.success('OpenRouter API key saved successfully');
  }
};

// Load saved keys on mount
onMounted(async () => {
  // await userStore.fetchUser();
  userProfile.value = {
    name: userStore.currentUser?.name || 'Anonymous User',
    email: userStore.currentUser?.email || 'No email provided',
  };
  geminiKey.value = localStorage.getItem('gemini-api-key') || '';
  openRouterKey.value = localStorage.getItem('openrouter-api-key') || '';
});

// Handle escape key to close modal
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    props.closeModal();
  }
};

// Add event listener for escape key
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});

const deleteAllIndexDB = async () => {
  try {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        const request = indexedDB.deleteDatabase(db.name);
        request.onsuccess = () => {
          console.log(`Deleted database: ${db.name}`);
        };
        request.onerror = event => {
          console.error(`Error deleting database ${db.name}:`, event);
        };
      }
    }
  } catch (error) {
    console.error('Error deleting IndexedDB databases:', error);
  }
};

const logout = async () => {
  props.setIsLoading(true);
  localStorage.clear();
  await deleteAllIndexDB();
  props.setIsLoading(false);
  console.log('Logging out...');
  await userStore.logOut();
  navigateTo('/auth');
};
</script>
