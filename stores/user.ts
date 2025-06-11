import { defineStore } from "pinia";

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

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    isAuthChecked: false,
    isLoading: true,
  }),

  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        // const res = await useFetch('/api/auth/sample');
        const data = await $fetch("/api/auth/oauth/session");

        if (data.isAuthenticated && data.user) {
          this.currentUser = {
            id: data.user.$id,
            email: data.user.email,
            name: data.user.name
          };
          this.isAuthenticated = true;
        } else {
          this.currentUser = null;
          this.isAuthenticated = false;
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        this.currentUser = null;
        this.isAuthenticated = false;
      } finally {
        this.isLoading = false;
        this.isAuthChecked = true;
      }
    },

    async logOut() {
      this.isLoading = true;
      try {
        await $fetch("/api/auth/oauth/logout", {
          method: "POST",
        });
        this.clearUser();
      } catch (error) {
        console.error("Error logging out:", error);
      } finally {
        this.isLoading = false;
      }
    },

    clearUser() {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAuthChecked = false;
    },
  },
});
