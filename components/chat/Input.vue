<script setup lang="ts">
const message = ref("");
const props = defineProps<{
  handleSubmit: (message: string) => Promise<void>;
}>();

const handleSubmit = () => {
  if (message.value.trim() === "") return;
  props.handleSubmit(message.value);
  message.value = "";
};

</script>

<template>
  <form @submit.prevent="handleSubmit" class="absolute right-2 bottom-2 left-2 box-border flex gap-4">
    <input
      v-model="message"
      placeholder="Type your message..."
      class="rounded-lg border-2 bg-white p-3 focus:outline-none w-full"
    />
    <button type="submit" class="border-2 p-3 rounded-lg">Send</button>
  </form>
</template>
