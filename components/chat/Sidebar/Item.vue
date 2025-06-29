<script setup lang="ts">
import { ref } from 'vue';
import { Split, Trash2, MoreHorizontal, Edit, Share, EyeOff } from 'lucide-vue-next';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  isBranched: boolean;
  visibility?: string;
  createdAt: string;
}

interface Props {
  chat: Chat;
  isActive: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  startRename: [chatId: string, currentTitle: string];
  shareChat: [chatId: string, visibility: string];
  deleteThread: [chatId: string];
}>();

const open = ref(false);
</script>

<template>
  <SidebarMenuItem>
    <SidebarMenuButton
      :as-child="true"
      :data-active="isActive"
      class="group/thread w-full cursor-pointer"
    >
      <NuxtLink :to="`/chat/${chat.id}`" class="flex w-full items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <Split v-if="chat.isBranched" class="h-4 w-4 shrink-0 opacity-50" />
          <span class="flex-1 truncate">{{ chat.title }}</span>
        </div>

        <!-- Three-dot menu - visible on hover, focus, or when menu is open -->
        <div
          class="opacity-100 transition-opacity duration-300 group-hover/thread:opacity-100 lg:opacity-0"
          :class="{ 'opacity-100': open }"
        >
          <DropdownMenu v-model:open="open">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="h-6 w-6 cursor-pointer p-0" @click.prevent>
                <MoreHorizontal class="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="border-border/50 lg:border-border w-48">
              <DropdownMenuItem
                class="cursor-pointer"
                @click="emit('startRename', chat.id, chat.title)"
              >
                <Edit class="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                class="cursor-pointer"
                @click="emit('shareChat', chat.id, chat.visibility || 'private')"
              >
                <component
                  :is="chat.visibility === 'public' ? EyeOff : Share"
                  class="mr-2 h-4 w-4"
                />
                {{ chat.visibility === 'public' ? 'Make Private' : 'Share' }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @click="emit('deleteThread', chat.id)"
                class="group/delete text-destructive hover:text-destructive-foreground focus:text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive/90 cursor-pointer"
              >
                <Trash2 class="group-hover/delete:text-destructive-foreground mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </NuxtLink>
    </SidebarMenuButton>
  </SidebarMenuItem>
</template>
