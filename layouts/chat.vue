<script setup lang="ts">
import { ListTree } from 'lucide-vue-next';
import Button from '~/components/ui/button/Button.vue';
import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
import TooltipProvider from '~/components/ui/tooltip/TooltipProvider.vue';
import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';

const isChatNavigatorOpen = ref(false);
</script>

<template>
  <main class="flex h-[100dvh] w-screen">
    <div
      id="chat-view"
      class="bg-background text-foreground relative box-border flex h-full w-full justify-center overflow-hidden px-4 pt-24"
    >
      <div class="absolute top-4 right-4 z-30 flex gap-2">
        <div class="hidden items-center gap-2 lg:flex">
          <TooltipProvider>
            <Tooltip :delayDuration="300">
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  class="text-foreground hover:!bg-accent border-border/70 flex cursor-pointer rounded border p-2 transition-all"
                  @click="isChatNavigatorOpen = true"
                >
                  <ListTree />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Chat Navigator</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div class="flex items-center gap-2 lg:hidden">
          <Button
            size="sm"
            variant="outline"
            class="text-foreground hover:!bg-accent border-border/70 flex h-6 w-6 cursor-pointer rounded border p-0 transition-all"
            @click="isChatNavigatorOpen = true"
          >
            <ListTree class="h-3 w-3" />
          </Button>
        </div>
      </div>
      <NuxtPage />
      <ChatNavigator
        v-if="isChatNavigatorOpen"
        :open="isChatNavigatorOpen"
        @update:open="isChatNavigatorOpen = $event"
      />
    </div>
  </main>
</template>
