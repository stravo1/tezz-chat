import { useLocalStorage } from '@vueuse/core';
import { DEFAULT_MODEL_ID } from '~/shared/models/providers';

export const useModelStore = defineStore('model', {
  state: () => ({
    selectedModel: useLocalStorage('selected-model', DEFAULT_MODEL_ID),
  }),
  actions: {
    setSelectedModel(model: string) {
      this.selectedModel = model;
    },
    getSelectedModel() {
      return this.selectedModel;
    },
  },
});
