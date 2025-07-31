import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import type { NDKRelay } from '@nostr-dev-kit/ndk';
import NDK, { NDKNip07Signer, NDKRelayAuthPolicies } from '@nostr-dev-kit/ndk'
import { NDKStore } from '@nostrify/ndk'
import { ref } from 'vue'

// Create refs to hold the NDK instances
const ndk = ref<NDK>()
const ndkStore = ref<NDKStore>()
const initialized = ref(false)
const metadataNdk = ref<NDK>()
const initializing = ref(false)

// Create a function to initialize NDK
export async function initializeNDK() {
  if (initialized.value) return { ndk: ndk.value, metadataNdk: metadataNdk.value, ndkStore: ndkStore.value, initializing: initializing.value }
  if (initializing.value) return { ndk: ndk.value, metadataNdk: metadataNdk.value, ndkStore: ndkStore.value, initializing: initializing.value }

  initializing.value = true
  const cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'ndk-cache' })

  let signer: NDKNip07Signer | null = null
  try {
    signer = new NDKNip07Signer();
  } catch (e) {
    console.error('Failed to create signer', e)
    return
  }

  const pubkey = (await signer.user()).pubkey



  const metadataNdkInstance = new NDK({
    signer: new NDKNip07Signer(),
    explicitRelayUrls: [
      "wss://nostr-pub.wellorder.net",
      "wss://relay.damus.io",
      "wss://nostr.wine",
      "wss://nos.lol",
      "wss://nostr.mom",
      "wss://atlas.nostr.land",
      "wss://relay.snort.social",
      "wss://offchain.pub",
      "wss://relay.primal.net",
      "wss://relay.nostr.band",
    ],
    cacheAdapter,
    autoConnectUserRelays: true, 
  })

 

  await metadataNdkInstance.connect(1000)

  console.log('Connected to metadata NDK')

  const filter = {
    kinds: [10050],
    authors: [pubkey]
  };

  const inboxRelaysEvent = await metadataNdkInstance.fetchEvent(filter, { dontSaveToCache: true })

  const inboxRelays = inboxRelaysEvent?.getMatchingTags('relay').map(r => r[1]) ?? []
  
  // for (const relay of metadataNdk.pool.connectedRelays()) {
  //   relay.disconnect()
  // }
  
  const ndkInstance = new NDK({
    signer: new NDKNip07Signer(),
    explicitRelayUrls: inboxRelays,
    autoConnectUserRelays: false, // don't connect to user's relays automatically as these are only for publishing
    cacheAdapter
  })

  ndkInstance.relayAuthDefaultPolicy = NDKRelayAuthPolicies.signIn({ndk: ndkInstance})

  ndkInstance.pool.on('relay:auth', (relay: NDKRelay, auth) => {
    console.log('relay:auth', relay.url, auth)
  })


  ndkInstance.pool.on('relay:authed', (relay: NDKRelay) => {
    console.log('relay:authed', relay.url)
  })
    
  await ndkInstance.connect()
  
  const self = await ndkInstance.signer?.user()

  if (!self) {
    console.error('No self')
    return
  }

  // Initialize the NDK store
  const ndkStoreInstance = new NDKStore(ndkInstance)

  // Set the refs
  ndk.value = ndkInstance
  ndkStore.value = ndkStoreInstance
  metadataNdk.value = metadataNdkInstance
  initialized.value = true
  initializing.value = false
  console.log('Initialized NDK')

  return {
    ndk: ndk.value,
    ndkStore: ndkStore.value,
    metadataNdk: metadataNdk.value
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

  function getNdk() {
    return ndk.value
  }

  function getMetadataNdk() {
    return metadataNdk.value
  }

  return {
    ndk: ndk.value,
    metadataNdk: metadataNdk.value,
    initialized: initialized.value,
    initializing: initializing.value,
    subscribe,
    query,
    getSelf,
    getNdk,
    getMetadataNdk
  }
} 