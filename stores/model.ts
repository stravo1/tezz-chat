import { useLocalStorage } from '@vueuse/core';

export interface CustomModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'openai' | 'anthropic' | '';
  modelId: string;
  supportsTools: boolean;
}

export const useModelStore = defineStore('model', {
  state: () => ({
    selectedModel: useLocalStorage('selected-model', 'gemini-3-flash-preview'),
    customModels: useLocalStorage<CustomModel[]>('custom-models', []),
  }),
  getters: {
    getCustomModels(): CustomModel[] {
      return this.customModels;
    },
    isCustomModel(): boolean {
      return this.selectedModel.startsWith('custom-');
    },
    getCurrentCustomModel(): CustomModel | undefined {
      if (!this.selectedModel.startsWith('custom-')) return undefined;
      return this.customModels.find((m: CustomModel) => m.id === this.selectedModel);
    },
  },
  actions: {
    setSelectedModel(model: string) {
      this.selectedModel = model;
    },
    getSelectedModel() {
      return this.selectedModel;
    },
    addCustomModel(model: CustomModel) {
      this.customModels.push(model);
    },
    updateCustomModel(id: string, model: Partial<CustomModel>) {
      const index = this.customModels.findIndex((m: CustomModel) => m.id === id);
      if (index !== -1) {
        this.customModels[index] = { ...this.customModels[index], ...model };
      }
    },
    removeCustomModel(id: string) {
      this.customModels = this.customModels.filter((m: CustomModel) => m.id !== id);
      // Reset to default if the removed model was selected
      if (this.selectedModel === id) {
        this.selectedModel = 'gemini-3-flash-preview';
      }
    },
    loadCustomModels() {
      const stored = localStorage.getItem('custom-models');
      if (stored) {
        try {
          this.customModels = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse custom models:', e);
        }
      }
    },
  },
});
