<script setup>
import { LoaderCircle } from 'lucide-vue-next';

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
  <div class="bg-inverse-surface flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md rounded-lg p-8 text-center">
      <!-- Loading spinner -->
      <div v-if="isLoading" class="mb-6 flex items-center justify-center">
        <LoaderCircle class="text-inverse-on-surface animate-spin" />
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
      <!-- <button @click="logout">Logout</button> -->
    </div>
  </div>
</template>
