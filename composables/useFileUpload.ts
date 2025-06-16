import axios, { type CancelTokenSource } from 'axios';
import { ref } from 'vue';

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

export const useFileUpload = () => {
  const userStore = useUserStore();
  const uploadProgress = ref<UploadProgress>({
    progress: 0,
    loaded: 0,
    total: 0,
  });
  let cancelTokenSource: CancelTokenSource | null = null;
  const uploadFile = async (file: File, onProgress?: (progress: UploadProgress) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer ' + (await userStore.getJWT()),
        },
        onUploadProgress: progressEvent => {
          const total = progressEvent.total || 0;
          const loaded = progressEvent.loaded || 0;
          const progress = Math.round((loaded * 100) / total);

          const progressData = {
            progress,
            loaded,
            total,
          };
          uploadProgress.value = progressData;
          onProgress?.(progressData);
        },
      });

      console.log('File uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Upload cancelled');
        throw new Error('Upload cancelled');
      }
      if (axios.isAxiosError(error)) {
        console.error('Upload error:', error.response?.data || error.message);
        throw error.response?.data || error;
      }
      throw error;
    }
  };
  const cancelUpload = () => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel('Upload cancelled by user');
      cancelTokenSource = null;
    }
  };

  return {
    uploadFile,
    uploadProgress,
    cancelTokenSource,
  };
};
