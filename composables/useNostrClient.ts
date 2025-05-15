import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import type { NDKRelay } from '@nostr-dev-kit/ndk';
import NDK, { NDKNip07Signer, NDKRelayAuthPolicies } from '@nostr-dev-kit/ndk'
import { NDKStore } from '@nostrify/ndk'
import { ref } from 'vue'

// Create refs to hold the NDK instances
const ndk = ref<NDK>()
const ndkStore = ref<NDKStore>()
const initialized = ref(false)
const inboxRelays = ref<string[]>([])



// Create a function to initialize NDK
export async function initializeNDK() {
  if (initialized.value) return { ndk: ndk.value, ndkStore: ndkStore.value }
  
  const cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'ndk-cache' })
  
  const signer = new NDKNip07Signer();
  const pubkey = (await signer.user()).pubkey

  const bootstrapNdk = new NDK({
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
    autoConnectUserRelays: false, // don't connect to user's relays automatically as these are only for publishing
  })

  await bootstrapNdk.connect()

  const filter = {
    kinds: [10050],
    authors: [pubkey]
  };

  const inboxRelaysEvent = await bootstrapNdk.fetchEvent(filter, { dontSaveToCache: true })

  inboxRelays.value = inboxRelaysEvent?.getMatchingTags('relay').map(r => r[1]) ?? []
  
  for (const relay of bootstrapNdk.pool.connectedRelays()) {
    relay.disconnect()
  }
  
  const ndkInstance = new NDK({
    signer: new NDKNip07Signer(),
    explicitRelayUrls: inboxRelays.value,
    autoConnectUserRelays: false, // don't connect to user's relays automatically as these are only for publishing
    cacheAdapter
  })

  ndkInstance.relayAuthDefaultPolicy = NDKRelayAuthPolicies.signIn({ndk: ndkInstance})

  // ndkInstance.pool.on('relay:connect', (relay: NDKRelay) => {
  //   console.log('relay:connected', relay.url)
  // })

  // ndkInstance.pool.on('relay:disconnect', (relay: NDKRelay) => {
  //   console.log('relay:disconnect', relay.url)
  // })

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
    inboxRelays: inboxRelays.value,
    subscribe,
    query,
    getSelf
  }
} 