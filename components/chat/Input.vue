<script setup lang="ts">
import { ArrowUp, Image, LoaderCircle, Paperclip } from 'lucide-vue-next';
import { useTextareaAutosize } from '@vueuse/core';
import type { UIMessage } from 'ai';
const { textarea, input: message } = useTextareaAutosize();
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const selectedFilesWithUrl = ref<UIMessage['experimental_attachments']>([]);

const props = defineProps<{
  handleSubmit: (
    message: string,
    attachments?: UIMessage['experimental_attachments'],
    selectedModel?: string
  ) => Promise<void>;
  status: string;
  stop: () => void;
}>();

const modelStore = useModelStore();
const intentStore = useIntentStore();

const handleToggleIntent = () => {
  intentStore.toggleIntent();
};

const scrollToBottom = () => {
  document.getElementById('messages-container')?.scrollTo({
    top: +document.getElementById('messages-container')?.scrollHeight!,
    behavior: 'smooth',
  });
};

const handleSubmit = () => {
  if (message.value.trim() === '') return;
  props.handleSubmit(message.value, selectedFilesWithUrl.value, modelStore.selectedModel);
  message.value = '';
  selectedFiles.value = [];
  selectedFilesWithUrl.value = [];
  scrollToBottom();
  setTimeout(() => {
    scrollToBottom();
  }, 100); // Clear file input after a short delay
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  // add all files
  if (input.files && input.files.length > 0) {
    selectedFiles.value = Array.from(input.files);
  } else {
    selectedFiles.value = [];
  }
  if (fileInput.value) fileInput.value.value = ''; // Clear the input field
};

const handleAddUrl = (name: string, url: string) => {
  if (!name || !url) return;
  for (const file of selectedFiles.value) {
    if (file.name === name) {
      for (const attachment of selectedFilesWithUrl.value!) {
        if (attachment.name === name) {
          attachment.url = url; // Update the URL if it already exists
          return;
        }
      }
      selectedFilesWithUrl.value!.push({
        url: url,
        name: name,
        contentType: file.type,
      });
    }
  }
};
const removeFile = (name: string) => {
  selectedFiles.value = selectedFiles.value.filter(file => file.name !== name);
  selectedFilesWithUrl.value = selectedFilesWithUrl.value!.filter(
    attachment => attachment.name !== name
  );
  // if (fileInput.value) fileInput.value.value = ''; // Clear the input field
};

const handlePrimaryAction = () => {
  if (props.status === 'streaming') {
    props.stop();
  } else {
    handleSubmit();
  }
};
</script>

<template>
  <div class="absolute right-2 bottom-0 left-2 flex justify-center gap-2">
    <div class="w-full sm:max-w-3xl">
      <div
        v-if="selectedFiles.length"
        class="bg-surface-container-low flex items-center gap-2 rounded-lg p-2 pb-3"
      >
        <ChatFileUpload
          v-for="selectedFile in selectedFiles"
          :file="selectedFile"
          :set-url="url => handleAddUrl(selectedFile.name, url)"
          :remove-file="() => removeFile(selectedFile.name)"
        />
      </div>
      <input
        type="file"
        class="hidden"
        name=""
        id="file-input"
        ref="fileInput"
        accept="image/*,application/pdf"
        multiple
        @change="handleFileSelect"
      />
      <div class="z-10 flex w-full items-end gap-2">
        <div
          class="border-input bg-background/80 dark:bg-input/70 mx-auto w-full max-w-2xl rounded-t-lg border-2 p-2 shadow-xs backdrop-blur-lg md:rounded-lg"
        >
          <form @submit.prevent="handleSubmit" class="flex w-full flex-col gap-2">
            <div class="flex flex-grow flex-col">
              <textarea
                ref="textarea"
                v-model="message"
                @keydown.enter.exact.prevent="handleSubmit"
                name="input"
                id="chat-input"
                placeholder="Ask me anything..."
                class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-foreground flex field-sizing-content max-h-[240px] min-h-[44px] w-full resize-none rounded-md border border-none bg-transparent px-3 py-2 text-base shadow-none transition-[color,box-shadow] outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                aria-label="Message input"
                aria-describedby="chat-input-description"
                autocomplete="off"
              ></textarea>
              <div id="chat-input-description" class="sr-only">
                Press Enter to send, Shift + Enter for new line
              </div>
            </div>
            <div class="flex items-center justify-between gap-2 pt-2">
              <div class="flex items-center gap-2">
                <button
                  v-if="intentStore.selectedIntent != 'image'"
                  class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 bg-secondary/70 inline-flex h-8 shrink-0 items-center justify-center gap-0.5 rounded-md px-1.5 py-2 text-xs font-normal whitespace-nowrap backdrop-blur-lg transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 min-[390px]:gap-2 min-[390px]:px-2 sm:text-sm md:rounded-md [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  type="button"
                  id="radix-:r8:"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  data-state="closed"
                >
                  <ChatModelSelector class="flex items-center gap-1" />
                </button>
                <button
                  class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 bg-secondary/70 text-foreground hover:bg-secondary/80 flex size-8 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap backdrop-blur-lg transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  aria-label="Attaching files is a subscriber-only feature"
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded="false"
                  aria-controls="radix-:rb:"
                  data-state="closed"
                  @click="fileInput && fileInput.click()"
                >
                  <Paperclip :size="18" class="-rotate-45" />
                </button>
                <button
                  :class="{
                    'text-primary border-dashed': intentStore.selectedIntent != 'image',
                    'text-primary-foreground bg-primary': intentStore.selectedIntent == 'image',
                  }"
                  class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border-primary hover:bg-primary/90 hover:border-primary/90 inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  aria-label="Attaching files is a subscriber-only feature"
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded="false"
                  aria-controls="radix-:rb:"
                  data-state="closed"
                  @click="handleToggleIntent"
                >
                  <Image :size="18" />
                </button>
              </div>
              <button
                @click="handlePrimaryAction"
                class="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90 inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                :disabled="message.trim() === '' && status != 'streaming'"
                data-state="closed"
                type="submit"
              >
                <LoaderCircle class="animate-spin" v-if="status == 'submitted'" />
                <div
                  v-else-if="status == 'streaming'"
                  class="h-5 w-5 shrink-0 rounded bg-white"
                ></div>
                <ArrowUp v-else />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
