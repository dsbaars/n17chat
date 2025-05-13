<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNostrClient, initializeNDK } from '~/composables/useNostrClient'
import { useRelayStore } from '~/stores/relays'
import { useNostrStore } from '~/stores/nostr'

definePageMeta({
  layout: 'default'
})

const { initialized } = useNostrClient()
const relayStore = useRelayStore()
const newRelayUrl = ref('')
const nostrStore = useNostrStore()

onMounted(async () => {
  if (!initialized) {
    await initializeNDK()
  }
  await nostrStore.getContacts()
  await relayStore.fetchRelayInfo()
})

async function addReadRelay() {
  if (newRelayUrl.value) {
    await relayStore.addReadRelay(newRelayUrl.value)
    newRelayUrl.value = ''
  }
}

async function addWriteRelay() {
  if (newRelayUrl.value) {
    await relayStore.addWriteRelay(newRelayUrl.value)
    newRelayUrl.value = ''
  }
}

async function addDMRelay() {
  if (newRelayUrl.value) {
    await relayStore.addDMRelay(newRelayUrl.value)
    newRelayUrl.value = ''
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
    
    <div v-else class="space-y-8">
      <!-- Add Relay Form -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Add Relay</h2>
          <div class="form-control">
            <div class="input-group">
              <input 
                v-model="newRelayUrl" 
                type="text" 
                placeholder="wss://relay.example.com" 
                class="input input-bordered w-full"
              >
              <div class="dropdown dropdown-start">
                <label tabindex="0" class="btn">
                  Add
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 ml-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </label>
                <ul tabindex="0" class="dropdown-content z-[100] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a @click="addReadRelay">Add as Read Relay</a></li>
                  <li><a @click="addWriteRelay">Add as Write Relay</a></li>
                  <li><a @click="addDMRelay">Add as DM Relay</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <!-- DM Relays (NIP-51) -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            DM Relays (NIP-51)
            <span class="badge badge-primary">{{ relayStore.dmRelays.length }}</span>
          </h2>
          <p class="text-sm opacity-70">Relays used for direct messages</p>
          
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

      <!-- Connected Relays -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            Connected Relays
            <span class="badge badge-primary">{{ relayStore.connectedRelays.length }}</span>
          </h2>
          
          <div class="divider"/>
          
          <ul class="space-y-2">
            <li v-for="relay in relayStore.connectedRelays" :key="relay" class="flex items-center justify-between p-2 bg-base-100 rounded-lg">
              <span class="truncate">{{ relay }}</span>
              <div class="flex space-x-2">
                <button class="btn btn-sm btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </li>
            <li v-if="relayStore.connectedRelays.length === 0" class="text-center p-4 text-base-content/70">
              No connected relays found
            </li>
          </ul>
        </div>
      </div>
      
      <!-- NIP-65 Read Relays -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            Read Relays (NIP-65)
            <span class="badge badge-primary">{{ relayStore.readRelays.length }}</span>
          </h2>
          <p class="text-sm opacity-70">Relays where you read events</p>
          
          <div class="divider"/>
          
          <ul class="space-y-2">
            <li v-for="relay in relayStore.readRelays" :key="relay" class="flex items-center justify-between p-2 bg-base-100 rounded-lg">
              <div class="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 text-info">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                <span class="truncate">{{ relay }}</span>
              </div>
              <button class="btn btn-sm btn-error" @click="relayStore.deleteReadRelay(relay)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </li>
            <li v-if="relayStore.readRelays.length === 0" class="text-center p-4 text-base-content/70">
              No read relays configured
            </li>
          </ul>
        </div>
      </div>
      
      <!-- NIP-65 Write Relays -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            Write Relays (NIP-65)
            <span class="badge badge-primary">{{ relayStore.writeRelays.length }}</span>
          </h2>
          <p class="text-sm opacity-70">Relays where you publish events</p>
          
          <div class="divider"/>
          
          <ul class="space-y-2">
            <li v-for="relay in relayStore.writeRelays" :key="relay" class="flex items-center justify-between p-2 bg-base-100 rounded-lg">
              <div class="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 text-success">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                <span class="truncate">{{ relay }}</span>
              </div>
              <button class="btn btn-sm btn-error" @click="relayStore.deleteWriteRelay(relay)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </li>
            <li v-if="relayStore.writeRelays.length === 0" class="text-center p-4 text-base-content/70">
              No write relays configured
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

