<script setup lang="ts">
import { HomeIcon, CogIcon } from '@heroicons/vue/20/solid'
</script>

<template>
  <div class="dock dock-lg">
      <button class=" flex items-center justify-center">
        <NuxtLink to="/">
        <HomeIcon />
        <span class="dock-label">Home</span>
      </NuxtLink>
    </button>
    <!-- <li>
      <NuxtLink to="/notifications">
        <BellIcon class="h-5 w-5" />
        <span class="dock-label">Notifications</span>
      </NuxtLink>
    </button> -->
    <button class="flex items-center justify-center">
      <NuxtLink to="/settings">
        <CogIcon />
        <span class="dock-label">Settings</span>
      </NuxtLink>
    </button>
  </div>
</template>

<style scoped></style>
