<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
  Check,
  ChevronDown,
  KeyRound,
  Search,
  Wrench,
  Paperclip,
  Brain,
  Settings2,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverTrigger,
} from '@/components/ui/responsive-popover';
import { useMediaQuery } from '@vueuse/core';
import { DEFAULT_MODEL_ID } from '~/shared/models/providers';

// ─── Types matching /api/models response ─────────────────────────────────────

interface CatalogModel {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
}

interface CatalogProvider {
  id: string;
  name: string;
  modelCount: number;
}

interface ProviderConfigClient {
  id: string;
  sdk: string;
  byokStorageKey: string;
  byokHeader: string;
  fallbackName: string;
}

interface CatalogResponse {
  providers: CatalogProvider[];
  models: CatalogModel[];
  providerConfigs: ProviderConfigClient[];
  generatedAt: number;
}

// ─── Data fetch (lazy, deduped across instances) ─────────────────────────────

const { data: catalog, pending } = useLazyAsyncData<CatalogResponse | null>(
  'models-catalog',
  () => $fetch<CatalogResponse>('/api/models'),
  { default: () => null }
);

const providers = computed<CatalogProvider[]>(() => catalog.value?.providers ?? []);
const models = computed<CatalogModel[]>(() => catalog.value?.models ?? []);
const providerConfigs = computed<ProviderConfigClient[]>(
  () => catalog.value?.providerConfigs ?? []
);

// ─── BYOK availability (reactive over localStorage) ──────────────────────────

const byokAvailable = ref<Record<string, boolean>>({});

const refreshByokAvailability = () => {
  if (typeof window === 'undefined') return;
  const next: Record<string, boolean> = {};
  for (const cfg of providerConfigs.value) {
    const v = localStorage.getItem(cfg.byokStorageKey);
    next[cfg.id] = !!(v && v.trim());
  }
  byokAvailable.value = next;
};

watch(providerConfigs, refreshByokAvailability, { immediate: true });

const handleStorage = () => refreshByokAvailability();
onMounted(() => {
  refreshByokAvailability();
  window.addEventListener('storage', handleStorage);
  window.addEventListener('byok-updated', handleStorage);
});
onUnmounted(() => {
  window.removeEventListener('storage', handleStorage);
  window.removeEventListener('byok-updated', handleStorage);
});

// ─── State ───────────────────────────────────────────────────────────────────

const modelStore = useModelStore();
const isMobile = useMediaQuery('(max-width: 768px)');
const open = ref(false);
const search = ref('');
const activeProviderId = ref<string | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const selectedModel = ref(modelStore.selectedModel || DEFAULT_MODEL_ID);

const selectedModelObj = computed(() => models.value.find(m => m.id === selectedModel.value));

const selectedModelTitle = computed(() => {
  if (selectedModelObj.value) return selectedModelObj.value.name;
  const tail = (modelStore.selectedModel || DEFAULT_MODEL_ID).split('/').pop() || '';
  return tail;
});

const selectedProviderId = computed(() => selectedModelObj.value?.provider);

watch(selectedModel, (next, prev) => {
  if (!next || next === prev) return;
  modelStore.selectedModel = next;
});

onMounted(() => {
  selectedModel.value = modelStore.selectedModel || DEFAULT_MODEL_ID;
});

/**
 * One-shot migration: legacy or stale model IDs fall back to the default.
 */
watch(
  models,
  list => {
    if (!list.length) return;
    if (!list.some(m => m.id === selectedModel.value)) {
      console.warn(
        `[ModelSelector] persisted model "${selectedModel.value}" not in catalog; resetting.`
      );
      selectedModel.value = DEFAULT_MODEL_ID;
    }
  },
  { immediate: true }
);

// ─── Provider rail logic ─────────────────────────────────────────────────────

/**
 * Default-active provider when the menu opens:
 *   1. provider of the currently selected model
 *   2. first provider with a BYOK key configured
 *   3. first provider in the list
 */
const computeInitialProvider = (): string | null => {
  if (selectedProviderId.value) return selectedProviderId.value;
  const firstConfigured = providers.value.find(p => byokAvailable.value[p.id]);
  if (firstConfigured) return firstConfigured.id;
  return providers.value[0]?.id ?? null;
};

watch(open, isOpen => {
  if (isOpen) {
    // Reset on every open so the experience is contextual.
    activeProviderId.value = computeInitialProvider();
    search.value = '';
    nextTick(() => searchInputRef.value?.focus());
  }
});

// ─── Search + filtering ──────────────────────────────────────────────────────

const isSearching = computed(() => search.value.trim().length > 0);

const normalize = (s: string) => s.toLowerCase().replace(/[-_/\s]+/g, '');

const matchesSearch = (m: CatalogModel, providerName: string, q: string) => {
  if (!q) return true;
  const needle = normalize(q);
  return (
    normalize(m.name).includes(needle) ||
    normalize(m.id).includes(needle) ||
    normalize(providerName).includes(needle)
  );
};

const providerNameMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {};
  for (const p of providers.value) m[p.id] = p.name;
  return m;
});

/** Models for the currently-active provider (browse mode). */
const browseModeModels = computed<CatalogModel[]>(() => {
  if (!activeProviderId.value) return [];
  return models.value.filter(m => m.provider === activeProviderId.value);
});

/** Search results grouped by provider (search mode). */
const searchResults = computed<Array<{ provider: CatalogProvider; items: CatalogModel[] }>>(() => {
  const q = search.value.trim();
  if (!q) return [];
  const groups: Array<{ provider: CatalogProvider; items: CatalogModel[] }> = [];
  for (const p of providers.value) {
    const items = models.value.filter(m => m.provider === p.id && matchesSearch(m, p.name, q));
    if (items.length) groups.push({ provider: p, items });
  }
  return groups;
});

const totalSearchHits = computed(() =>
  searchResults.value.reduce((acc, g) => acc + g.items.length, 0)
);

// ─── Selection ───────────────────────────────────────────────────────────────

const isProviderEnabled = (providerId: string) => !!byokAvailable.value[providerId];
const isModelDisabled = (m: CatalogModel) => !isProviderEnabled(m.provider);

const handleModelSelect = (m: CatalogModel) => {
  if (isModelDisabled(m)) return;
  selectedModel.value = m.id;
  open.value = false;
};

const handleProviderClick = (providerId: string) => {
  activeProviderId.value = providerId;
  // If user was searching, clear it so they enter pure browse mode for the
  // provider they clicked.
  if (isSearching.value) search.value = '';
};

const openSettingsForProvider = (providerId: string) => {
  open.value = false;
  // Layout listens for this; it also opens the SettingsModal.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-settings', { detail: { providerId } }));
  }
};

// ─── Visual helpers ──────────────────────────────────────────────────────────

const logoUrl = (providerId: string) => `/api/model-logo/${providerId}`;

const activeProvider = computed(() => providers.value.find(p => p.id === activeProviderId.value));
</script>

<template>
  <ResponsivePopover v-model:open="open">
    <ResponsivePopoverTrigger as-child>
      <Button
        variant="ghost"
        :aria-expanded="open"
        class="h-8 gap-0.5 !px-1.5 text-xs font-normal backdrop-blur-lg min-[390px]:gap-2 min-[390px]:!px-2 sm:text-sm md:rounded-md"
      >
        <div class="flex items-center gap-2">
          <img
            v-if="selectedProviderId"
            :src="logoUrl(selectedProviderId)"
            :alt="selectedProviderId"
            class="h-4 w-4 shrink-0 dark:invert"
            loading="lazy"
          />
          <span class="max-w-40 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ selectedModelTitle }}
          </span>
        </div>
        <ChevronDown class="ml-auto h-4 w-4 opacity-60" />
      </Button>
    </ResponsivePopoverTrigger>

    <ResponsivePopoverContent
      :class="[
        'overflow-hidden p-0',
        // Two-pane on desktop; full width on mobile drawer.
        'md:w-[640px] md:rounded-lg md:border md:shadow-lg',
      ]"
      align="start"
      title="Select Model"
      description="Choose a model for your conversation"
    >
      <!-- ── Search bar (always visible) ─────────────────────────────── -->
      <div class="border-border flex items-center gap-2 border-b px-3 py-2">
        <Search class="text-muted-foreground h-4 w-4 shrink-0" />
        <input
          ref="searchInputRef"
          v-model="search"
          type="text"
          placeholder="Search all models…"
          class="placeholder:text-muted-foreground h-7 w-full bg-transparent text-sm outline-none"
          autocomplete="off"
        />
        <span v-if="isSearching" class="text-muted-foreground shrink-0 text-xs tabular-nums">
          {{ totalSearchHits }}
        </span>
      </div>

      <!-- ─── Loading skeleton ──────────────────────────────────────── -->
      <div v-if="pending && !models.length" class="flex h-72 items-center justify-center">
        <span class="text-muted-foreground text-sm">Loading models…</span>
      </div>

      <!-- ─── Search results (flat, grouped by provider) ────────────── -->
      <div v-else-if="isSearching" class="max-h-[60vh] overflow-y-auto md:max-h-[420px]">
        <div v-if="!searchResults.length" class="text-muted-foreground p-6 text-center text-sm">
          No models match "{{ search }}"
        </div>

        <div
          v-for="group in searchResults"
          :key="group.provider.id"
          class="border-border/60 border-b last:border-0"
        >
          <div
            class="bg-background/95 text-muted-foreground sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-medium backdrop-blur"
          >
            <img
              :src="logoUrl(group.provider.id)"
              :alt="group.provider.name"
              class="h-3.5 w-3.5 shrink-0 dark:invert"
              loading="lazy"
            />
            <span>{{ group.provider.name }}</span>
            <span class="ml-auto tabular-nums">{{ group.items.length }}</span>
          </div>
          <ChatModelSelectorItem
            v-for="model in group.items"
            :key="model.id"
            :model="model"
            :selected="selectedModel === model.id"
            :disabled="isModelDisabled(model)"
            :provider-name="group.provider.name"
            @select="handleModelSelect(model)"
            @configure="openSettingsForProvider(model.provider)"
          />
        </div>
      </div>

      <!-- ─── Browse mode: provider rail + models pane ──────────────── -->
      <div v-else class="flex md:h-[420px]">
        <!-- Mobile: horizontal chip row above models -->
        <div
          v-if="isMobile"
          class="border-border bg-background/80 sticky top-0 z-10 flex w-full flex-col"
        >
          <div class="border-b">
            <div class="scrollbar-thin flex gap-1 overflow-x-auto p-2">
              <button
                v-for="p in providers"
                :key="p.id"
                type="button"
                :class="[
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition',
                  activeProviderId === p.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                  !isProviderEnabled(p.id) && 'opacity-60',
                ]"
                @click="handleProviderClick(p.id)"
              >
                <img
                  :src="logoUrl(p.id)"
                  :alt="p.name"
                  class="h-3.5 w-3.5 shrink-0 dark:invert"
                  loading="lazy"
                />
                <span class="whitespace-nowrap">{{ p.name }}</span>
                <KeyRound v-if="!isProviderEnabled(p.id)" class="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="max-h-[60vh] overflow-y-auto">
            <div
              v-if="activeProvider && !isProviderEnabled(activeProvider.id)"
              class="border-border bg-muted/30 flex items-center justify-between gap-2 border-b px-3 py-2 text-xs"
            >
              <span class="text-muted-foreground">
                Add a {{ activeProvider.name }} API key to use these models.
              </span>
              <button
                type="button"
                class="text-primary whitespace-nowrap hover:underline"
                @click="openSettingsForProvider(activeProvider.id)"
              >
                Configure
              </button>
            </div>
            <ChatModelSelectorItem
              v-for="model in browseModeModels"
              :key="model.id"
              :model="model"
              :selected="selectedModel === model.id"
              :disabled="isModelDisabled(model)"
              :provider-name="activeProvider?.name ?? ''"
              @select="handleModelSelect(model)"
              @configure="openSettingsForProvider(model.provider)"
            />
            <div
              v-if="!browseModeModels.length"
              class="text-muted-foreground p-6 text-center text-sm"
            >
              No models available.
            </div>
          </div>
        </div>

        <!-- Desktop: left rail + right pane -->
        <template v-else>
          <div class="border-border bg-muted/20 w-[180px] shrink-0 overflow-y-auto border-r">
            <button
              v-for="p in providers"
              :key="p.id"
              type="button"
              :class="[
                'group flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left text-sm transition',
                activeProviderId === p.id
                  ? 'border-l-primary bg-background text-foreground'
                  : 'hover:bg-background/60 border-l-transparent',
                !isProviderEnabled(p.id) && 'text-muted-foreground',
              ]"
              @click="handleProviderClick(p.id)"
            >
              <img
                :src="logoUrl(p.id)"
                :alt="p.name"
                class="h-4 w-4 shrink-0 dark:invert"
                loading="lazy"
              />
              <span class="flex-1 truncate">{{ p.name }}</span>
              <span class="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                {{ p.modelCount }}
              </span>
              <KeyRound
                v-if="!isProviderEnabled(p.id)"
                class="text-muted-foreground h-3 w-3 shrink-0"
                :title="`No ${p.name} API key configured`"
              />
            </button>
          </div>

          <div class="flex flex-1 flex-col overflow-hidden">
            <div
              v-if="activeProvider && !isProviderEnabled(activeProvider.id)"
              class="bg-muted/30 border-border flex items-center justify-between gap-3 border-b px-3 py-2 text-xs"
            >
              <span class="text-muted-foreground">
                Add a <strong class="text-foreground">{{ activeProvider.name }}</strong>
                API key to enable these models.
              </span>
              <button
                type="button"
                class="text-primary inline-flex items-center gap-1 whitespace-nowrap hover:underline"
                @click="openSettingsForProvider(activeProvider.id)"
              >
                <Settings2 class="h-3 w-3" /> Configure
              </button>
            </div>
            <div class="flex-1 overflow-y-auto">
              <ChatModelSelectorItem
                v-for="model in browseModeModels"
                :key="model.id"
                :model="model"
                :selected="selectedModel === model.id"
                :disabled="isModelDisabled(model)"
                :provider-name="activeProvider?.name ?? ''"
                @select="handleModelSelect(model)"
                @configure="openSettingsForProvider(model.provider)"
              />
              <div
                v-if="!browseModeModels.length"
                class="text-muted-foreground p-6 text-center text-sm"
              >
                No models available.
              </div>
            </div>
          </div>
        </template>
      </div>
    </ResponsivePopoverContent>
  </ResponsivePopover>
</template>
