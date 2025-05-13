<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import { useNostrClient } from '~/composables/useNostrClient'
import { ref, watch, nextTick } from 'vue'
import ChatMessage from '~/components/Chat/Message.vue'
import ContactPicture from '~/components/Chat/ContactPicture.vue'
import MessageInput from '~/components/Chat/MessageInput.vue'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/outline'
import Alert from '~/components/UI/Alert.vue'
import { nip19 } from 'nostr-tools'
import type { Message } from '~/types/nostr'
import AppModal from '~/components/UI/Modal.vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css';

const nostrStore = useNostrStore()
const { ndk } = useNostrClient()

const messages = ref<Message[]>([])
const newMessage = ref('')
const messagesContainer = ref(null)
const alerts = ref([])
const isModalOpen = ref(false)
const modalContent = ref<Message | null>(null)

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

// Define client references for various Nostr platforms
const getClientLinks = (pubkey: string): { name: string, url: string }[] => {
  // Generate nprofile for the pubkey
  const nprofileCode = nostrStore.selectedContact?.profile ? 
    nip19.nprofileEncode({
      pubkey: pubkey,
      relays: nostrStore.selectedContact.profile.relays || []
    }) : 
    nip19.npubEncode(pubkey);

  const npubCode = nostrStore.selectedContact?.profile ?
    nip19.npubEncode(pubkey) :
    nip19.npubEncode(pubkey);

  // Define all available clients with their base URLs
  const clients = [
    { name: "Nosta", base: "https://nosta.me/{code}" },
    { name: "Snort", base: "https://snort.social/{code}" },
    { name: "Olas", base: "https://olas.app/{npub}" },
    { name: "Primal", base: "https://primal.net/p/{code}" },
    { name: "Nostrudel", base: "https://nostrudel.ninja/#/u/{npub}" },
    { name: "Nostter", base: "https://nostter.app/{code}" },
    { name: "Jumble", base: "https://jumble.social/users/{npub}" },
    { name: "Coracle", base: "https://coracle.social/{code}" },
    // { name: "relay.tools", base: "https://relay.tools/posts/?relay=wss://{code}" },
    { name: "Iris", base: "https://iris.to/{npub}" },
    { name: "zap.stream", base: "https://zap.stream/p/{npub}" },
    // { name: "Nostrrr", base: "https://nostrrr.com/p/{code}" },
    { name: "YakiHonne", base: "https://yakihonne.com/users/{code}" },
    { name: "Habla", base: "https://habla.news/p/{code}" },
    { name: "njump.me", base: "https://njump.me/{npub}" }
  ];
  
  // Replace {code} with the actual nprofile code
  return clients.map(client => ({
    name: client.name,
    url: client.base.replace('{code}', nprofileCode).replace('{npub}', npubCode)
  }));
};

const nprofile = computed(() => nostrStore.selectedContact.profile ? nip19.nprofileEncode(nostrStore.selectedContact.profile) : null)

const openModal = (message: Message) => {
  isModalOpen.value = true
  modalContent.value = message
}
const closeModal = () => {
  isModalOpen.value = false
}

const backdrop = () => {
  return nostrStore.selectedContact?.profile?.banner || ""
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
          </div>
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-sm btn-circle btn-ghost">
              <EllipsisHorizontalIcon class="w-4 h-4" />
            </label>
            <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-200 rounded-box z-[1]  p-2 shadow-xl">
              <li><a @click="() => openModal(nostrStore.selectedContact)">View profile</a></li>
              <li v-for="client in getClientLinks(nostrStore.selectedContact.pubkey)" :key="client.name"><a :href="client.url" target="_blank">{{ client.name }}</a></li>
            </ul>
          </div>

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
          <ChatMessage v-for="message in messages" :key="message.id" :message="message" @open-modal="openModal" />
        </div>
      </template>

    </div>

    <!-- Message input -->
    <div v-if="nostrStore.selectedContact" class="border-t border-base-300 p-3 bg-base-100">
      <MessageInput v-model="newMessage" @send="sendMessage" />
    </div>

    <AppModal 
      v-model:is-open="isModalOpen"
      size="xl"
      @close="closeModal"
    >
      <template #header>
        <h3 class="font-bold text-lg">Raw Message</h3>
      </template>
      
      <vue-json-pretty :data="modalContent" :deep="3" />
      
      <template #footer>
        <button class="btn btn-outline" @click="closeModal">Close</button>
      </template>
    </AppModal>

    <div role="" class="absolute bottom-5 left-1/2 -translate-x-1/2 z-100">
      <Alert v-for="alert in alerts" v-if="alerts.length > 0" :type="alert.type" :message="alert.message" closable />
    </div>
  </div>
</template>

<style scoped></style>
