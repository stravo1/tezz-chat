import { useLocalStorage } from '@vueuse/core';

export const useModelStore = defineStore('model', {
  state: () => ({
    selectedModel: useLocalStorage('selected-model', 'gemini-3-flash-preview'),
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
