<script setup>
const route = useRoute(); // Provides access to the current route's information (like query parameters).
const router = useRouter(); // Provides programmatic navigation methods.

const errorMessage = ref(null);
const isLoading = ref(false);

const { account } = useAppwrite();

onMounted(async () => {
  isLoading.value = true;
  const { userId, secret } = route.query;
  if (!userId || !secret) {
    errorMessage.value = 'Missing authentication parameters. Redirecting to signup.';
    console.error('OAuth callback error: Missing userId or secret.');
    await navigateTo('/auth');
    isLoading.value = false; // Ensure loading state is reset.
    return; // Exit the function.
  }

  try {
    const session = await account.createSession(userId, secret);
    console.log('Appwrite session created successfully:', session);
    console.log('Session established. Redirecting to account page.');
    await navigateTo('/chat');
  } catch (error) {
    errorMessage.value = `Authentication failed: ${error.message || 'An unknown error occurred.'}`;
    console.error('Error creating Appwrite session directly:', error);
    await navigateTo('/auth');
  } finally {
    isLoading.value = false;
  }
});

const logout = async () => {
  try {
    await account.deleteSession('current');
    console.log('Session deleted successfully.');
    await navigateTo('/auth');
  } catch (error) {
    console.error('Error deleting session:', error);
    errorMessage.value = `Logout failed: ${error.message || 'An unknown error occurred.'}`;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
      <h1 class="mb-4 text-3xl font-bold text-gray-800">Authenticating...</h1>
      <p class="mb-6 text-gray-600">Please wait while we set up your session.</p>

      <!-- Loading spinner -->
      <div v-if="isLoading" class="mb-6 flex items-center justify-center">
        <svg
          class="h-8 w-8 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>

      <!-- Error message display -->
      <div
        v-if="errorMessage"
        class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
        role="alert"
      >
        <strong class="font-bold">Error:</strong>
        <span class="ml-2 block sm:inline">{{ errorMessage }}</span>
      </div>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>
