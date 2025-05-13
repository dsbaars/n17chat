import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'
import { NDKStore } from '@nostrify/ndk'
import { ref } from 'vue'

// Create refs to hold the NDK instances
const ndk = ref<NDK>()
const ndkStore = ref<NDKStore>()
const initialized = ref(false)

// Create a function to initialize NDK
export async function initializeNDK() {
  if (initialized.value) return { ndk: ndk.value, ndkStore: ndkStore.value }
  
  const cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'ndk-cache' })
  
  const ndkInstance = new NDK({
    explicitRelayUrls: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.primal.net'
    ],
    cacheAdapter,
    autoConnectUserRelays: true
  })
  
  ndkInstance.signer = new NDKNip07Signer()

  await ndkInstance.connect()
  
  // Initialize the NDK store
  const ndkStoreInstance = new NDKStore(ndkInstance)
  
  // Set the refs
  ndk.value = ndkInstance
  ndkStore.value = ndkStoreInstance
  initialized.value = true
  
  return {
    ndk: ndk.value,
    ndkStore: ndkStore.value
  }
}

// Create the composable
export function useNostrClient() {
  if (!initialized.value) {
    console.warn('NDK not initialized yet. Call initializeNDK first or wait for the plugin to initialize it.')
  }
  
  // Subscribe to events with a filter
  function subscribe(filter: any) {
    if (!ndk.value) {
      console.error('NDK not initialized')
      return
    }
    return ndk.value.subscribe(filter)
  }
  
  // Query events with filters
  async function query(filters: any[]) {
    if (!ndkStore.value) {
      console.error('NDK Store not initialized')
      return []
    }
    return ndkStore.value.query(filters)
  }

  async function getSelf() {
    if (!ndk.value) {
      console.error('NDK not initialized')
      return null
    }
    return ndk.value.signer?.user()
  }

  return {
    ndk: ndk.value,
    ndkStore: ndkStore.value,
    initialized: initialized.value,
    subscribe,
    query,
    getSelf
  }
} 