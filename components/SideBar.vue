<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { ref, computed, onMounted } from 'vue'
import ContactPicture from '~/components/Chat/ContactPicture.vue'

const nostrStore = useNostrStore()
const searchTerm = ref('')

// Computed property to filter contacts based on search term
const filteredContacts = computed(() => {
  if (!searchTerm.value.trim()) return nostrStore.contacts
  
  const term = searchTerm.value.toLowerCase()
  return nostrStore.contacts.filter(contact => {
    const name = contact.name || shortPubkey(contact.pubkey)
    return name.toLowerCase().includes(term)
  })
})

// Load contacts when component is mounted
onMounted(async () => {
  await nostrStore.getContacts()
})

// Format timestamp to a human-readable format
const formatTime = (time) => {
  if (!time) return ''
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  if (time >= today) {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } else {
    return time.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

// Short form of pubkey
const shortPubkey = (pubkey) => {
  return pubkey.slice(0, 8) + '...'
}

// Select contact for conversation
const selectContact = (contact) => {
  nostrStore.selectContact(contact)
}

// Hide a contact from the sidebar
const hideContact = (event, contact) => {
  event.stopPropagation() // Prevent contact selection when clicking the hide button
  nostrStore.hideContact(contact.pubkey)
}
</script>

<template>
  <div class="w-80 bg-base-200 border-r border-base-300">
    <div class="p-4 border-b border-base-300 bg-base-200" >
      <div class="flex justify-items-stretch items-center">
        <div class="form-control grow">
          <label class="input">
            <MagnifyingGlassIcon class="w-5 h-5" />
            <input v-model="searchTerm" type="text" placeholder="Search" class="grow" >
          </label>
        </div>
        <button class="btn btn-circle btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
    
    <div class="overflow-y-auto h-full pb-24">
      <div
v-for="contact in filteredContacts" :key="contact.pubkey" 
           :class="['flex p-3 border-b border-base-300 hover:bg-base-300 cursor-pointer relative', 
                    nostrStore.selectedContact?.pubkey === contact.pubkey ? 'bg-base-300' : '']"
           @click="selectContact(contact)">

        <div class="mr-3">
          <ContactPicture :contact="contact" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between">
            <div class="font-medium truncate">{{ contact.name || shortPubkey(contact.pubkey) }}</div>
            <div class="text-xs opacity-60">{{ formatTime(contact.lastMessageTime) }}</div>
          </div>
          <div class="text-sm truncate opacity-70">{{ contact.lastMessage }}</div>
        </div>
        <div v-if="contact.unreadCount" class="badge badge-primary badge-sm ml-1">{{ contact.unreadCount }}</div>
        
        <div class="absolute right-2 top-2" @click.stop="hideContact($event, contact)">
          <div class="tooltip tooltip-left" data-tip="Hide chat">
            <XMarkIcon class="w-4 h-4 text-gray-400 hover:text-gray-700" />
          </div>
        </div>
      </div>
      
      <div v-if="filteredContacts.length === 0" class="p-4 text-center opacity-60">
        {{ searchTerm ? 'No matching contacts' : 'No conversations yet' }}
      </div>
    </div>
  </div>
</template>

<style>
.indicator {
  border-bottom: 1px solid #e0e0e0;
}
</style>
