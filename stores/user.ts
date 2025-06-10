import type { Models } from "appwrite";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    currentUser: null as Models.User<Models.Preferences> | null,
    isAuthChecked: false, // Flag to indicate if auth check has run
    isLoading: true, // For initial loading state
  }),
  actions: {
    async fetchUser() {
      if (this.isAuthChecked && this.currentUser) {
        // Already checked and user exists, no need to re-fetch
        return this.currentUser;
      }

      this.isLoading = true; // Set loading to true before fetching
      const { account } = useAppwrite(); // Get the Appwrite account instance
      if (!account) {
        console.error("Appwrite account instance is not available.");
        this.isLoading = false; // Set loading to false if account is not available
        return null;
      }
      try {
        const user = await account.get();
        this.currentUser = user;
        return user;
      } catch (error) {
        this.currentUser = null;
        console.warn("User not authenticated or session expired:", error);
      } finally {
        this.isAuthChecked = true; // Mark as checked
        this.isLoading = false; // Set loading to false after check
      }
    },
    setUser(user: any) {
      this.currentUser = user;
      this.isAuthChecked = true;
      this.isLoading = false;
    },
    clearUser() {
      this.currentUser = null;
      this.isAuthChecked = true;
      this.isLoading = false;
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.currentUser,
  },
});
