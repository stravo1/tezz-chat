import { defineStore } from 'pinia';

interface ThemeConfig {
  name: string;
  type: string;
  css?: Record<string, any>;
  cssVars: {
    theme?: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

interface ThemeState {
  currentTheme: ThemeConfig | null;
  isLoading: boolean;
  apiEndpoint: string;
  error: string | null;
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    currentTheme: null,
    isLoading: false,
    apiEndpoint: '',
    error: null,
  }),

  getters: {
    hasCustomEndpoint: state => Boolean(state.apiEndpoint),
    isThemeLoaded: state => Boolean(state.currentTheme),
  },

  actions: {
    setApiEndpoint(endpoint: string) {
      this.apiEndpoint = endpoint;
      // Save to localStorage for persistence
      localStorage.setItem('theme-api-endpoint', endpoint);
      this.loadThemeFromApi();
    },

    async loadThemeFromApi(): Promise<boolean> {
      if (!this.apiEndpoint) {
        this.error = 'No API endpoint configured';
        return false;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const url = new URL(this.apiEndpoint);

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`Failed to fetch theme: ${response.statusText}`);
        }

        const themeData: ThemeConfig = await response.json();

        // Validate the theme data structure
        if (!themeData.cssVars || !themeData.cssVars.light || !themeData.cssVars.dark) {
          throw new Error('Invalid theme data structure');
        }

        this.currentTheme = themeData;
        await this.applyTheme(themeData);

        // Save current theme name for persistence
        localStorage.setItem('current-theme-name', themeData.name);

        return true;
      } catch (error) {
        console.error('Error loading theme:', error);
        this.error = error instanceof Error ? error.message : 'Unknown error occurred';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async applyTheme(theme: ThemeConfig) {
      // Remove existing dynamic theme styles
      const existingStyle = document.getElementById('dynamic-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create new style element
      const style = document.createElement('style');
      style.id = 'dynamic-theme-styles';

      let cssContent = '';

      // Add root variables (theme-wide variables)
      if (theme.cssVars.theme) {
        cssContent += ':root {\n';
        for (const [key, value] of Object.entries(theme.cssVars.theme)) {
          cssContent += `  --${key}: ${value};\n`;
        }
        cssContent += '}\n\n';
      }

      // Add light theme variables
      cssContent += ':root {\n';
      for (const [key, value] of Object.entries(theme.cssVars.light)) {
        cssContent += `  --${key}: ${value};\n`;
      }
      cssContent += '}\n\n';

      // Add dark theme variables
      cssContent += '.dark {\n';
      for (const [key, value] of Object.entries(theme.cssVars.dark)) {
        cssContent += `  --${key}: ${value};\n`;
      }
      cssContent += '}\n\n';

      // Add Tailwind color mappings
      cssContent += `
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

.prose {
  --tw-prose-body: var(--foreground);
  --tw-prose-headings: var(--foreground);
  --tw-prose-lead: var(--foreground);
  --tw-prose-links: var(--foreground);
  --tw-prose-bold: var(--foreground);
  --tw-prose-counters: var(--foreground);
  --tw-prose-bullets: var(--foreground);
  --tw-prose-hr: var(--foreground);
  --tw-prose-quotes: var(--muted-foreground);
  --tw-prose-quote-borders: var(--border);
  --tw-prose-captions: var(--foreground);
  --tw-prose-code: var(--foreground);
  --tw-prose-pre-code: var(--foreground);
  --tw-prose-pre-bg: var(--background);
  --tw-prose-th-borders: var(--border);
  --tw-prose-td-borders: var(--border);
}
`;

      // Add any additional CSS from the theme
      if (theme.css) {
        for (const [selector, rules] of Object.entries(theme.css)) {
          cssContent += `${selector} {\n`;
          if (typeof rules === 'object') {
            for (const [property, value] of Object.entries(rules)) {
              cssContent += `  ${property}: ${value};\n`;
            }
          }
          cssContent += '}\n\n';
        }
      }

      style.textContent = cssContent;
      document.head.appendChild(style);
    },

    async loadSavedTheme() {
      const savedEndpoint = localStorage.getItem('theme-api-endpoint');
      const savedThemeName = localStorage.getItem('current-theme-name');

      if (savedEndpoint) {
        this.apiEndpoint = savedEndpoint;
      }

      if (savedEndpoint && savedThemeName) {
        await this.loadThemeFromApi();
      }
    },

    async fetchAvailableThemes(): Promise<string[]> {
      if (!this.apiEndpoint) return [];

      try {
        // Assuming the API has an endpoint to list available themes
        const url = new URL(this.apiEndpoint);
        url.searchParams.set('action', 'list');

        const response = await fetch(url.toString());
        if (response.ok) {
          const themes = await response.json();
        }
      } catch (error) {
        console.error('Error fetching available themes:', error);
      }

      return [];
    },

    resetToDefault() {
      // Remove dynamic styles
      const existingStyle = document.getElementById('dynamic-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Clear state
      this.currentTheme = null;
      this.error = null;

      // Clear localStorage
      localStorage.removeItem('current-theme-name');
    },

    clearApiEndpoint() {
      this.apiEndpoint = '';
      this.resetToDefault();
      localStorage.removeItem('theme-api-endpoint');
    },
  },
});
