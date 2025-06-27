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
import meta from '../../assets/svg/meta.vue';
import qwen from '../../assets/svg/qwen.vue';
import deepseek from '../../assets/svg/deepseek.vue';
import { useMediaQuery } from '@vueuse/core';

export type ModelType =
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.5-flash-preview-05-20'
  | 'deepseek-chat-v3'
  | 'deepseek-r1'
  | 'llama-4-scout'
  | 'qwen3-30b';

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
    title: 'Llama 4 Scout',
    value: 'llama-4-scout',
    icon: meta,
  },
];

const modelStore = useModelStore();
const isMobile = useMediaQuery('(max-width: 768px)');
const selectedModel = ref('gemini-2.0-flash-exp');
const selectedModelTitle = ref('Gemini 2.0 Flash Exp');
const open = ref(false);

watch(selectedModel, newModel => {
  console.log('Selected model:', newModel);
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
