import { defineStore } from 'pinia'
import { useNostrClient } from '~/composables/useNostrClient'
import { NDKEvent } from '@nostr-dev-kit/ndk'

export const useRelayStore = defineStore('relays', {
  state: () => ({
    connectedRelays: [] as string[],
    readRelays: [] as string[],
    writeRelays: [] as string[],
    dmRelays: [] as string[],
    isLoading: false,
    isLoaded: false
  }),
  
  actions: {
    async fetchRelayInfo() {
      if (this.isLoaded) return
      this.isLoading = true
      const { ndk } = useNostrClient()
      
      try {
        // Get currently connected relays
        if (ndk?.pool?.relays) {
          this.connectedRelays = Array.from(ndk.pool.relays.keys())
        }
        
        // Get user from signer
        const user = await ndk?.signer?.user()
        if (user) {
          await user.fetchProfile()
          
          // Clear previous relay data
          this.readRelays = []
          this.writeRelays = []
          this.dmRelays = []
          
          // // Fetch NIP-65 relay list (kind: 10002)
          // const nip65Events = await ndk?.fetchEvents({
          //   kinds: [10002],
          //   authors: [user.pubkey]
          // })
          
          // if (nip65Events) {
          //   const nip65Event = Array.from(nip65Events)[0]
          //   if (nip65Event) {
          //     // Process relay tags
          //     nip65Event.tags.forEach(tag => {
          //       if (tag[0] === 'r') {
          //         const relayUrl = tag[1]
          //         const marker = tag[2]
                  
          //         if (!marker || marker === 'read') {
          //           this.readRelays.push(relayUrl)
          //         }
                  
          //         if (!marker || marker === 'write') {
          //           this.writeRelays.push(relayUrl)
          //         }
          //       }
          //     })
          //   }
          // }
          
          // Fetch DM relay list (kind: 10050) from NIP-51
          const dmRelayEvents = await ndk?.fetchEvents({
            kinds: [10050],
            authors: [user.pubkey]
          })
          
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
    
    async addReadRelay(relayUrl: string) {
      if (!this.readRelays.includes(relayUrl)) {
        const { ndk } = useNostrClient()
        const user = await ndk?.signer?.user()
        
        if (user && ndk) {
          // Create or update NIP-65 event
          const event = new NDKEvent(ndk, {
            kind: 10002,
            content: '',
            tags: [
              ...this.readRelays.map(url => ['r', url, 'read']),
              ...this.writeRelays.filter(url => !this.readRelays.includes(url)).map(url => ['r', url, 'write']),
              ['r', relayUrl, 'read']
            ],
            created_at: Math.floor(Date.now() / 1000)
          })
          
          // Sign and publish the event
          await event.sign()
          await event.publish()
          
          // Update local state
          this.readRelays.push(relayUrl)
        }
      }
    },
    
    async addWriteRelay(relayUrl: string) {
      if (!this.writeRelays.includes(relayUrl)) {
        const { ndk } = useNostrClient()
        const user = await ndk?.signer?.user()
        
        if (user && ndk) {
          // Create or update NIP-65 event
          const event = new NDKEvent(ndk, {
            kind: 10002,
            content: '',
            tags: [
              ...this.readRelays.filter(url => !this.writeRelays.includes(url)).map(url => ['r', url, 'read']),
              ...this.writeRelays.map(url => ['r', url, 'write']),
              ['r', relayUrl, 'write']
            ],
            created_at: Math.floor(Date.now() / 1000)
          })
          
          // Sign and publish the event
          await event.sign()
          await event.publish()
          
          // Update local state
          this.writeRelays.push(relayUrl)
        }
      }
    },
    
    async addDMRelay(relayUrl: string) {
      if (!this.dmRelays.includes(relayUrl)) {
        const { ndk } = useNostrClient()
        const user = await ndk?.signer?.user()
        
        if (user && ndk) {
          // Create or update NIP-51 DM relay event
          const event = new NDKEvent(ndk, {
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
    
    async deleteReadRelay(relayUrl: string) {
      const { ndk } = useNostrClient()
      const user = await ndk?.signer?.user()
      
      if (user && ndk) {
        // Remove from read relays
        this.readRelays = this.readRelays.filter(url => url !== relayUrl)
        
        // Create or update NIP-65 event
        const event = new NDKEvent(ndk, {
          kind: 10002,
          content: '',
          tags: [
            ...this.readRelays.map(url => ['r', url, 'read']),
            ...this.writeRelays.filter(url => !this.readRelays.includes(url)).map(url => ['r', url, 'write'])
          ],
          created_at: Math.floor(Date.now() / 1000)
        })
        
        // Sign and publish the event
        await event.sign()
        await event.publish()
      }
    },
    
    async deleteWriteRelay(relayUrl: string) {
      const { ndk } = useNostrClient()
      const user = await ndk?.signer?.user()
      
      if (user && ndk) {
        // Remove from write relays
        this.writeRelays = this.writeRelays.filter(url => url !== relayUrl)
        
        // Create or update NIP-65 event
        const event = new NDKEvent(ndk, {
          kind: 10002,
          content: '',
          tags: [
            ...this.readRelays.filter(url => !this.writeRelays.includes(url)).map(url => ['r', url, 'read']),
            ...this.writeRelays.map(url => ['r', url, 'write'])
          ],
          created_at: Math.floor(Date.now() / 1000)
        })
        
        // Sign and publish the event
        await event.sign()
        await event.publish()
      }
    },
    
    async deleteDMRelay(relayUrl: string) {
      const { ndk } = useNostrClient()
      const user = await ndk?.signer?.user()
      
      if (user && ndk) {
        // Remove from DM relays
        this.dmRelays = this.dmRelays.filter(url => url !== relayUrl)
        
        // Create or update NIP-51 DM relay event
        const event = new NDKEvent(ndk, {
          kind: 10050,
          content: '',
          tags: this.dmRelays.map(url => ['relay', url]),
          created_at: Math.floor(Date.now() / 1000)
        })
        
        // Sign and publish the event
        await event.sign()
        await event.publish()
      }
    }
  }
}) 