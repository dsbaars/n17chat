import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
  ],
  colorMode: {
    // dataValue: 'theme',
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['.n17.chat']
    }
  },
  css: ['~/assets/css/app.css'],
  ssr: false,
})