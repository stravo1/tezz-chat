import { defineStore } from 'pinia';

interface User {
  id: string;
  email: string;
  name: string;
  deviceId?: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthChecked: boolean;
  isLoading: boolean;
  jwtToken?: string; // Optional JWT token for authenticated requests
  lastJwtCreatedAt?: number; // Timestamp of the last JWT creation
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    isAuthChecked: false,
    isLoading: true,
    jwtToken: undefined, // Initialize as undefined
    lastJwtCreatedAt: undefined, // Initialize as undefined
  }),

  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        // const res = await useFetch('/api/auth/sample');
        const data = await useAppwrite().account.get();

        if (data.$id) {
          this.currentUser = {
            id: data.$id,
            email: data.email,
            name: data.name,
          };
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

    async logOut() {
      this.isLoading = true;
      const { account } = useAppwrite();
      try {
        // try {
        //   await $fetch('/api/auth/oauth/logout', {
        //     method: 'POST',
        //   });
        // } catch (error) {
        //   console.error('Error during OAuth logout:', error);
        // }
        await account.deleteSession('current');
        console.log('Session deleted successfully.');
        this.clearUser();
      } catch (error) {
        console.error('Error logging out:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async getJWT() {
      if (
        this.jwtToken &&
        this.lastJwtCreatedAt &&
        Date.now() - this.lastJwtCreatedAt < 13 * 60 * 1000
      ) {
        console.log('Using cached JWT token');
        // Return cached token if it's still valid (~15 min)
        return this.jwtToken;
      }

      try {
        console.log('Fetching new JWT token');
        const { account } = useAppwrite();
        this.jwtToken = (await account.createJWT()).jwt;
        this.lastJwtCreatedAt = Date.now();
        return this.jwtToken;
      } catch (error) {
        console.error('Error fetching JWT:', error);
        throw error; // Re-throw to handle it in the component
      }
    },

    clearUser() {
      this.currentUser = null;
      this.isAuthenticated = false;
    },
  },
});
