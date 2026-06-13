<script setup lang="ts">
const userStore = useUserStore();
const authError = ref('');
const activeProvider = ref<'github' | 'google' | null>(null);
const lastAttemptedProvider = ref<'github' | 'google' | null>(null);
const isGuestLoading = ref(false);

const isSubmitting = computed(() => activeProvider.value !== null || isGuestLoading.value);

const providerLabels: Record<'github' | 'google', string> = {
  github: 'GitHub',
  google: 'Google',
};

onMounted(async () => {
  // If already checked and authenticated as a real (non-guest) user, skip the page.
  if (userStore.isAuthChecked && userStore.isAuthenticated && !userStore.isGuest) {
    navigateTo('/chat/');
    return;
  }
  if (!userStore.isAuthChecked) {
    await userStore.fetchUser();
    // Only auto-redirect real users — guests should be allowed to sign in.
    if (userStore.isAuthenticated && !userStore.isGuest) {
      navigateTo('/chat/');
    }
  }
  // If the user arriving here is a guest, delete their anonymous session
  // so OAuth can create a fresh real session without conflicts.
  if (userStore.isGuest) {
    await userStore.logOut();
  }
});

const getAuthErrorMessage = (error: unknown, provider: 'github' | 'google'): string => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Reconnect to the internet and try again.';
  }

  const defaultMessage = `${providerLabels[provider]} sign-in did not start. Check your connection and try again.`;

  if (!error || typeof error !== 'object') return defaultMessage;

  const maybeStatus = (error as { status?: number; statusCode?: number }).status;
  const status = maybeStatus ?? (error as { statusCode?: number }).statusCode;

  if (status === 401) return 'Your session expired. Refresh and sign in again.';
  if (status === 403)
    return `${providerLabels[provider]} sign-in is not available for this account.`;
  if (status === 404) return 'Authentication service is unavailable right now. Try again shortly.';
  if (status === 429) return 'Too many sign-in attempts. Wait a moment and retry.';
  if (status && status >= 500)
    return 'Authentication service is currently unavailable. Please retry.';

  return defaultMessage;
};

const loginWithProvider = async (provider: 'github' | 'google') => {
  if (isSubmitting.value) return;
  authError.value = '';
  activeProvider.value = provider;
  lastAttemptedProvider.value = provider;

  try {
    const { redirectURL } = await $fetch<{ redirectURL?: string }>(`/api/auth/oauth/${provider}`, {
      method: 'POST',
      timeout: 10000,
      retry: 0,
    });

    if (!redirectURL || typeof redirectURL !== 'string') {
      authError.value = `${providerLabels[provider]} sign-in returned an invalid redirect URL. Please retry.`;
      return;
    }

    window.location.assign(redirectURL);
  } catch (error) {
    console.error(`Failed to initiate ${providerLabels[provider]} login:`, error);
    authError.value = getAuthErrorMessage(error, provider);
  } finally {
    activeProvider.value = null;
  }
};

const loginWithGithub = async () => {
  await loginWithProvider('github');
};

const loginWithGoogle = async () => {
  await loginWithProvider('google');
};

const retryLogin = async () => {
  if (!lastAttemptedProvider.value) return;
  await loginWithProvider(lastAttemptedProvider.value);
};

const loginAsGuest = async () => {
  if (isSubmitting.value) return;
  authError.value = '';
  isGuestLoading.value = true;
  try {
    await userStore.createGuestSession();
    await navigateTo('/chat/');
  } catch (error) {
    console.error('Failed to create guest session:', error);
    authError.value = 'Could not start a guest session. Please try again.';
  } finally {
    isGuestLoading.value = false;
  }
};
</script>

<template>
  <div
    class="bg-background relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden px-4 py-8"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_56%)]"
      aria-hidden="true"
    ></div>

    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <NuxtLink to="/" class="inline-flex items-baseline gap-1.5">
          <span class="syne text-foreground text-[1.5rem] leading-none font-black tracking-tight">
            tezz
          </span>
          <span
            class="text-muted-foreground text-[1rem] leading-none font-semibold tracking-[-0.01em]"
          >
            .chat
          </span>
        </NuxtLink>
      </div>

      <div class="bg-card border-border/60 rounded-xl border p-6 shadow-xs sm:p-8">
        <div class="mb-7 text-center">
          <h1
            class="text-foreground text-[clamp(1.35rem,2vw,1.65rem)] font-semibold tracking-tight text-balance"
          >
            Sign in and continue your threads
          </h1>
          <p class="text-muted-foreground mt-2 text-sm text-pretty">
            Pick a provider to sync your workspace, history, and model setup.
          </p>
        </div>

        <div
          v-if="authError"
          role="alert"
          aria-live="assertive"
          class="border-destructive/20 bg-destructive/10 text-foreground mb-4 rounded-md border px-3 py-3"
        >
          <p class="text-sm leading-relaxed text-pretty break-words">{{ authError }}</p>
          <button
            v-if="lastAttemptedProvider"
            type="button"
            @click="retryLogin"
            :disabled="isSubmitting"
            class="text-foreground/90 hover:text-foreground mt-2 text-xs font-medium underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Try {{ providerLabels[lastAttemptedProvider] }} again
          </button>
        </div>

        <div class="flex flex-col gap-3" :aria-busy="isSubmitting ? 'true' : 'false'">
          <button
            @click="loginWithGithub"
            :disabled="isSubmitting"
            type="button"
            class="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg px-4 text-sm font-medium shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg class="size-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            <span class="min-w-0 text-center text-pretty break-words">
              {{ activeProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub' }}
            </span>
          </button>

          <div class="flex items-center gap-3 py-1" aria-hidden="true">
            <span class="bg-border/60 h-px flex-1"></span>
            <span class="text-muted-foreground text-xs">or</span>
            <span class="bg-border/60 h-px flex-1"></span>
          </div>

          <button
            @click="loginWithGoogle"
            :disabled="isSubmitting"
            type="button"
            class="border-border/80 bg-background hover:bg-accent text-foreground focus-visible:ring-ring/50 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border px-4 text-sm font-medium shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Icon name="logos:google-icon" class="size-5 shrink-0" />
            <span class="min-w-0 text-center text-pretty break-words">
              {{ activeProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google' }}
            </span>
          </button>
        </div>

        <!-- Guest login divider -->
        <div class="flex items-center gap-3 py-1" aria-hidden="true">
          <span class="bg-border/60 h-px flex-1"></span>
          <span class="text-muted-foreground text-xs">or</span>
          <span class="bg-border/60 h-px flex-1"></span>
        </div>

        <!-- Guest login button -->
        <button
          @click="loginAsGuest"
          :disabled="isSubmitting"
          type="button"
          class="border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border px-4 text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <svg
            v-if="!isGuestLoading"
            class="size-4 shrink-0 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          <svg
            v-else
            class="size-4 shrink-0 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{{ isGuestLoading ? 'Starting guest session...' : 'Continue as Guest' }}</span>
        </button>

        <p class="text-muted-foreground mt-3 text-center text-xs" aria-live="polite">
          {{
            isGuestLoading
              ? 'Setting up temporary session...'
              : isSubmitting
                ? 'Redirecting to provider...'
                : 'Secure OAuth redirect, no password stored.'
          }}
        </p>

        <p class="text-muted-foreground mt-6 text-center text-xs leading-relaxed text-pretty">
          By continuing, you agree to our
          <a href="#" class="hover:text-foreground underline underline-offset-2 transition-colors">
            Terms
          </a>
          and
          <a href="#" class="hover:text-foreground underline underline-offset-2 transition-colors">
            Privacy Policy
          </a>
          .
        </p>

        <p class="mt-3 text-center text-xs">
          <NuxtLink to="/" class="text-muted-foreground hover:text-foreground transition-colors">
            Back to home
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
