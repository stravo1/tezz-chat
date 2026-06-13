<script setup lang="ts">
import { useUserStore } from '~/stores/user';
import Button from '~/components/ui/button/Button.vue';

const userStore = useUserStore();

const features = [
  {
    label: 'Model handoff without friction',
    detail:
      'Move from frontier reasoning to lightweight drafts in seconds, with context preserved across providers.',
  },
  {
    label: 'Branch and recover fast',
    detail:
      'Fork any message path, compare alternatives, and continue from the strongest answer without losing prior work.',
  },
  {
    label: 'Share and ship from one thread',
    detail:
      'Generate links, pull in files, and run search from the same surface so final outputs are traceable and ready to send.',
  },
];

onMounted(async () => {
  if (userStore.isAuthChecked) {
    if (userStore.isAuthenticated) await navigateTo('/chat/');
    return;
  }
  await userStore.fetchUser();
  if (userStore.isAuthenticated) await navigateTo('/chat/');
});
</script>

<template>
  <div class="bg-background text-foreground flex min-h-[100dvh] flex-col">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_12%_12%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_55%),radial-gradient(circle_at_84%_6%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_48%)]"
      aria-hidden="true"
    ></div>

    <header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <NuxtLink to="/" class="inline-flex items-baseline gap-1.5">
        <span class="syne text-foreground text-[1.5rem] leading-none font-black tracking-tight"
          >tezz</span
        >
        <span
          class="text-muted-foreground text-[1rem] leading-none font-semibold tracking-[-0.01em]"
        >
          .chat
        </span>
      </NuxtLink>
      <div class="flex items-center gap-4 text-sm">
        <a
          href="https://github.com/tezz-chat/tezz-chat"
          target="_blank"
          rel="noopener noreferrer"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <NuxtLink
          to="/auth"
          class="text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Sign In &rarr;
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
      <section
        class="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-20"
      >
        <div class="max-w-3xl min-w-0">
          <p class="text-muted-foreground mb-4 text-sm">
            Open-source command surface for advanced AI work
          </p>
          <h1
            class="text-foreground text-[clamp(2rem,5vw,3.4rem)] leading-[1.08] font-semibold tracking-tight text-balance"
          >
            Multi-model AI chat built for people who think in parallel
          </h1>
          <p
            class="text-muted-foreground mt-5 max-w-[66ch] text-[clamp(0.95rem,1.5vw,1.08rem)] leading-relaxed text-pretty"
          >
            Model switching, branching, sharing, and file-aware prompting in a compact interface
            that stays legible at speed. Tezz keeps state explicit so you can decide, revise, and
            deliver without interface drag.
          </p>
          <div class="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild class="h-10 cursor-pointer px-6 text-sm font-medium">
              <NuxtLink to="/auth">
                Get Started
                <span class="ml-1 opacity-60">&rarr;</span>
              </NuxtLink>
            </Button>
            <Button size="lg" variant="outline" asChild class="h-10 px-6 text-sm font-medium">
              <a href="/about">Product Brief</a>
            </Button>
          </div>
          <ul class="text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <li class="min-w-0 break-words">Local-first history</li>
            <li class="min-w-0 break-words">BYOK compatible</li>
            <li class="min-w-0 break-words">Thread sharing controls</li>
          </ul>
        </div>

        <aside
          class="border-border/60 bg-card/60 min-w-0 rounded-xl border px-5 py-5 backdrop-blur-[1px]"
        >
          <p class="text-foreground text-sm font-medium">Core workflow, one surface</p>
          <ul class="mt-4 space-y-4">
            <li v-for="item in features" :key="item.label" class="min-w-0">
              <h3 class="text-foreground text-sm leading-tight font-medium text-balance">
                {{ item.label }}
              </h3>
              <p
                class="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty break-words"
              >
                {{ item.detail }}
              </p>
            </li>
          </ul>
        </aside>
      </section>

      <footer
        class="border-border/40 text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t py-5 text-xs"
      >
        <span>&copy; {{ new Date().getFullYear() }} tezz.chat</span>
        <a
          href="https://github.com/tezz-chat/tezz-chat"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </footer>
    </main>
  </div>
</template>
