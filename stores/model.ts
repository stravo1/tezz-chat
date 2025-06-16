import { useLocalStorage } from '@vueuse/core';

export const useModelStore = defineStore('model', {
  state: () => ({
    selectedModel: useLocalStorage('selected-model', 'gemini-2.0-flash-exp'),
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
