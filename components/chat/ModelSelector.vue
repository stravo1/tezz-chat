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

const props = defineProps<{
  setSelectedModel: (model: string) => void;
}>();

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
    title: 'Llama 3.3 8B',
    value: 'llama-3.3-8b',
  },
  {
    title: 'Qwen3 30B',
    value: 'qwen3-30b',
  },
];

const selectedModel = ref('gemini-2.0-flash-exp');
const selectedModelTitle = ref('Gemini 2.0 Flash Exp');
watch(selectedModel, newModel => {
  console.log('Selected model:', newModel);
  selectedModelTitle.value = models.find(model => model.value === newModel)?.title || '';
  props.setSelectedModel(newModel);
});

onMounted(() => {
  props.setSelectedModel(selectedModel.value);
});
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button class="max-w-20 overflow-hidden text-ellipsis whitespace-nowrap">
        {{ selectedModelTitle }}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <DropdownMenuLabel>Select Model</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup v-model="selectedModel">
        <DropdownMenuRadioItem
          v-for="model in models"
          :key="model.value"
          :value="model.value"
          class="cursor-pointer"
        >
          {{ model.title }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
