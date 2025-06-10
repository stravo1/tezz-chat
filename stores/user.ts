import { defineStore } from 'pinia';

interface User {
  id: string;
  email: string;
  name: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthChecked: boolean;
  isLoading: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    isAuthChecked: false,
    isLoading: false,
  }),

  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        const { data } = await useFetch('/api/auth/session');
        
        if (data.value?.isAuthenticated && data.value?.user) {
          this.currentUser = data.value.user;
          this.isAuthenticated = true;
        } else {
          this.currentUser = null;
          this.isAuthenticated = false;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        this.currentUser = null;
        this.isAuthenticated = false;
      } finally {
        this.isLoading = false;
        this.isAuthChecked = true;
      }
    },

    clearUser() {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAuthChecked = false;
    },
  },
});
