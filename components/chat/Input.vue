<script setup lang="ts">
import { ArrowUp, Paperclip } from 'lucide-vue-next';

const message = ref('');
const selectedModel = ref('gpt-3.5-turbo');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

const models = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5' },
  { id: 'gpt-4', name: 'GPT-4' },
];

const props = defineProps<{
  handleSubmit: (message: string, file?: File, model?: string) => Promise<void>;
}>();

const scrollToBottom = () => {
  document.getElementById('messages-container')?.scrollTo({
    top: +document.getElementById('messages-container')?.scrollHeight!,
    behavior: 'smooth',
  });
};

const handleSubmit = () => {
  if (message.value.trim() === '') return;
  props.handleSubmit(message.value, selectedFile.value || undefined, selectedModel.value);
  message.value = '';
  selectedFile.value = null;
  scrollToBottom();
  setTimeout(() => {
    scrollToBottom();
  }, 100); // Clear file input after a short delay
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    selectedFile.value = input.files[0];
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = '';
};
</script>

<template>
  <div class="absolute right-2 bottom-0 left-2 flex justify-center gap-2">
    <div class="w-full sm:max-w-3xl">
      <div v-if="selectedFile" class="flex items-center gap-2 rounded-lg bg-gray-100 p-2">
        <span class="text-sm">{{ selectedFile.name }}</span>
        <button @click="removeFile" class="text-red-500 hover:text-red-700">×</button>
      </div>

      <div class="flex w-full items-end gap-2">
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
            <div></div>
            <div class="flex flex-grow flex-row items-start">
              <textarea
                v-model="message"
                @keydown.enter.exact.prevent="handleSubmit"
                name="input"
                id="chat-input"
                placeholder="Type your message here..."
                class="text-on-secondary-container placeholder:text-secondary-foreground/60 w-full resize-none bg-transparent text-base leading-6 outline-none disabled:opacity-0"
                aria-label="Message input"
                aria-describedby="chat-input-description"
                autocomplete="off"
                style="height: 48px !important"
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
                  class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border-reflect button-reflect dark:bg-primary/20 disabled:dark:hover:bg-primary/20 disabled:dark:active:bg-primary/20 bg-primary-container hover:bg-primary-container hover:text-on-primary-container relative inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg p-2 text-sm font-semibold whitespace-nowrap text-pink-50 shadow transition-colors focus-visible:ring-1 focus-visible:outline-none active:bg-[rgb(162,59,103)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[rgb(162,59,103)] disabled:active:bg-[rgb(162,59,103)]"
                  type="submit"
                  :disabled="message.trim() === ''"
                  data-state="closed"
                >
                  <ArrowUp />
                </button>
              </div>
              <div class="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
                <div class="ml-[-7px] flex items-center gap-1">
                  <button
                    class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground relative -mb-2 inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                    type="button"
                    id="radix-:r8:"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    data-state="closed"
                  >
                    <div class="text-left text-sm font-medium">Gemini 2.5 Flash</div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-chevron-down right-0 size-4"
                    >
                      <path d="m6 9 6 6 6-6"></path>
                    </svg></button
                  ><button
                    class="focus-visible:ring-ring [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground -mb-1.5 inline-flex h-auto items-center justify-center gap-2 rounded-full px-2 py-1.5 pr-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-sm:p-2"
                    aria-label="Attaching files is a subscriber-only feature"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded="false"
                    aria-controls="radix-:rb:"
                    data-state="closed"
                  >
                    <Paperclip :size="18" />
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
