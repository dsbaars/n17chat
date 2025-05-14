
<script setup>
import { useHead } from '#app'
useHead({
  title: 'n17.chat',
  meta: [
    { name: 'description', content: 'n17.chat is a chat application based on NIP-17' }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
