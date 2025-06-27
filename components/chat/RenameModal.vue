<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

interface Props {
  isOpen: boolean;
  chatId: string;
  currentTitle: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [chatId: string, newTitle: string];
}>();

const newTitle = ref(props.currentTitle);
const inputRef = ref<HTMLInputElement>();

const handleSave = () => {
  if (newTitle.value.trim()) {
    emit('save', props.chatId, newTitle.value.trim());
    emit('close');
  }
};

const handleClose = () => {
  newTitle.value = props.currentTitle;
  emit('close');
};

const handleOpenChange = (open: boolean) => {
  if (!open) {
    handleClose();
  }
};

// Focus input when modal opens
const focusInput = () => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      inputRef.value.select();
    }
  });
};

// Watch for modal opening to focus input
watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      newTitle.value = props.currentTitle;
      focusInput();
    }
  }
);
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Rename Chat</DialogTitle>
        <DialogDescription> Enter a new name for this chat conversation. </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="title" class="text-right"> Name </Label>
          <Input
            id="title"
            ref="inputRef"
            v-model="newTitle"
            @keyup.enter="handleSave"
            @keyup.escape="handleClose"
            class="col-span-3"
            placeholder="Chat name..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="handleClose"> Cancel </Button>
        <Button type="button" @click="handleSave" :disabled="!newTitle.trim()"> Save </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
