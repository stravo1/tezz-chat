<template>
  <div class="bg-background text-foreground min-h-screen">
    <div class="container mx-auto max-w-4xl px-4 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/chat" class="hover:bg-secondary rounded-lg p-2 transition-colors">
            <ArrowLeft class="h-5 w-5" />
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold">Settings</h1>
            <p class="text-muted-foreground text-sm">Manage your API keys and custom models</p>
          </div>
        </div>
        <Button variant="outline" @click="toggleDarkMode()">
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>
      </div>

      <!-- Tabs -->
      <div class="mb-6 flex gap-2 border-b">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          "
        >
          <component :is="tab.icon" class="mr-2 inline-block h-4 w-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- API Keys Section -->
      <div v-if="activeTab === 'api-keys'" class="space-y-6">
        <div class="bg-secondary/30 rounded-lg border p-6">
          <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Key class="h-5 w-5" />
            API Keys
          </h2>
          <p class="text-muted-foreground mb-6 text-sm">
            Add your own API keys to use different AI providers. Your keys are stored locally in
            your browser and are never sent to our servers.
          </p>

          <div class="space-y-4">
            <!-- Gemini API Key -->
            <div class="bg-background rounded-lg border p-4">
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <GeminiIcon class="h-5 w-5" />
                  <span class="font-medium">Google Gemini</span>
                </div>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  class="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  Get API Key <ExternalLink class="h-3 w-3" />
                </a>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input
                    :type="showGeminiKey ? 'text' : 'password'"
                    v-model="geminiKey"
                    placeholder="Enter your Gemini API key"
                    class="border-border bg-background focus:border-ring focus:ring-ring w-full rounded border p-3 pr-10 font-mono text-sm outline-none focus:ring-1"
                  />
                  <button
                    @click="showGeminiKey = !showGeminiKey"
                    class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <Eye v-if="!showGeminiKey" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
                <Button @click="saveApiKey('gemini', geminiKey)" :disabled="!geminiKey">
                  <Save class="mr-2 h-4 w-4" /> Save
                </Button>
                <Button
                  variant="destructive"
                  @click="deleteApiKey('gemini')"
                  :disabled="!geminiKey"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- OpenRouter API Key -->
            <div class="bg-background rounded-lg border p-4">
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Sparkles class="h-5 w-5" />
                  <span class="font-medium">OpenRouter</span>
                </div>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  class="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  Get API Key <ExternalLink class="h-3 w-3" />
                </a>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input
                    :type="showOpenRouterKey ? 'text' : 'password'"
                    v-model="openRouterKey"
                    placeholder="Enter your OpenRouter API key"
                    class="border-border bg-background focus:border-ring focus:ring-ring w-full rounded border p-3 pr-10 font-mono text-sm outline-none focus:ring-1"
                  />
                  <button
                    @click="showOpenRouterKey = !showOpenRouterKey"
                    class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <Eye v-if="!showOpenRouterKey" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
                <Button @click="saveApiKey('openrouter', openRouterKey)" :disabled="!openRouterKey">
                  <Save class="mr-2 h-4 w-4" /> Save
                </Button>
                <Button
                  variant="destructive"
                  @click="deleteApiKey('openrouter')"
                  :disabled="!openRouterKey"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- OpenAI API Key -->
            <div class="bg-background rounded-lg border p-4">
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <OpenAIIcon class="h-5 w-5" />
                  <span class="font-medium">OpenAI</span>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  class="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  Get API Key <ExternalLink class="h-3 w-3" />
                </a>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input
                    :type="showOpenAIKey ? 'text' : 'password'"
                    v-model="openAIKey"
                    placeholder="Enter your OpenAI API key"
                    class="border-border bg-background focus:border-ring focus:ring-ring w-full rounded border p-3 pr-10 font-mono text-sm outline-none focus:ring-1"
                  />
                  <button
                    @click="showOpenAIKey = !showOpenAIKey"
                    class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <Eye v-if="!showOpenAIKey" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
                <Button @click="saveApiKey('openai', openAIKey)" :disabled="!openAIKey">
                  <Save class="mr-2 h-4 w-4" /> Save
                </Button>
                <Button
                  variant="destructive"
                  @click="deleteApiKey('openai')"
                  :disabled="!openAIKey"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- Anthropic API Key -->
            <div class="bg-background rounded-lg border p-4">
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Bot class="h-5 w-5" />
                  <span class="font-medium">Anthropic (Claude)</span>
                </div>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  class="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  Get API Key <ExternalLink class="h-3 w-3" />
                </a>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input
                    :type="showAnthropicKey ? 'text' : 'password'"
                    v-model="anthropicKey"
                    placeholder="Enter your Anthropic API key"
                    class="border-border bg-background focus:border-ring focus:ring-ring w-full rounded border p-3 pr-10 font-mono text-sm outline-none focus:ring-1"
                  />
                  <button
                    @click="showAnthropicKey = !showAnthropicKey"
                    class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <Eye v-if="!showAnthropicKey" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
                <Button @click="saveApiKey('anthropic', anthropicKey)" :disabled="!anthropicKey">
                  <Save class="mr-2 h-4 w-4" /> Save
                </Button>
                <Button
                  variant="destructive"
                  @click="deleteApiKey('anthropic')"
                  :disabled="!anthropicKey"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Models Section -->
      <div v-if="activeTab === 'custom-models'" class="space-y-6">
        <div class="bg-secondary/30 rounded-lg border p-6">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="flex items-center gap-2 text-lg font-semibold">
                <Cpu class="h-5 w-5" />
                Custom Models
              </h2>
              <p class="text-muted-foreground mt-1 text-sm">
                Add custom models from your preferred providers
              </p>
            </div>
            <Button @click="showAddModelDialog = true">
              <Plus class="mr-2 h-4 w-4" /> Add Model
            </Button>
          </div>

          <!-- Custom Models List -->
          <div v-if="customModels.length > 0" class="space-y-3">
            <div
              v-for="model in customModels"
              :key="model.id"
              class="bg-background flex items-center justify-between rounded-lg border p-4"
            >
              <div class="flex items-center gap-3">
                <component :is="getProviderIcon(model.provider)" class="h-6 w-6" />
                <div>
                  <p class="font-medium">{{ model.name }}</p>
                  <p class="text-muted-foreground text-xs">
                    {{ model.provider }} • {{ model.modelId }}
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="editModel(model)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" @click="deleteModel(model.id)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-muted-foreground flex flex-col items-center justify-center py-12 text-center"
          >
            <Cpu class="mb-4 h-12 w-12 opacity-50" />
            <p class="mb-2">No custom models added yet</p>
            <p class="text-sm">Click "Add Model" to add your first custom model</p>
          </div>
        </div>

        <!-- Provider Documentation -->
        <div class="bg-secondary/30 rounded-lg border p-6">
          <h3 class="mb-4 flex items-center gap-2 font-semibold">
            <Info class="h-5 w-5" />
            Model ID Reference
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="bg-background rounded-lg border p-4">
              <h4 class="mb-2 font-medium">OpenRouter</h4>
              <p class="text-muted-foreground mb-2 text-sm">
                Use the format: <code class="bg-secondary rounded px-1">provider/model-name</code>
              </p>
              <p class="text-muted-foreground text-xs">
                Examples: anthropic/claude-3-opus, openai/gpt-4-turbo
              </p>
            </div>
            <div class="bg-background rounded-lg border p-4">
              <h4 class="mb-2 font-medium">Google Gemini</h4>
              <p class="text-muted-foreground mb-2 text-sm">Use the model name directly</p>
              <p class="text-muted-foreground text-xs">
                Examples: gemini-1.5-pro, gemini-1.5-flash
              </p>
            </div>
            <div class="bg-background rounded-lg border p-4">
              <h4 class="mb-2 font-medium">OpenAI</h4>
              <p class="text-muted-foreground mb-2 text-sm">Use the model name directly</p>
              <p class="text-muted-foreground text-xs">Examples: gpt-4o, gpt-4-turbo, o1-preview</p>
            </div>
            <div class="bg-background rounded-lg border p-4">
              <h4 class="mb-2 font-medium">Anthropic</h4>
              <p class="text-muted-foreground mb-2 text-sm">Use the model name directly</p>
              <p class="text-muted-foreground text-xs">
                Examples: claude-3-5-sonnet-20241022, claude-3-opus-20240229
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Model Dialog -->
      <Dialog v-model:open="showAddModelDialog">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{{ editingModel ? 'Edit Model' : 'Add Custom Model' }}</DialogTitle>
            <DialogDescription>
              {{
                editingModel
                  ? 'Update your custom model configuration'
                  : 'Configure a new custom model from your provider'
              }}
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="model-name">Display Name</Label>
              <Input
                id="model-name"
                v-model="newModel.name"
                placeholder="My Custom Model"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <Label for="provider">Provider</Label>
              <select
                id="provider"
                v-model="newModel.provider"
                class="border-border bg-background focus:border-ring focus:ring-ring w-full rounded border p-3 text-sm outline-none focus:ring-1"
              >
                <option value="">Select a provider</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="model-id">Model ID</Label>
              <Input
                id="model-id"
                v-model="newModel.modelId"
                placeholder="e.g., gpt-4-turbo or anthropic/claude-3-opus"
                class="w-full"
              />
              <p class="text-muted-foreground text-xs">
                The exact model identifier used by the provider's API
              </p>
            </div>

            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                id="supports-tools"
                v-model="newModel.supportsTools"
                class="h-4 w-4"
              />
              <Label for="supports-tools" class="text-sm">Supports tool/function calling</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="closeModelDialog">Cancel</Button>
            <Button @click="saveModel" :disabled="!isModelValid">
              {{ editingModel ? 'Update' : 'Add' }} Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Bot,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Key,
  Moon,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-vue-next';
import { useDark, useToggle } from '@vueuse/core';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GeminiIcon from '~/assets/svg/gemini.vue';
import OpenAIIcon from '~/assets/svg/openai.vue';
import DeepseekIcon from '~/assets/svg/deepseek.vue';
import MistralIcon from '~/assets/svg/mistral.vue';

definePageMeta({
  layout: 'auth',
});

interface CustomModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'openai' | 'anthropic' | '';
  modelId: string;
  supportsTools: boolean;
}

const tabs = [
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'custom-models', label: 'Custom Models', icon: Cpu },
];

const activeTab = ref('api-keys');
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
});
const toggleDarkMode = useToggle(isDark);

// API Keys
const geminiKey = ref('');
const openRouterKey = ref('');
const openAIKey = ref('');
const anthropicKey = ref('');
const showGeminiKey = ref(false);
const showOpenRouterKey = ref(false);
const showOpenAIKey = ref(false);
const showAnthropicKey = ref(false);

// Custom Models
const customModels = ref<CustomModel[]>([]);
const showAddModelDialog = ref(false);
const editingModel = ref<CustomModel | null>(null);
const newModel = ref<Omit<CustomModel, 'id'>>({
  name: '',
  provider: '',
  modelId: '',
  supportsTools: false,
});

const isModelValid = computed(() => {
  return newModel.value.name && newModel.value.provider && newModel.value.modelId;
});

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'gemini':
      return GeminiIcon;
    case 'openai':
      return OpenAIIcon;
    case 'openrouter':
      return Sparkles;
    case 'anthropic':
      return Bot;
    default:
      return Cpu;
  }
};

const saveApiKey = (provider: string, key: string) => {
  if (!key) return;

  const keyMap: Record<string, string> = {
    gemini: 'gemini-api-key',
    openrouter: 'openrouter-api-key',
    openai: 'openai-api-key',
    anthropic: 'anthropic-api-key',
  };

  localStorage.setItem(keyMap[provider], key);
  toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved`);
};

const deleteApiKey = (provider: string) => {
  const keyMap: Record<string, string> = {
    gemini: 'gemini-api-key',
    openrouter: 'openrouter-api-key',
    openai: 'openai-api-key',
    anthropic: 'anthropic-api-key',
  };

  localStorage.removeItem(keyMap[provider]);

  switch (provider) {
    case 'gemini':
      geminiKey.value = '';
      break;
    case 'openrouter':
      openRouterKey.value = '';
      break;
    case 'openai':
      openAIKey.value = '';
      break;
    case 'anthropic':
      anthropicKey.value = '';
      break;
  }

  toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key deleted`);
};

const loadApiKeys = () => {
  geminiKey.value = localStorage.getItem('gemini-api-key') || '';
  openRouterKey.value = localStorage.getItem('openrouter-api-key') || '';
  openAIKey.value = localStorage.getItem('openai-api-key') || '';
  anthropicKey.value = localStorage.getItem('anthropic-api-key') || '';
};

const loadCustomModels = () => {
  const stored = localStorage.getItem('custom-models');
  if (stored) {
    try {
      customModels.value = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse custom models:', e);
      customModels.value = [];
    }
  }
};

const saveCustomModels = () => {
  localStorage.setItem('custom-models', JSON.stringify(customModels.value));
};

const saveModel = () => {
  if (!isModelValid.value) return;

  if (editingModel.value) {
    // Update existing model
    const index = customModels.value.findIndex(m => m.id === editingModel.value!.id);
    if (index !== -1) {
      customModels.value[index] = {
        ...newModel.value,
        id: editingModel.value.id,
      } as CustomModel;
    }
    toast.success('Model updated successfully');
  } else {
    // Add new model
    const model: CustomModel = {
      ...newModel.value,
      id: `custom-${Date.now()}`,
    } as CustomModel;
    customModels.value.push(model);
    toast.success('Model added successfully');
  }

  saveCustomModels();
  closeModelDialog();
};

const editModel = (model: CustomModel) => {
  editingModel.value = model;
  newModel.value = {
    name: model.name,
    provider: model.provider,
    modelId: model.modelId,
    supportsTools: model.supportsTools,
  };
  showAddModelDialog.value = true;
};

const deleteModel = (id: string) => {
  customModels.value = customModels.value.filter(m => m.id !== id);
  saveCustomModels();
  toast.success('Model deleted successfully');
};

const closeModelDialog = () => {
  showAddModelDialog.value = false;
  editingModel.value = null;
  newModel.value = {
    name: '',
    provider: '',
    modelId: '',
    supportsTools: false,
  };
};

onMounted(() => {
  loadApiKeys();
  loadCustomModels();
});
</script>
