<script lang="ts" setup>
import { ref } from 'vue';
import { Check, ChevronDown } from 'lucide-vue-next';
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

import { useMediaQuery } from '@vueuse/core';

const models = [
  {
    title: 'Gemini 2.0 Flash Exp',
    value: 'gemini-2.0-flash-exp',
    icon: gemini,
  },
  {
    title: 'Gemini 2.5 Flash Preview 05-20',
    value: 'gemini-2.5-flash-preview-05-20',
    icon: gemini,
  },
  {
    title: 'MoonshotAI Kimi K2',
    value: 'kimi-k2',
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
    title: 'Deepseek R1',
    value: 'deepseek-r1',
    icon: deepseek,
  },
  {
    title: 'Qwen3 30B',
    value: 'qwen3-30b',
    icon: qwen,
  },
  {
    title: 'Qwen3 Coder',
    value: 'qwen3-coder',
    icon: qwen,
  },
  {
    title: 'Z.AI GLM 4.5 Air',
    value: 'glm-4.5-air',
    icon: zai,
  },
];

const modelStore = useModelStore();
const isMobile = useMediaQuery('(max-width: 768px)');
const selectedModel = ref('gemini-2.0-flash-exp');
const selectedModelTitle = ref('Gemini 2.0 Flash Exp');
const open = ref(false);

watch(selectedModel, (newModel, oldModel) => {
  console.log('Selected model:', newModel);
  if (oldModel === newModel) return;
  if (!newModel) {
    selectedModel.value = oldModel;
    return;
  }
  selectedModelTitle.value = models.find(model => model.value === newModel)?.title || '';
  modelStore.selectedModel = newModel;
});

onMounted(() => {
  selectedModel.value = modelStore.selectedModel || 'gemini-2.0-flash-exp';
});

const handleModelSelect = (modelValue: string) => {
  selectedModel.value = modelValue;
  open.value = false;
};
</script>

<template>
  <ResponsivePopover v-model:open="open">
    <ResponsivePopoverTrigger as-child>
      <Button
        variant="ghost"
        :aria-expanded="open"
        class="bg-secondary/70 h-8 gap-0.5 !px-1.5 text-xs font-normal backdrop-blur-lg min-[390px]:gap-2 min-[390px]:!px-2 sm:text-sm md:rounded-md"
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
          <CommandGroup>
            <CommandItem
              v-for="model in models"
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
        </CommandList>
      </Command>
    </ResponsivePopoverContent>
  </ResponsivePopover>
</template>
