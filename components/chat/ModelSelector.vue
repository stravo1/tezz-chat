<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Check, ChevronDown, Settings } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverTrigger,
} from '@/components/ui/responsive-popover';
import gemini from '../../assets/svg/gemini.vue';
import qwen from '../../assets/svg/qwen.vue';
import deepseek from '../../assets/svg/deepseek.vue';
import mistral from '../../assets/svg/mistral.vue';
import moonshot from '~/assets/svg/moonshot.vue';
import zai from '~/assets/svg/zai.vue';
import openai from '~/assets/svg/openai.vue';
import meta from '~/assets/svg/meta.vue';
import type { CustomModel } from '~/stores/model';

import { useMediaQuery } from '@vueuse/core';

const builtInModels = [
  {
    title: 'Gemini 3 Flash Preview',
    value: 'gemini-3-flash-preview',
    icon: gemini,
  },
  {
    title: 'Gemini 2.5 Flash',
    value: 'gemini-2.5-flash',
    icon: gemini,
  },
  {
    title: 'Claude Haiku 4.5',
    value: 'claude-haiku-4-5-anannas',
    // need to change the icon
    icon: moonshot,
  },
  {
    title: 'MoonshotAI Kimi K2 Thinking',
    value: 'kimi-thinking',
    icon: moonshot,
  },
  {
    title: 'Devstral Small',
    value: 'devstral-small',
    icon: mistral,
  },
  {
    title: 'Mistral Small',
    value: 'mistral-small',
    icon: mistral,
  },
  {
    title: 'Deepseek Chat V3',
    value: 'deepseek-chat-v3',
    icon: deepseek,
  },
  {
    title: 'Qwen3 32B',
    value: 'qwen3-32b',
    icon: qwen,
  },
  {
    title: 'Qwen3 Coder',
    value: 'qwen3-coder',
    icon: qwen,
  },
  {
    title: 'Llama 4 Maverick',
    value: 'llama-4-maverick',
    icon: meta,
  },
  {
    title: 'Grok 4 Fast',
    value: 'grok-4-fast',
    icon: meta,
  },
  {
    title: 'Z.AI GLM 4.5 Air',
    value: 'glm-4.5-air',
    icon: zai,
  },
];

// Icon mapping for custom model providers
const providerIcons: Record<string, any> = {
  gemini: gemini,
  openrouter: deepseek, // Using deepseek as a placeholder for openrouter
  openai: openai,
  anthropic: moonshot, // Using moonshot as placeholder for anthropic
};

const modelStore = useModelStore();
const isMobile = useMediaQuery('(max-width: 768px)');
const selectedModel = ref('gemini-3-flash-preview');
const selectedModelTitle = ref('Gemini 3.0 Flash Preview');
const open = ref(false);

// Computed property to get all models (built-in + custom)
const allModels = computed(() => {
  const customModels = modelStore.customModels.map((model: CustomModel) => ({
    title: model.name,
    value: model.id,
    icon: providerIcons[model.provider] || openai,
    isCustom: true,
  }));
  return [...builtInModels, ...customModels];
});

// Check if there are any custom models
const hasCustomModels = computed(() => modelStore.customModels.length > 0);

watch(selectedModel, (newModel, oldModel) => {
  console.log('Selected model:', newModel);
  if (oldModel === newModel) return;
  if (!newModel) {
    selectedModel.value = oldModel;
    return;
  }
  selectedModelTitle.value = allModels.value.find(model => model.value === newModel)?.title || '';
  modelStore.selectedModel = newModel;
});

onMounted(() => {
  selectedModel.value = modelStore.selectedModel || 'gemini-3-flash-preview';
  selectedModelTitle.value =
    allModels.value.find(model => model.value === selectedModel.value)?.title ||
    'Gemini 3 Flash Preview';
});

const handleModelSelect = (modelValue: string) => {
  selectedModel.value = modelValue;
  open.value = false;
};

const goToSettings = () => {
  navigateTo('/settings');
};
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
          <span class="max-w-28 overflow-hidden text-ellipsis whitespace-nowrap">
            {{ selectedModelTitle }}
          </span>
        </div>
        <ChevronDown class="ml-auto h-4 w-4" />
      </Button>
    </ResponsivePopoverTrigger>
    <ResponsivePopoverContent
      class="w-56 p-0"
      align="start"
      title="Select Model"
      description="Choose a model for your conversation"
    >
      <Command v-model="selectedModel">
        <CommandInput v-if="!isMobile" placeholder="Search models..." class="h-8" />
        <CommandList>
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup heading="Built-in Models">
            <CommandItem
              v-for="model in builtInModels"
              :key="model.value"
              :value="model.value"
              @select="handleModelSelect(model.value)"
              class="flex cursor-pointer items-center gap-2"
            >
              <component :is="model.icon" class="h-5 w-5" />
              <span>{{ model.title }}</span>
              <Check v-if="selectedModel === model.value" class="ml-auto h-4 w-4" />
            </CommandItem>
          </CommandGroup>
          <CommandGroup v-if="hasCustomModels" heading="Custom Models">
            <CommandItem
              v-for="model in modelStore.customModels"
              :key="model.id"
              :value="model.id"
              @select="handleModelSelect(model.id)"
              class="flex cursor-pointer items-center gap-2"
            >
              <component :is="providerIcons[model.provider] || openai" class="h-5 w-5" />
              <span>{{ model.name }}</span>
              <Check v-if="selectedModel === model.id" class="ml-auto h-4 w-4" />
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Settings">
            <CommandItem
              value="__settings__"
              @select="goToSettings"
              class="flex cursor-pointer items-center gap-2"
            >
              <Settings class="h-5 w-5" />
              <span>Manage Models & API Keys</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsivePopoverContent>
  </ResponsivePopover>
</template>
