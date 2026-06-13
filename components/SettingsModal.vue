<template>
  <div
    @click="props.closeModal"
    class="fixed inset-0 z-[75] flex h-[100dvh] w-screen items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-lg dark:backdrop-blur-sm"
  >
    <div @click.stop class="h-fit max-h-[80vh] w-[90vw] max-w-[540px] overflow-auto lg:w-[55vw]">
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

        <!-- Theme Settings Section -->
        <div class="mb-8">
          <ThemeSettings />
        </div>

        <!-- BYOK / Provider API Keys Section -->
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-muted-foreground my-2 text-sm font-medium">Provider API keys</h3>
          <span class="text-muted-foreground text-xs">
            {{ configuredCount }}/{{ PROVIDERS.length }} configured
          </span>
        </div>
        <p class="text-muted-foreground mb-4 text-xs">
          Stored only in your browser. Models from providers without a key will appear disabled in
          the model picker.
        </p>

        <div class="space-y-3">
          <div
            v-for="provider in PROVIDERS"
            :key="provider.id"
            :id="`byok-section-${provider.id}`"
            class="border-border bg-background/40 scroll-mt-4 rounded-lg border p-3"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 text-left"
              @click="toggle(provider.id)"
            >
              <div class="flex items-center gap-2">
                <img
                  :src="`/api/model-logo/${provider.id}`"
                  :alt="provider.fallbackName"
                  class="h-5 w-5 shrink-0 dark:invert"
                  loading="lazy"
                />
                <span class="text-sm font-medium">{{ provider.fallbackName }}</span>
                <span
                  v-if="keys[provider.id]"
                  class="ml-1 inline-flex h-2 w-2 rounded-full bg-emerald-500"
                  :title="'Key saved'"
                />
              </div>
              <ChevronDown
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': isOpen(provider.id) }"
              />
            </button>

            <div v-if="isOpen(provider.id)" class="mt-3 space-y-2">
              <div class="flex gap-2">
                <input
                  type="password"
                  v-model="keys[provider.id]"
                  :placeholder="`Enter your ${provider.fallbackName} API key`"
                  style="font-family: monospace"
                  class="border-border bg-background focus:border-ring focus:ring-ring flex-1 rounded border p-2 text-sm outline-none focus:ring-1"
                  @keydown.enter="save(provider.id)"
                />
                <button
                  @click="save(provider.id)"
                  class="text-primary/70 hover:text-primary cursor-pointer rounded px-3"
                  title="Save"
                >
                  <Save :size="16" />
                </button>
                <button
                  v-if="keys[provider.id]"
                  @click="clearKey(provider.id)"
                  class="cursor-pointer rounded px-3 text-red-500/70 hover:text-red-500"
                  title="Remove"
                >
                  <X :size="16" />
                </button>
              </div>
              <p class="text-muted-foreground text-xs">
                Env var on server:
                <code class="bg-muted rounded px-1 py-0.5">{{ provider.serverEnvKey }}</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, LogOut, Moon, Save, Settings2, Sun, User, X } from 'lucide-vue-next';
import { ref, onMounted, onUnmounted, reactive, computed, nextTick } from 'vue';
// @ts-ignore
import { toast } from 'vue-sonner';
import { useDark, useToggle } from '@vueuse/core';
import { PROVIDERS, type SupportedProviderId } from '~/shared/models/providers';

interface UserProfile {
  name: string;
  email: string;
}

const props = defineProps<{
  closeModal: () => void;
  setIsLoading: (isLoading: boolean) => void;
  /** When set, the matching provider's BYOK section is expanded & scrolled into view on mount. */
  initialProvider?: string | null;
}>();

const userProfile = ref<UserProfile>({ name: '', email: '' });
const userStore = useUserStore();

// ── BYOK key state, one entry per provider ──────────────────────────────────
const keys = reactive<Record<SupportedProviderId, string>>(
  PROVIDERS.reduce(
    (acc, p) => {
      acc[p.id] = '';
      return acc;
    },
    {} as Record<SupportedProviderId, string>
  )
);

const openProvider = ref<SupportedProviderId | null>(null);
const isOpen = (id: SupportedProviderId) => openProvider.value === id;
const toggle = (id: SupportedProviderId) => {
  openProvider.value = openProvider.value === id ? null : id;
};

const configuredCount = computed(() => PROVIDERS.filter(p => !!keys[p.id]?.trim()).length);

const save = (id: SupportedProviderId) => {
  const provider = PROVIDERS.find(p => p.id === id)!;
  const value = (keys[id] || '').trim();
  if (!value) {
    toast.error(`Enter a key for ${provider.fallbackName} first`);
    return;
  }
  localStorage.setItem(provider.byokStorageKey, value);
  // Notify other components (ModelSelector) to refresh availability.
  window.dispatchEvent(new Event('byok-updated'));
  toast.success(`${provider.fallbackName} API key saved`);
};

const clearKey = (id: SupportedProviderId) => {
  const provider = PROVIDERS.find(p => p.id === id)!;
  keys[id] = '';
  localStorage.removeItem(provider.byokStorageKey);
  window.dispatchEvent(new Event('byok-updated'));
  toast.success(`${provider.fallbackName} API key removed`);
};

const loadKeys = () => {
  for (const p of PROVIDERS) {
    keys[p.id] = localStorage.getItem(p.byokStorageKey) || '';
  }
  // Migrate legacy storage keys, one-time.
  const legacyMap: Array<{ legacy: string; target: SupportedProviderId }> = [
    { legacy: 'gemini-api-key', target: 'google' },
    { legacy: 'openrouter-api-key', target: 'openrouter' },
  ];
  for (const { legacy, target } of legacyMap) {
    const v = localStorage.getItem(legacy);
    if (v && !keys[target]) {
      keys[target] = v;
      const cfg = PROVIDERS.find(p => p.id === target)!;
      localStorage.setItem(cfg.byokStorageKey, v);
      localStorage.removeItem(legacy);
    }
  }
};

// ── Theme ────────────────────────────────────────────────────────────────────
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
});
const toggleDarkMode = useToggle(isDark);

// ── Lifecycle / keyboard ─────────────────────────────────────────────────────
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape') props.closeModal();
};

onMounted(() => {
  userProfile.value = {
    name: userStore.currentUser?.name || 'Anonymous User',
    email: userStore.currentUser?.email || 'No email provided',
  };
  loadKeys();
  window.addEventListener('keydown', handleKeyPress);

  // If the caller passed a target provider (e.g. opened from ModelSelector's
  // "Configure" CTA), expand its section and scroll it into view.
  if (props.initialProvider && PROVIDERS.some(p => p.id === props.initialProvider)) {
    openProvider.value = props.initialProvider as SupportedProviderId;
    nextTick(() => {
      document
        .getElementById(`byok-section-${props.initialProvider}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});

const deleteAllIndexDB = async () => {
  try {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
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
  await userStore.logOut();
  navigateTo('/auth');
};
</script>
