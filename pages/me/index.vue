<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="userStore.isLoading" class="text-center">
      <p>Loading...</p>
    </div>
    
    <div v-else-if="userStore.isAuthenticated" class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-bold mb-6">My Profile</h1>
        
        <div class="space-y-4">
          <div class="flex items-center">
            <span class="font-medium w-24">Name:</span>
            <span>{{ userStore.currentUser?.name }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="font-medium w-24">Email:</span>
            <span>{{ userStore.currentUser?.email }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="font-medium w-24">User ID:</span>
            <span>{{ userStore.currentUser?.id }}</span>
          </div>
        </div>

        <div class="mt-8">
          <button
            @click="handleLogout"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        <div class="mt-8">
          <button
            @click="getUser"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Get
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center">
      <p>Please login to view your profile</p>
      <NuxtLink
        to="/auth/"
        class="text-blue-500 hover:text-blue-600 underline mt-2 inline-block"
      >
        Go to Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';
definePageMeta({
  layout: "auth",
});
const userStore = useUserStore();
const router = useRouter();

const {account} = useAppwrite();
const handleLogout = async () => {
  await userStore.logOut();
  router.push('/login');
};
const getUser = async () => {
  try {
    console.log(await account.get())
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
};
// Check authentication status on page load
onMounted(() => {
  if (!userStore.isAuthChecked) {
    userStore.fetchUser();
  }
});

</script>
