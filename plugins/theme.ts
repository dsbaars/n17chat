import { useThemeStore } from '~/stores/theme'

export default defineNuxtPlugin({
  name: 'theme-plugin',
  setup() {
    // Initialize theme on client side only
    if (import.meta.client) {
        const colorMode = useColorMode();

        watchEffect(() => {
          // Map your colorMode preference to your DaisyUI theme name
          let theme = colorMode.preference;
          if (theme === 'dark') theme = 'dim';
          if (theme === 'light') theme = 'retro';
          // Set the data-theme attribute
          document.documentElement.setAttribute('data-theme', theme);
        });
    }
  }
}) 