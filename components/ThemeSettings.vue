<template>
  <div class="space-y-6">
    <!-- Theme API Configuration -->
    <div class="space-y-4">
      <!-- API Endpoint Input -->
      <div class="space-y-2">
        <label class="text-muted-foreground text-sm font-medium"> Theme URL </label>
        <div class="flex gap-2">
          <input
            v-model="apiEndpointInput"
            placeholder="https://tweakcn.com/r/themes/cyberpunk.json"
            style="font-family: monospace"
            class="border-border bg-background focus:border-ring focus:ring-ring flex-1 rounded border p-3 text-sm outline-none focus:ring-1"
          />
          <button
            @click="saveApiEndpoint"
            :disabled="!apiEndpointInput.trim() || isLoading"
            class="text-primary/70 hover:text-primary cursor-pointer rounded px-4 py-2 disabled:opacity-50"
          >
            <Save :size="16" />
          </button>
          <button
            v-if="hasCustomEndpoint"
            @click="clearEndpoint"
            class="text-destructive/70 hover:text-destructive cursor-pointer rounded px-4 py-2"
          >
            <Trash2 :size="16" />
          </button>
        </div>
        <p class="text-muted-foreground text-xs">
          Find or create your own theme at:
          <a
            href="https://tweakcn.com/editor/theme"
            class="underline"
            target="_blank"
            rel="noopener noreferrer"
            >tweakcn</a
          >
        </p>
      </div>

      <!-- Current Theme Info -->
      <!-- <div v-if="currentTheme" class="space-y-2">
        <label class="text-muted-foreground text-sm font-medium"> Current Theme </label>
        <div class="bg-muted rounded p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">{{ currentTheme.name }}</p>
            </div>
            <button
              @click="resetTheme"
              class="text-destructive/70 hover:text-destructive cursor-pointer rounded px-2 py-1"
            >
              <RotateCcw :size="16" />
            </button>
          </div>
        </div>
      </div> -->

      <!-- Error Display -->
      <div v-if="error" class="bg-destructive/10 border-destructive/20 rounded border p-3">
        <div class="flex items-center gap-2">
          <AlertCircle :size="16" class="text-destructive" />
          <p class="text-destructive text-sm">{{ error }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-muted-foreground my-2 flex items-center gap-2">
        <Loader2 :size="16" class="animate-spin" />
        <p class="text-sm">Loading theme...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Save, Trash2, Palette, Loader2, RotateCcw, AlertCircle } from 'lucide-vue-next';
// @ts-ignore
import { toast } from 'vue-sonner';

const {
  loadTheme,
  setApiEndpoint,
  getAvailableThemes,
  resetTheme: resetThemeStore,
  isLoading,
  error,
  hasCustomEndpoint,
  themeURL,
} = useTheme();

const apiEndpointInput = ref('');

const saveApiEndpoint = async () => {
  const endpoint = apiEndpointInput.value.trim();
  if (!endpoint) return;

  try {
    // Validate URL format
    new URL(endpoint);
    setApiEndpoint(endpoint);

    // Try to fetch available themes
    await getAvailableThemes();

    toast.success('API endpoint saved successfully');
  } catch (err) {
    toast.error('Invalid URL format');
  }
};

const clearEndpoint = () => {
  const themeStore = useThemeStore();
  themeStore.clearApiEndpoint();
  apiEndpointInput.value = '';
  toast.success('API endpoint cleared');
};

onMounted(() => {
  // Initialize with current API endpoint
  apiEndpointInput.value = themeURL.value;

  // Load available themes if endpoint is set
  if (hasCustomEndpoint.value) {
    getAvailableThemes();
  }
});
</script>
