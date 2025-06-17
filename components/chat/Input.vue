<script setup lang="ts">
import { ArrowUp, Image, Paperclip } from 'lucide-vue-next';
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
        <form
          @submit.prevent="handleSubmit"
          class="text-primary dark:bg-primary-container/[0.045] outline-tertiary/[0.05] relative flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/70 bg-[--chat-input-background] px-3 pt-3 pb-3 outline-8 backdrop-blur-lg max-sm:pb-6 sm:max-w-3xl dark:border-[hsl(0,0%,83%)]/[0.04]"
          style="
            box-shadow:
              rgba(0, 0, 0, 0.1) 0px 80px 50px 0px,
              rgba(0, 0, 0, 0.07) 0px 50px 30px 0px,
              rgba(0, 0, 0, 0.06) 0px 30px 15px 0px,
              rgba(0, 0, 0, 0.04) 0px 15px 8px,
              rgba(0, 0, 0, 0.04) 0px 6px 4px,
              rgba(0, 0, 0, 0.02) 0px 2px 2px;
          "
        >
          <div class="flex flex-grow flex-col">
            <div class="flex flex-grow flex-row items-start">
              <textarea
                ref="textarea"
                v-model="message"
                @keydown.enter.exact.prevent="handleSubmit"
                name="input"
                id="chat-input"
                placeholder="Type your message here..."
                class="text-on-secondary-container placeholder:text-secondary-foreground/60 max-h-[240px] min-h-[48px] w-full resize-none bg-transparent text-base leading-6 outline-none disabled:opacity-0"
                aria-label="Message input"
                aria-describedby="chat-input-description"
                autocomplete="off"
              ></textarea>
              <div id="chat-input-description" class="sr-only">
                Press Enter to send, Shift + Enter for new line
              </div>
            </div>
            <div class="mt-2 -mb-px flex w-full flex-row-reverse justify-between">
              <div
                class="-mt-0.5 -mr-0.5 flex items-center justify-center gap-2"
                aria-label="Message actions"
              >
                <button
                  @click="handlePrimaryAction"
                  class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border-reflect button-reflect dark:bg-primary/20 disabled:dark:hover:bg-primary/0 disabled:dark:active:bg-primary/0 bg-primary-container hover:bg-primary-container hover:text-on-primary-container relative inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg p-2 text-sm font-semibold whitespace-nowrap shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="message.trim() === '' && status != 'streaming'"
                  data-state="closed"
                >
                  <div v-if="status == 'streaming'" class="h-5 w-5 shrink-0 rounded bg-white"></div>
                  <ArrowUp v-else />
                </button>
              </div>
              <div class="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
                <div class="ml-[-7px] flex items-center gap-1">
                  <button
                    v-if="intentStore.selectedIntent != 'image'"
                    class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground relative -mb-2 inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                    type="button"
                    id="radix-:r8:"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    data-state="closed"
                  >
                    <ChatModelSelector class="flex items-center gap-1" />
                  </button>
                  <button
                    class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground -mb-1.5 inline-flex h-auto cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-1.5 pr-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-sm:p-2"
                    aria-label="Attaching files is a subscriber-only feature"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded="false"
                    aria-controls="radix-:rb:"
                    data-state="closed"
                    @click="fileInput && fileInput.click()"
                  >
                    <Paperclip :size="18" />
                  </button>
                  <button
                    class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground -mb-1.5 ml-3 flex h-auto cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed px-6 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-sm:p-2"
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
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
