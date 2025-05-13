<script setup lang="ts">
import { HomeIcon, CogIcon } from '@heroicons/vue/20/solid'
import { useRoute } from '#app'

const route = useRoute()
</script>

<template>
  <div class="dock dock-lg">
      <button :class="{ 'dock-active': route.path === '/' }" class="flex items-center justify-center">
        <NuxtLink to="/">
        <HomeIcon class="size-[1.2em] mx-auto"  />
        <span class="dock-label">Home</span>
      </NuxtLink>
    </button>
    <!-- <li>
      <NuxtLink to="/notifications">
        <BellIcon class="h-5 w-5" />
        <span class="dock-label">Notifications</span>
      </NuxtLink>
    </button> -->
    <button :class="{ 'dock-active': route.path === '/settings' }" class="flex items-center justify-center">
      <NuxtLink to="/settings">
        <CogIcon class="size-[1.2em] mx-auto" />
        <span class="dock-label">Settings</span>
      </NuxtLink>
    </button>
  </div>
</template>

<style scoped></style>
