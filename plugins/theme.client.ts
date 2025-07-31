export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (process.client) {
    const { initializeTheme } = useTheme();

    // Initialize theme on app start
    await initializeTheme();
  }
});
