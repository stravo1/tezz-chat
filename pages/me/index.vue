<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="userStore.isLoading" class="text-center">
      <p>Loading...</p>
    </div>

    <div v-else-if="userStore.isAuthenticated" class="mx-auto max-w-2xl">
      <div class="rounded-lg bg-white p-6 shadow">
        <h1 class="mb-6 text-2xl font-bold">My Profile</h1>

        <div class="space-y-4">
          <div class="flex items-center">
            <span class="w-24 font-medium">Name:</span>
            <span>{{ userStore.currentUser?.name }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-24 font-medium">Email:</span>
            <span>{{ userStore.currentUser?.email }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-24 font-medium">User ID:</span>
            <span>{{ userStore.currentUser?.id }}</span>
          </div>
        </div>

        <div class="mt-8">
          <button
            @click="handleLogout"
            class="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center">
      <p>Please login to view your profile</p>
      <NuxtLink to="/auth/" class="mt-2 inline-block text-blue-500 underline hover:text-blue-600">
        Go to Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';
definePageMeta({
  layout: 'auth',
});
const userStore = useUserStore();

const handleLogout = async () => {
  await userStore.logOut();
  navigateTo('/login');
};

// Check authentication status on page load
onMounted(() => {
  if (!userStore.isAuthChecked) {
    userStore.fetchUser();
  }
});
</script>
