<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import { useNostrClient } from '~/composables/useNostrClient'
import { ref, watch, nextTick } from 'vue'
import ChatMessage from '~/components/Chat/Message.vue'
import ContactPicture from '~/components/Chat/ContactPicture.vue'
import MessageInput from '~/components/Chat/MessageInput.vue'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/outline'

const nostrStore = useNostrStore()
const { ndk } = useNostrClient()

const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
const alerts = ref([])
// Function to load messages for a contact
const loadMessagesForContact = async (pubkey) => {
  const events = await nostrStore.getEventsByPubkey(pubkey)
  // Sort messages by created_at timestamp to show in chronological order
  messages.value = events.sort((a, b) => a.created_at - b.created_at)

  // Scroll to bottom after messages load
  await nextTick()
  scrollToBottom()
}

// Watch for selected contact changes
watch(() => nostrStore.selectedContact, async (newContact) => {
  if (newContact) {
    await loadMessagesForContact(newContact.pubkey)
  } else {
    messages.value = []
  }
}, { immediate: true })



// Watch for new messages in the store
watch(() => nostrStore.loadedEvents, async () => {
  if (nostrStore.selectedContact) {
    await loadMessagesForContact(nostrStore.selectedContact.pubkey)
  }
}, { deep: true })

// Format timestamp for messages
const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString(['nl-NL'], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

// Check if message is from the current user
const isCurrentUser = (message: NostrEvent) => {
  // If the message has isSent flag set, it was sent by the current user
  if (message.isSent) return true

  // Otherwise, check if the pubkey matches the current user's pubkey
  return message.pubkey === nostrStore.currentPubkey
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Send a new message
const sendMessage = async (message: string) => {
  if (!message.trim() || !nostrStore.selectedContact || !ndk) return

  const relays = await getInboxDMRelays(ndk, nostrStore.selectedContact.pubkey)

  if (relays.length === 0) {
    alerts.value.push({
      type: 'warning',
      message: 'This user has not configured their inbox relay yet. Please ask them to do so.'
    })
    return
  } 

  try {
    const wraps = await sendPrivateDirectMessage(ndk, nostrStore.selectedContact.pubkey, message)

  if (wraps) {
    // Scroll to bottom after new message
    await nextTick()
    scrollToBottom()
  }
  } catch (error) {
    console.error('Error sending message', error)
  }
}
</script>

<template>
  <div class="flex flex-col h-full relative">

    <!-- Chat header -->
    <div class="p-3 border-b border-base-300 flex items-center">
      <div v-if="nostrStore.selectedContact" class="mr-2">
        <ContactPicture :contact="nostrStore.selectedContact" />
      </div>
      <div v-if="nostrStore.selectedContact" class="font-semibold flex-1">
        <div class="flex items-center justify-between">
          <div>
            {{ nostrStore.selectedContact.name || nostrStore.selectedContact.pubkey.slice(0, 8) + '...' }}
          <div class="text-xs opacity-60">{{ nostrStore.selectedContact.profile?.about || 'No description' }}</div>
          <div class="text-xs opacity-60">{{ nostrStore.selectedContact.profile?.nip05 }}</div>
        </div>
        <button class="btn btn-sm btn-circle btn-ghost">
          <EllipsisHorizontalIcon class="w-4 h-4" />
        </button>
        </div>

      </div>
     
      <div v-else class="font-semibold">No conversation selected</div>
    </div>

    <!-- Messages area -->

    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 bg-base-200">
      <div v-if="!nostrStore.selectedContact" class="h-full flex items-center justify-center text-lg opacity-50">
        Select a conversation to start chatting
      </div>

      <template v-else>
        <div v-if="messages.length === 0" class="h-full flex items-center justify-center text-lg opacity-50">
          No messages yet
        </div>

        <div v-else class="space-y-3">
          <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
        </div>
      </template>

    </div>

    <!-- Message input -->
    <div v-if="nostrStore.selectedContact" class="border-t border-base-300 p-3 bg-base-100">
      <MessageInput v-model="newMessage" @send="sendMessage" />
    </div>

   
    <div role="" class="absolute bottom-5 left-1/2 -translate-x-1/2 z-100">

      <Alert :type="alert.type" :message="alert.message"  closable v-if="alerts.length > 0" v-for="alert in alerts"  />

      <!-- <ExclamationTriangleIcon class="w-6 h-6" />
      <span>This user has not configured their inbox relay yet. Please ask them to do so.</span> -->
    </div>
  </div>
</template>

<style scoped></style>
