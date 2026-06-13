<script lang="ts" setup>
import { Check, KeyRound, Wrench, Paperclip, Brain } from 'lucide-vue-next';

interface CatalogModel {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
}

defineProps<{
  model: CatalogModel;
  selected: boolean;
  disabled: boolean;
  providerName: string;
}>();

const emit = defineEmits<{
  select: [];
  configure: [];
}>();

const onClick = (disabled: boolean) => {
  if (disabled) emit('configure');
  else emit('select');
};
</script>

<template>
  <button
    type="button"
    role="option"
    :aria-selected="selected"
    :data-disabled="disabled || undefined"
    :class="[
      'group flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
      selected ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/60 text-foreground',
      disabled && 'cursor-pointer opacity-50',
    ]"
    @click="onClick(disabled)"
  >
    <span class="min-w-0 flex-1 truncate">
      {{ model.name }}
    </span>

    <!-- Capability icons (subtle, with tooltips) -->
    <span class="text-muted-foreground flex shrink-0 items-center gap-1.5">
      <Wrench
        v-if="model.tool_call"
        class="h-3.5 w-3.5"
        :title="'Supports tool calls'"
        aria-label="Supports tool calls"
      />
      <Paperclip
        v-if="model.attachment"
        class="h-3.5 w-3.5"
        :title="'Supports file attachments'"
        aria-label="Supports file attachments"
      />
      <Brain
        v-if="model.reasoning"
        class="h-3.5 w-3.5"
        :title="'Reasoning model'"
        aria-label="Reasoning model"
      />
    </span>

    <KeyRound
      v-if="disabled"
      class="text-muted-foreground h-3.5 w-3.5 shrink-0"
      :title="`Add ${providerName} API key in Settings`"
      aria-label="API key required"
    />
    <Check v-else-if="selected" class="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
  </button>
</template>
