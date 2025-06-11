<template>
  <div v-if="layoutLoading" class="fixed inset-0 h-screen w-screen bg-white flex items-center justify-center">
    <LoaderCircle class="animate-spin" />
  </div>
  <div v-if="!layoutLoading" class="relative flex min-h-screen flex-col text-gray-800">
    <header class="absolute top-0 right-0 z-50 p-4">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="flex h-screen w-screen">
      <div
        id="sidebar"
        class="flex w-[30vw] shrink-0 flex-col items-center justify-center gap-10 border"
      >
        <NuxtLink to="87839f3b-c33b-420d-869a-03ece8d80370"> one </NuxtLink>
        <NuxtLink to="a4970ed3-1dff-422a-bc11-d362bbe7d1c9"> two </NuxtLink>
      </div>
      <div
        id="chat-view"
        class="relative box-border flex w-[70vw] shrink-0 p-2 pb-15"
      >
        <NuxtPage />
      </div>
    </main>
  </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';
import { onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { LoaderCircle } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const { isAuthenticated, isAuthChecked, isLoading } = storeToRefs(userStore);
const layoutLoading = computed(() => isLoading.value || !isAuthChecked.value);

onMounted(async () => {
  if (!isAuthChecked.value) {
    await userStore.fetchUser();
  }
});

watch([isAuthenticated, isAuthChecked], ([authenticated, checked]) => {
  if (checked && !authenticated) {
    router.push('/login');
  }
});

const logout = async () => {
  console.log('Logging out...');
  await userStore.logOut();
  router.push('/login');
};

</script>
