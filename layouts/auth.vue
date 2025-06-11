<template>
  <div v-if="layoutLoading" class="fixed inset-0 h-screen w-screen bg-white flex items-center justify-center">
    <LoaderCircle class="animate-spin" />
  </div>
  <div v-if="!layoutLoading" class="relative flex min-h-screen flex-col text-gray-800">
    <header class="absolute top-0 right-0 z-50 p-4">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="flex h-screen w-screen">
     <slot />
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
    router.push('/auth');
  }
});

const logout = async () => {
  console.log('Logging out...');
  await userStore.logOut();
  router.push('/auth');
};

</script>
