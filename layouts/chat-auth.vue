<template>
  <div
    v-if="layoutLoading"
    class="fixed inset-0 flex h-screen w-screen items-center justify-center bg-white"
  >
    <LoaderCircle class="animate-spin" />
  </div>
  <div
    v-if="!layoutLoading"
    class="relative flex min-h-screen flex-col text-gray-800"
  >
    <header class="absolute top-0 right-0 z-50 p-4">
      <button @click="logout" class="cursor-pointer">Logout</button>
    </header>
    <main class="flex h-screen w-screen">
      <div
        id="sidebar"
        class="flex h-full w-[30vw] shrink-0 flex-col items-center justify-center gap-10 border"
      >
        <h1 class="text-2xl font-bold">Chat Threads</h1>
        <div class="h-[80vh] w-full max-w-md overflow-y-auto">
          <div class="flex flex-col items-center gap-4">
            <div v-for="chat in arrayOfChats" :key="chat.id" class="w-full">
              <NuxtLink
                :to="`/chat/${chat.id}`"
                class="block w-full rounded-lg p-2 text-center hover:bg-gray-200 transition-all"
              >
                {{ chat.title }}
              </NuxtLink>
            </div>
          </div>
        </div>
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

<script setup lang="ts">
import { useUserStore } from "~/stores/user";
import { storeToRefs } from "pinia";
import { onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { LoaderCircle } from "lucide-vue-next";
import { getThreads } from "~/utils/database/queries";
import type { isRxDocument, RxDocument, RxQuery } from "rxdb";

const router = useRouter();
const userStore = useUserStore();
const { isAuthenticated, isAuthChecked, isLoading } = storeToRefs(userStore);
const layoutLoading = computed(() => isLoading.value || !isAuthChecked.value);

const arrayOfChats = ref([] as { id: string; title: string }[]);

onMounted(async () => {
  if (!isAuthChecked.value) {
    await userStore.fetchUser();
  }
  let threads = await (await getThreads()).exec();
  if (threads.length === 0) {
    console.log("No threads found, redirecting to create thread page");
  } else {
    console.log("Threads found:", threads);
    threads.forEach((thread: RxDocument) => {
      arrayOfChats.value.push({
        id: thread.get("id"),
        title: thread.get("title") || "No summary available",
      });
    });
  }
  let threadSubscription = (await getThreads() as RxQuery).$.subscribe((threads) => {
    console.log("Threads updated:", threads);
    arrayOfChats.value = threads.map((thread: RxDocument) => ({
      id: thread.get("id"),
      title: thread.get("title") || "No summary available",
    }));
  });
});

watch([isAuthenticated, isAuthChecked], ([authenticated, checked]) => {
  if (checked && !authenticated) {
    router.push("/auth");
  }
});

const logout = async () => {
  console.log("Logging out...");
  await userStore.logOut();
  router.push("/auth");
};
</script>
