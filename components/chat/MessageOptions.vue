<template>
  <div
    class="message-actions flex items-center space-x-2"
    :class="{
      'mt-4': role === 'user' || role === 'data',
      'mt-2': role === 'assistant' || role === 'system',
    }"
  >
    <TooltipProvider>
      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="isEditing && role === 'user'"
            @click="handleSave"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <Check class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Save</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="isEditing && role === 'user'"
            @click="handleDiscard"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <X class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Cancel</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="!isEditing"
            @click="handleCopy"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <Copy v-if="!copied" class="h-3.5 w-3.5" />
            <Check v-else class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Copy</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="!isEditing && role !== 'user' && role !== 'data'"
            @click="handleBranch"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <Split class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Branch</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="!isEditing && (role === 'user' || role === 'data')"
            @click="handleEdit"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <Edit3 class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Edit</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="!isEditing"
            @click="handleRetry"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <RefreshCw class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Retry</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip :delayDuration="150">
        <TooltipTrigger asChild>
          <Button
            v-if="!isEditing && role === 'assistant'"
            @click="handlePrint"
            variant="ghost"
            size="icon"
            class="border-border/70 text-foreground hover:!bg-accent h-7 w-7 cursor-pointer border shadow-md backdrop-blur-sm"
          >
            <Download class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Save</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { Check, Copy, Download, Edit3, RefreshCw, Split, X } from 'lucide-vue-next';
import Tooltip from '../ui/tooltip/Tooltip.vue';
import TooltipTrigger from '../ui/tooltip/TooltipTrigger.vue';
import Button from '../ui/button/Button.vue';
import TooltipContent from '../ui/tooltip/TooltipContent.vue';
import TooltipProvider from '../ui/tooltip/TooltipProvider.vue';

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
  handlePrint?: () => void;
}>();

const copied = ref(false);

const handleCopy = () => {
  console.log('Copy action triggered');
  props.handleCopy?.();
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
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
