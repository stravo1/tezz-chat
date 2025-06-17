<script lang="ts" setup>
import { ref } from 'vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  },
  {
    title: 'Gemini 2.5 Flash Preview 05-20',
    value: 'gemini-2.5-flash-preview-05-20',
  },
  {
    title: 'Deepseek Chat V3',
    value: 'deepseek-chat-v3',
  },
  {
    title: 'Qwen3 30B',
    value: 'qwen3-30b',
  },
  {
    title: 'Deepseek R1',
    value: 'deepseek-r1',
  },
  {
    title: 'Llama 4 Scout',
    value: 'llama-4-scout',
  },
];

const modelStore = useModelStore();

const selectedModel = ref('gemini-2.0-flash-exp');
const selectedModelTitle = ref('Gemini 2.0 Flash Exp');
watch(selectedModel, newModel => {
  console.log('Selected model:', newModel);
  selectedModelTitle.value = models.find(model => model.value === newModel)?.title || '';
  modelStore.selectedModel = newModel;
});

onMounted(() => {
  selectedModel.value = modelStore.selectedModel || 'gemini-2.0-flash-exp';
});
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        class="text-primary/70 hover:text-primary max-w-28 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {{ selectedModelTitle }}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent :align="'start'" class="mb-4 w-56">
      <DropdownMenuRadioGroup v-model="selectedModel">
        <DropdownMenuRadioItem
          v-for="model in models"
          :key="model.value"
          :value="model.value"
          class="cursor-pointer p-4"
          :class="{
            'bg-secondary/30 text-on-secondary-container': selectedModel === model.value,
          }"
        >
          {{ model.title }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
