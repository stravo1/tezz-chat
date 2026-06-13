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
  isGuest: boolean;
  isTemporaryChat: boolean;
  jwtToken?: string; // Optional JWT token for authenticated requests
  lastJwtCreatedAt?: number; // Timestamp of the last JWT creation
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    isAuthChecked: false,
    isLoading: true,
    isGuest: false,
    isTemporaryChat: false,
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
          const isAnonymous = !data.email;
          this.currentUser = {
            id: data.$id,
            email: data.email,
            name: isAnonymous ? 'Guest' : data.name,
          };
          this.isAuthenticated = true;
          this.isGuest = isAnonymous;
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

    async createGuestSession() {
      this.isLoading = true;
      try {
        const { account } = useAppwrite();
        const session = await account.createAnonymousSession();
        this.currentUser = {
          id: session.userId,
          email: '',
          name: 'Guest',
        };
        this.isAuthenticated = true;
        this.isGuest = true;
        this.isAuthChecked = true;
      } catch (error) {
        console.error('Error creating guest session:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    toggleTemporaryChat() {
      this.isTemporaryChat = !this.isTemporaryChat;
    },

    async logOut() {
      this.isLoading = true;
      const { account } = useAppwrite();
      try {
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
      this.isGuest = false;
      this.isTemporaryChat = false;
      this.jwtToken = undefined;
      this.lastJwtCreatedAt = undefined;
    },
  },
});
