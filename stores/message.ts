import { defineStore, setMapStoreSuffix } from 'pinia';
import type { AppUIMessage } from '~/shared/types/ui-message';

export const useMessageStore = defineStore('message', {
  state: () => ({
    messages: [] as AppUIMessage[],
    isLoading: false,
    isError: false,
    errorMessage: '',
    isStreaming: false,
    isBranched: false,
  }),
  actions: {
    setMessages(messages: AppUIMessage[]) {
      this.messages = messages;
    },
    clearMessages() {
      this.messages = [];
    },
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },
    setError(error: boolean, message: string = '') {
      this.isError = error;
      this.errorMessage = message;
    },
    setStreaming(streaming: boolean) {
      this.isStreaming = streaming;
    },
    setBranched(branched: boolean) {
      this.isBranched = branched;
    },
  },
});
