<template>
  <div
    v-if="layoutLoading"
    class="bg-background text-foreground fixed inset-0 flex h-[100dvh] w-screen items-center justify-center"
  >
    <LoaderCircle class="animate-spin" />
  </div>
  <div v-if="!layoutLoading" class="relative flex min-h-[100dvh] flex-col">
    <main class="flex h-[100dvh] w-screen">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';
import { onMounted, computed, watch } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';

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
    navigateTo('/auth');
  }
});

const logout = async () => {
  console.log('Logging out...');
  await userStore.logOut();
  navigateTo('/auth');
};
</script>
