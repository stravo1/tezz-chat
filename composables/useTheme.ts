export const useTheme = () => {
  const themeStore = useThemeStore();

  const loadTheme = async (themeName: string) => {
    return await themeStore.loadThemeFromApi();
  };

  const setApiEndpoint = (endpoint: string) => {
    themeStore.setApiEndpoint(endpoint);
  };

  const getAvailableThemes = async () => {
    return await themeStore.fetchAvailableThemes();
  };

  const resetTheme = () => {
    themeStore.resetToDefault();
  };

  const initializeTheme = async () => {
    await themeStore.loadSavedTheme();
  };

  // Reactive getters
  const isLoading = computed(() => themeStore.isLoading);
  const error = computed(() => themeStore.error);
  const currentTheme = computed(() => themeStore.currentTheme);
  const hasCustomEndpoint = computed(() => themeStore.hasCustomEndpoint);
  const apiEndpoint = computed(() => themeStore.apiEndpoint);

  return {
    // Actions
    loadTheme,
    setApiEndpoint,
    getAvailableThemes,
    resetTheme,
    initializeTheme,

    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    currentTheme: readonly(currentTheme),
    hasCustomEndpoint: readonly(hasCustomEndpoint),
    apiEndpoint: readonly(apiEndpoint),
  };
};
