import { defineStore } from 'pinia'
import { useNostrClient } from '~/composables/useNostrClient'
import { NDKEvent, NDKRelayAuthPolicies, NDKRelaySet } from '@nostr-dev-kit/ndk'



export const useRelayStore = defineStore('relays', {
  state: () => ({
    connectedRelays: [] as string[],
    readRelays: [] as string[],
    writeRelays: [] as string[],
    dmRelays: [] as string[],
    isLoading: false,
    isLoaded: false,
    publishRelaySet: null as NDKRelaySet | null,
  }),
  
  actions: {
    async fetchRelayInfo() {
      if (this.isLoaded) return
      this.isLoading = true
      const { metadataNdk } = useNostrClient()

      if (!metadataNdk) {
        return
      }
      
      try {
        // Get currently connected relays
        if (metadataNdk?.pool?.relays) {
          this.connectedRelays = Array.from(metadataNdk.pool.relays.keys())
        }
        
        // Get user from signer
        const user = await metadataNdk?.signer?.user()
        if (user) {
          await user.fetchProfile()
          
          this.dmRelays = []
           
          // Fetch DM relay list (kind: 10050) from NIP-51
          const dmRelayEvents = await metadataNdk?.fetchEvents({
            kinds: [10050],
            authors: [user.pubkey]
          }, { closeOnEose: true })
          
          if (dmRelayEvents) {
            const dmRelayEvent = Array.from(dmRelayEvents)[0]
            if (dmRelayEvent) {
              // Process DM relay tags
              dmRelayEvent.tags.forEach(tag => {
                if (tag[0] === 'relay') {
                  this.dmRelays.push(tag[1])
                }
              })
            }
          }
        }
        this.isLoaded = true
      } catch (error) {
        console.error('Error fetching relay information:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    /**
     * Check if a relay is currently connected
     * @param relayUrl The URL of the relay to check
     * @returns Boolean indicating whether the relay is connected
     */
    isConnected(relayUrl: string): boolean {
      const { ndk } = useNostrClient()
      
      if (!ndk?.pool?.relays) {
        return false
      }
      
      return ndk.pool.isRelayConnected(relayUrl)
    },
      
    async addDMRelay(relayUrl: string) {
      

      if (!this.dmRelays.includes(relayUrl)) {
        const { metadataNdk } = useNostrClient()
        const user = await metadataNdk?.signer?.user()
        
        if (user && metadataNdk) {
          // Create or update NIP-51 DM relay event
          const event = new NDKEvent(metadataNdk, {
            kind: 10050,
            content: '',
            tags: [
              ...this.dmRelays.map(url => ['relay', url]),
              ['relay', relayUrl]
            ],
            created_at: Math.floor(Date.now() / 1000)
          })
          


          // Sign and publish the event
          await event.sign()
          await event.publish()
          
          // Update local state
          this.dmRelays.push(relayUrl)
        }
      }
    },
     
    async deleteDMRelay(relayUrl: string) {
      const { ndk, metadataNdk } = useNostrClient()
      const user = await metadataNdk?.signer?.user()
      
      this.publishRelaySet = NDKRelaySet.fromRelayUrls([
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
      ], metadataNdk, true)

      if (user && metadataNdk) {
        // Remove from DM relays
        this.dmRelays = this.dmRelays.filter(url => url !== relayUrl)
        
        ndk?.pool.removeRelay(relayUrl);

        // Create or update NIP-51 DM relay event
        const event = new NDKEvent(metadataNdk, {
          kind: 10050,
          content: '',
          tags: this.dmRelays.map(url => ['relay', url]),
          created_at: Math.floor(Date.now() / 1000)
        })
        
        // Sign and publish the event
        await event.sign()
        const res = await event.publish()
        console.log('deleteDMRelay', res)
      }
    }
  }
}) 