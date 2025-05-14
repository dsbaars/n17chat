<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNostrClient, initializeNDK } from '~/composables/useNostrClient'
import { useRelayStore } from '~/stores/relays'
import { useNostrStore } from '~/stores/nostr'
import type { Contact } from '~/types/nostr'

definePageMeta({
  layout: 'default'
})

const { initialized } = useNostrClient()
const relayStore = useRelayStore()
const newRelayUrl = ref('')
const isValidUrl = ref(true)
const errorMessage = ref('')
const nostrStore = useNostrStore()
const hiddenContacts = ref<Contact[]>([])

// Regex pattern for WSS URLs
const wssPattern = /^wss:\/\/[a-zA-Z0-9]([a-zA-Z0-9-].*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-].*[a-zA-Z0-9])?)*(\.[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9])+(:\d+)?(\/[^/].*)?$/

const validateUrl = (url: string) => {
  if (!url) {
    isValidUrl.value = false
    errorMessage.value = 'URL is required'
    return false
  }
  
  if (!url.startsWith('wss://')) {
    isValidUrl.value = false
    errorMessage.value = 'URL must start with wss://'
    return false
  }
  
  if (!wssPattern.test(url)) {
    isValidUrl.value = false
    errorMessage.value = 'Invalid relay URL format'
    return false
  }
  
  try {
    new URL(url)
    isValidUrl.value = true
    errorMessage.value = ''
    return true
  } catch {
    isValidUrl.value = false
    errorMessage.value = 'Invalid URL'
    return false
  }
}

onMounted(async () => {
  if (!initialized) {
    await initializeNDK()
  }
  await nostrStore.getContacts()
  await relayStore.fetchRelayInfo()
  await loadHiddenContacts()
})

async function addDMRelay() {
  if (validateUrl(newRelayUrl.value)) {
    await relayStore.addDMRelay(newRelayUrl.value)
    newRelayUrl.value = ''
  }
}

async function loadHiddenContacts() {
  try {
    hiddenContacts.value = await nostrStore.getHiddenContacts()
  } catch (error) {
    console.error('Error loading hidden contacts', error)
  }
}

async function unhideContact(pubkey: string) {
  try {
    await nostrStore.showContact(pubkey)
    // Refresh the hidden contacts list
    await loadHiddenContacts()
  } catch (error) {
    console.error('Error unhiding contact', error)
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    
    <div v-if="relayStore.isLoading" class="flex justify-center my-8">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-8 w-8 animate-spin text-primary">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-5 gap-8">
      <!-- Add Relay Form -->
      <div class="card bg-base-200 shadow-xl md:col-span-1">
        <div class="card-body p-4">
          <h2 class="card-title text-sm">Add DM Relay</h2>
          <div class="form-control">
            <div class="join w-full">
              <input 
                v-model="newRelayUrl" 
                type="text" 
                placeholder="wss://relay.example.com" 
                pattern="^wss:\/\/.*$"
                required
                :class="[
                  'input input-sm join-item w-full', 
                  !isValidUrl && newRelayUrl ? 'input-error' : '',
                  isValidUrl && newRelayUrl ? 'input-success' : ''
                ]"
                @input="validateUrl(newRelayUrl)"
              >
              <button 
                class="btn btn-sm join-item" 
                @click="addDMRelay" 
                :disabled="!isValidUrl || !newRelayUrl"
              >Add</button>
            </div>
            <p v-if="!isValidUrl && newRelayUrl" class="text-error text-xs mt-1">{{ errorMessage }}</p>
            <p v-else-if="newRelayUrl && isValidUrl" class="text-success text-xs mt-1">Valid relay URL</p>
            <p v-else class="text-xs mt-1 text-base-content/70"></p>
          </div>
        </div>
      </div>
    
      <!-- DM Relays (NIP-51) -->
      <div class="card bg-base-200 shadow-xl md:col-span-4">
        <div class="card-body">
          <h2 class="card-title">
            DM Relays (NIP-51)
            <span class="badge badge-primary">{{ relayStore.dmRelays.length }}</span>
          </h2>
          <p class="text-sm opacity-70">Relays used for direct messages</p>
          
          <!-- DM Relay Selection Guide -->
          <div class="alert alert-info py-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="text-sm">Prefer relays that implement <a href="https://github.com/nostr-protocol/nips/blob/master/42.md" class="link link-hover" target="_blank">AUTH</a> to increase protection of your DMs</span>
          </div>
          
          <div class="divider"/>
          
          <ul class="space-y-2">
            <li v-for="relay in relayStore.dmRelays" :key="relay" class="flex items-center justify-between p-2 bg-base-100 rounded-lg">
              <span class="truncate">{{ relay }}</span>
              <button class="btn btn-sm btn-error" @click="relayStore.deleteDMRelay(relay)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </li>
            <li v-if="relayStore.dmRelays.length === 0" class="text-center p-4 text-base-content/70">
              No DM relays configured
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Hidden Chats -->
      <div class="card bg-base-200 shadow-xl md:col-span-5 mt-4">
        <div class="card-body">
          <h2 class="card-title">
            Hidden Chats
            <span class="badge badge-secondary">{{ hiddenContacts.length }}</span>
          </h2>
          <p class="text-sm opacity-70">Chats you've hidden from your main list, click on a contact to unhide it</p>
          
          <div class="divider"/>
          
          <div v-if="hiddenContacts.length === 0" class="text-center p-4 text-base-content/70">
            No hidden chats
          </div>
          
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <div 
              v-for="contact in hiddenContacts" 
              :key="contact.pubkey"
              @click="unhideContact(contact.pubkey)"
              class="flex items-center gap-2 p-2 bg-base-100 rounded-lg hover:bg-primary hover:bg-opacity-10 cursor-pointer transition-all"
            >
              <div class="avatar">
                <div class="w-8 rounded-full">
                  <img v-if="contact.picture" :src="contact.picture" :alt="contact.name || 'User'" />
                  <div v-else class="bg-neutral-focus text-neutral-content rounded-full w-8 h-8 flex items-center justify-center">
                    <span>{{ (contact.name || contact.pubkey.substring(0, 2)).substring(0, 1).toUpperCase() }}</span>
                  </div>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ contact.name || 'Unknown' }}</p>
                <p class="text-xs opacity-70 truncate">{{ contact.pubkey.substring(0, 16) }}...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
 
    </div>
  </div>
</template>

