import { useLocalStorage } from '@vueuse/core';

export const useIntentStore = defineStore('intent', {
  state: () => ({
    selectedIntent: useLocalStorage('selected-intent', 'text'),
  }),
  actions: {
    setSelectedIntent(intent: string) {
      this.selectedIntent = intent;
    },
    getSelectedIntent() {
      return this.selectedIntent;
    },
    toggleIntent() {
      if (this.selectedIntent === 'text') {
        this.selectedIntent = 'image';
      } else {
        this.selectedIntent = 'text';
      }
    },
  },
});
