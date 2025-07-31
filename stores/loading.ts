export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false as boolean,
    loadingMessage: '' as string,
  }),
  actions: {
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },
    setLoadingMessage(message: string) {
      this.loadingMessage = message;
    },
  },
});
