<template>
  <div
    class="message-actions flex items-center space-x-2"
    :class="{
      'mt-4': role === 'user' || role === 'data',
      'mt-2': role === 'assistant' || role === 'system',
    }"
  >
    <button
      v-if="isEditing && role === 'user'"
      @click="handleSave"
      class="action-button hover:bg-secondary-container rounded p-2"
      aria-label="Save changes"
      title="Save"
    >
      <Check :size="18" />
    </button>
    <button
      v-if="isEditing && role === 'user'"
      @click="handleDiscard"
      class="action-button hover:bg-secondary-container rounded p-2"
      aria-label="Cancel edit"
      title="Cancel"
    >
      <X :size="18" />
    </button>
    <button
      v-if="!isEditing"
      @click="handleCopy"
      class="action-button hover:bg-secondary-container rounded p-2"
      aria-label="Copy message"
      title="Copy"
    >
      <Copy v-if="!copied" :size="18" />
      <Check v-else :size="18" />
    </button>
    <button
      v-if="!isEditing && role !== 'user' && role !== 'data'"
      @click="handleBranch"
      class="action-button hover:bg-secondary-container rounded p-2"
      aria-label="Branch message"
      title="Branch"
    >
      <Split :size="18" />
    </button>
    <button
      v-if="!isEditing && (role === 'user' || role === 'data')"
      @click="handleEdit"
      class="action-button hover:bg-secondary-container rounded p-2"
      aria-label="Edit message"
      title="Edit"
    >
      <Edit3 :size="18" />
    </button>
    <button
      v-if="!isEditing"
      @click="handleRetry"
      class="action-button hover:bg-secondary-container rounded p-2"
      aria-label="Retry generation"
      title="Retry"
    >
      <RefreshCw :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Check, Copy, Cross, Edit3, RefreshCw, Split, Trash2, X } from 'lucide-vue-next';

const props = defineProps<{
  role: 'user' | 'data' | 'system' | 'assistant';
  messageId?: string;
  isEditing?: boolean;
  handleEdit?: () => void;
  handleCopy?: () => void;
  handleBranch?: () => void;
  handleRetry?: () => void;
  handleSave?: () => void;
  handleDiscard?: () => void;
}>();

const copied = ref(false);
// Define emits for actions if needed, e.g.,
// const emit = defineEmits(['copy', 'edit', 'retry', 'delete']);

const handleCopy = () => {
  console.log('Copy action triggered');
  props.handleCopy?.();
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
  // emit('copy');
};
</script>

<style scoped>
/* Scoped styles for the component */
.message-actions {
  /* Add any specific styling if Tailwind classes are not sufficient */
}
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}
</style>
