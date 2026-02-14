import { defineStore, setMapStoreSuffix } from 'pinia';
import type { UIMessage } from 'ai';

export const useMessageStore = defineStore('message', {
  state: () => ({
    messages: [] as UIMessage[],
    isLoading: false,
    isError: false,
    errorMessage: '',
    isStreaming: false,
    isBranched: false,
  }),
  actions: {
    setMessages(messages: UIMessage[]) {
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
