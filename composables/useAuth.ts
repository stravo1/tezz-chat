import { OAuthProvider } from "appwrite";
import { useUserStore } from "~/stores/user"; // Import the user store

export default function useAuth() {
  const userStore = useUserStore();

  const checkAuthStatus = async () => {
    // This action directly uses the Appwrite SDK internally in the store
    await userStore.fetchUser();
    return userStore.isAuthenticated;
  };

  // Login and logout methods would still be here, and they would update the store
  const { account } = useAppwrite(); // To get the account instance for login/logout

  const login = async () => {
    if (!account) {
      console.error("Appwrite account instance is not available.");
      throw new Error("Appwrite account instance is not available.");
    }
    try {
      const session = account.createOAuth2Session(
        OAuthProvider.Github, // provider
        "http://localhost:3000/chat", // redirect here on success
        "http://localhost:3000/chat", // redirect here on failure
        ["user"], // scopes (optional)
      );
      return session;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!account) {
        console.error("Appwrite account instance is not available.");
        throw new Error("Appwrite account instance is not available.");
      }
      await account.deleteSession("current");
      userStore.clearUser(); // Clear user from store after logout
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return {
    currentUser: computed(() => userStore.currentUser), // Expose reactive user
    isAuthenticated: computed(() => userStore.isAuthenticated), // Expose reactive auth status
    isAuthChecked: computed(() => userStore.isAuthChecked), // Expose check status
    isLoadingAuth: computed(() => userStore.isLoading), // Expose loading status
    checkAuthStatus,
    login,
    logout,
  };
}
