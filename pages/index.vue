<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import Alert from '~/components/UI/Alert.vue'

// Layout definition
definePageMeta({
  layout: 'chat'
})

const nostrStore = useNostrStore()


</script>

<template>
  <div class="flex h-full">
    <SideBar />
    <div class="flex-1">
      <Messages />
    </div>
  </div>
</template>

<style scoped></style>
