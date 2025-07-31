
<script setup>
import { useHead } from '#app'
import { subscribeEvents } from '~/utils/subscribeEvents'

useHead({
  title: 'n17.chat',
  meta: [
    { name: 'description', content: 'n17.chat is a chat application based on NIP-17' }
  ]
})

onMounted(async () => {
  if (typeof window !== "undefined" && "nostr" in window) {
    await subscribeEvents()
  } 
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
