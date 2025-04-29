<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const nostrStore = useNostrStore()

// Format timestamp for messages
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  if (date >= today) {
    return date.toLocaleTimeString([ (new Intl.NumberFormat()).resolvedOptions().locale ], { hour: '2-digit', minute: '2-digit', hour12: false })
  } else {
    return date.toLocaleString([ (new Intl.NumberFormat()).resolvedOptions().locale ], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  }

}

// Check if message is from the current user
const isCurrentUser = (message) => {
  // If the message has isSent flag set, it was sent by the current user
  if (message.isSent) return true
  
  // Otherwise, check if the pubkey matches the current user's pubkey
  return message.pubkey === nostrStore.currentPubkey
}
</script>

<template>
  <div class="chat" :class="isCurrentUser(message) ? 'chat-end' : 'chat-start'">
    <div class="chat-image avatar">
      <div class="w-10 rounded-full" v-if="nostrStore.getContact(message.pubkey)?.picture">
        <img :src="nostrStore.getContact(message.pubkey)?.picture" />
      </div>
    </div>
    <div class="chat-bubble" :class="isCurrentUser(message) ? 'chat-bubble-primary' : 'chat-bubble-accent'">
      {{ message.content }}
    </div>
    <div class="chat-footer opacity-50 text-xs">
       {{ formatMessageTime(message.created_at) }}
    </div>
  </div>
</template>

<style scoped></style> 