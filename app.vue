
<script setup>
import { useHead } from '#app'
useHead({
  title: 'N17Chat',
  meta: [
    { name: 'description', content: 'N17Chat is a chat application based on NIP-17' }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
