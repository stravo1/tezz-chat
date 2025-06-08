import Session from 'supertokens-web-js/recipe/session';

export const useAuthGuard = () => {
  onMounted(async () => {
    try {
      if (!Session.doesSessionExist()) {
        console.log('No session found, redirecting to auth page');
        // navigateTo('/auth');
        return;
      }
      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Session.signOut();
      // navigateTo('/auth');
    }
  });

  return {
    checkSession: async () => {
      return Session.doesSessionExist();
    }
  };
};