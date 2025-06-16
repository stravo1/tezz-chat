<template>
  <div
    class="bg-surface-container-highest relative flex flex-col items-center gap-2 rounded-lg p-2 pb-3"
  >
    <button
      @click="removeFile"
      class="text-on-surface/70 absolute top-0 right-0 cursor-pointer p-1"
    >
      <X :size="18" />
    </button>
    <div class="text-on-surface relative">
      <FileIcon v-if="!isUploading" :width="1" class="h-10 w-10" />
      <LoaderCircle v-else class="text-on-surface h-10 w-10 animate-spin"></LoaderCircle>
    </div>
    <span
      class="text-on-surface/70 max-w-20 overflow-hidden text-sm text-ellipsis whitespace-nowrap"
      >{{ file.name }}</span
    >
  </div>
</template>

<script setup lang="ts">
import { FileIcon, LoaderCircle, X } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  file: File;
  setUrl: (url: string) => void;
  removeFile: () => void;
}>();
const { uploadFile, uploadProgress, cancelTokenSource } = useFileUpload();
const isUploading = ref(false);
onMounted(async () => {
  try {
    // Start the file upload when the component is mounted
    isUploading.value = true;
    let res = await uploadFile(props.file);
    props.setUrl(res.data.url);
  } catch (error) {
    console.error('File upload failed:', error);
  } finally {
    isUploading.value = false;
  }
});
const progress = ref(10); // This should be updated with actual upload progress
const circumference = 62.83; // 2 * π * 10 (radius)
const dashOffset = computed(
  () => circumference - (uploadProgress.value.progress / 100) * circumference
);
</script>
