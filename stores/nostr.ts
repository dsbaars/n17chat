import { defineStore } from 'pinia'
import Dexie from 'dexie'
import type { NostrEvent, Contact } from '~/types/nostr'
import { useNostrClient } from '~/composables/useNostrClient'

class NostrDatabase extends Dexie {
  events!: Dexie.Table<NostrEvent, string>
  contacts!: Dexie.Table<Contact, string>
  
  constructor() {
    super('nostr')
    this.version(1).stores({
      events: 'id, pubkey, created_at, kind, recipient, isSent',
      contacts: 'pubkey, name, lastMessageTime, hidden, profile'
    })
  }
}

const db = new NostrDatabase()

export const useNostrStore = defineStore('nostr', {
  state: () => ({
    currentPubkey: '',
    contacts: [] as Contact[],
    loadedEvents: [] as NostrEvent[],
    selectedContact: null as Contact | null
  }),
  
  actions: {
    async saveEvent(event: NostrEvent, isSent: boolean = false) {
      // Find recipient from tags if it exists (format is ["p", "pubkey"])
      const recipientTag = event.tags.find(tag => tag[0] === 'p')
      const recipient = recipientTag ? recipientTag[1] : undefined
      
      // Add isSent and recipient to the event object for storage
      const eventToStore = {
        ...event,
        isSent,
        recipient
      }
      
      if (!event.id ||event.id.length === 0) {
        console.error('Event has no id', event)
        return
      }

      await db.events.put(eventToStore)
      this.loadedEvents.push(event)
      
      // If this is a sent message, update the contact's last message info
      if (isSent && recipient) {
        this.updateContactLastMessage(recipient, event.content, new Date(event.created_at * 1000))
      }
    },
    
    async processEncryptedEvent(event: NostrEvent, isSenderSelf: boolean) {
      try {
        // Find recipient from tags if it exists (format is ["p", "pubkey"])
        const recipientTag = event.tags.find(tag => tag[0] === 'p')
        const recipient = recipientTag ? recipientTag[1] : undefined
        
        // Save the event
        await this.saveEvent(event, isSenderSelf)
        
        // If the selected contact is the sender of this message, update the UI
        if (this.selectedContact && 
            ((isSenderSelf && this.selectedContact.pubkey === recipient) || 
             (!isSenderSelf && this.selectedContact.pubkey === event.pubkey))) {
          this.loadedEvents.push(event)
        }
        
        // If sender is not self, update contact with latest message
        if (!isSenderSelf && event.pubkey) {
          this.updateContactLastMessage(
            event.pubkey, 
            event.content, 
            new Date(event.created_at * 1000)
          )
        }
        
        return true
      } catch (error) {
        console.error('Error processing encrypted event', event, error)
        return false
      }
    },
    
    async updateContactLastMessage(pubkey: string, message: string, time: Date) {
      // Check if contact exists
      let contact = await db.contacts.get(pubkey)
      let updated = false
      
      if (contact) {
        // Update existing contact
        if (!contact.lastMessageTime || time > contact.lastMessageTime) {
          await db.contacts.update(pubkey, {
            lastMessage: message,
            lastMessageTime: time
          })
          
          // Update in memory if in contacts list
          const contactIndex = this.contacts.findIndex(c => c.pubkey === pubkey)
          if (contactIndex !== -1) {
            this.contacts[contactIndex] = {
              ...this.contacts[contactIndex],
              lastMessage: message,
              lastMessageTime: time
            }
          }
          updated = true
        }
      } else {
        // Create new contact if it doesn't exist
        contact = {
          pubkey,
          lastMessage: message,
          lastMessageTime: time
        }
        await db.contacts.put(contact)
        
        // Try to get profile information
        this.updateContactProfile(pubkey)
        
        // Add to contacts list
        this.contacts.push(contact)
        updated = true
      }
      
      // Resort contacts if there was an update
      if (updated) {
        this.contacts = this.contacts.sort((a, b) => {
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        })
      }
      
      return contact
    },
    
    async getEventsByPubkey(pubkey: string) {
      // Get messages received from this pubkey
      const receivedEvents = await db.events
        .where('pubkey')
        .equals(pubkey)
        .toArray()
      
      // Get messages sent to this pubkey (where recipient is this pubkey)
      const sentEvents = await db.events
        .where('recipient')
        .equals(pubkey)
        .and(event => !!event.isSent)
        .toArray()
      
      // Make sure all events have proper isSent property set
      const processedEvents = [
        ...receivedEvents.map(event => ({ ...event, isSent: false })),
        ...sentEvents.map(event => ({ ...event, isSent: true }))
      ]
      
      // Combine both sets of events
      return processedEvents
    },
    
    async getEvent(id: string) {
      return await db.events.get(id)
    },
    
    async loadEventsFromRelays(pubkey: string) {
      const { ndkStore, initialized } = useNostrClient()
      
      if (!initialized || !ndkStore) {
        console.warn('NDK not initialized yet')
        return
      }
      
      try {
        const sub = await ndkStore.query([{ kinds: [1059], "#p": [pubkey] }])
        
        for await (const event of sub) {
          if ('sig' in event && event.sig) {
            await this.saveEvent(event)
          }
        }
      } catch (error) {
        console.error('Error loading events from relays', error)
      }
    },
    
    async loadContactsFromDb() {
      try {
        let contacts = await db.contacts.toArray()

        // Filter out hidden contacts
        contacts = contacts.filter(contact => !contact.hidden)
        
        // Sort contacts by lastMessageTime (newest first)
        this.contacts = contacts.sort((a, b) => {
          // Handle undefined lastMessageTime
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        })
        
        return this.contacts
      } catch (error) {
        console.error('Error loading contacts from database', error)
        return []
      }
    },

    setCurrentPubkey(pubkey: string) {
      this.currentPubkey = pubkey
    },
    
    async updateContactProfile(pubkey: string) {
      try {
        const { ndk } = useNostrClient()
        if (!ndk) return null
        
        const profile = { ...(await ndk.getUser({ pubkey }).fetchProfile()) }

        if (!profile) return null
        
        // Check if contact exists
        let contact = await db.contacts.get(pubkey)
        
        if (contact) {
          // Update existing contact
          contact.name = profile.name
          contact.picture = profile.picture
          contact.profile = profile
          await db.contacts.update(pubkey, {
            name: profile.name,
            picture: profile.picture,
            profile: profile
          })
        } else {
          // Create new contact if it doesn't exist
          contact = {
            pubkey,
            name: profile.name,
            picture: profile.picture,
            profile: profile
          }
          await db.contacts.put(contact)
        }
        
        // Update in memory if in contacts list
        const contactIndex = this.contacts.findIndex(c => c.pubkey === pubkey)
        if (contactIndex !== -1) {
          this.contacts[contactIndex] = {
            ...this.contacts[contactIndex],
            name: profile.name,
            picture: profile.picture,
            profile: profile
          }
        }
        
        return contact
      } catch (error) {
        console.error('Error updating contact profile for ', pubkey, error)
        return null
      }
    },
    
    async getContacts() {
      // First try to load contacts from DB for immediate display
      await this.loadContactsFromDb()
      
      const uniquePubkeys = await db.events
        .orderBy('pubkey')
        .uniqueKeys()
      
      const contacts: Contact[] = []

      const { ndk } = useNostrClient()
      
      for (const pubkey of uniquePubkeys as string[]) {
        // First check if the contact already exists in the contacts table
        let contact = await db.contacts.get(pubkey as string)
        
        // Skip if contact is hidden
        if (contact && contact.hidden) continue
        
        const latestEvent = await db.events
          .where('pubkey')
          .equals(pubkey)
          .reverse()
          .first()
          
        if (latestEvent) {
          if (!contact) {
            // If contact doesn't exist, create a new one
            contact = {
              pubkey: pubkey as string,
              lastMessage: latestEvent.kind == 15 ? '🖼' : latestEvent.content,
              lastMessageTime: new Date(latestEvent.created_at * 1000),
              hidden: false
            }
            
            // Try to fetch profile information
            try {
              const profile = await ndk?.getUser({ pubkey: pubkey as string }).fetchProfile()
              if (profile) {
                contact.name = profile.name
                contact.picture = profile.image
              }
            } catch (error) {
              console.error('Error fetching profile', error)
            }
            
            // Save to contacts table
            await db.contacts.put(contact)
          } else {
            // Update the last message if newer
            const eventTime = new Date(latestEvent.created_at * 1000)
            if (!contact.lastMessageTime || eventTime > contact.lastMessageTime) {
              contact.lastMessage = latestEvent.kind == 15 ? '🖼' : latestEvent.content
              contact.lastMessageTime = eventTime
              await db.contacts.update(pubkey as string, {
                lastMessage: latestEvent.kind == 15 ? '🖼' : latestEvent.content,
                lastMessageTime: eventTime
              })
            }
          }
          
          contacts.push(contact)
        }
      }
      
      // Combine and sort all contacts by lastMessageTime (newest first)
      this.contacts = [...this.contacts, ...contacts]
        .filter((contact, index, self) => 
          self.findIndex(c => c.pubkey === contact.pubkey) === index)
        .filter(contact => !contact.hidden) // Filter out hidden contacts
        .sort((a, b) => {
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        })
      
      return this.contacts
    },

    getContact(pubkey: string) {
      return this.contacts.find(c => c.pubkey === pubkey)
    },
    
    async selectContact(contact: Contact) {
      this.selectedContact = contact

      // Update contact profile
      const updatedContact = await this.updateContactProfile(contact.pubkey)
      if (updatedContact) {
        this.selectedContact = updatedContact
      }
      
      // Load new events when selecting a contact
      //this.loadEventsFromRelays(contact.pubkey)
    },
    
    async loadAllContacts() {
      // First load contacts from database
      await this.loadContactsFromDb()
      
      try {
        // Find all pubkeys that received messages from current user
        const sentEvents = await db.events
          .where('isSent')
          .equals(1)  // Using 1 instead of true for IndexableType
          .toArray()
        
        // Extract unique recipient pubkeys
        const recipientPubkeys = [...new Set(sentEvents
          .filter(event => event.recipient)
          .map(event => event.recipient as string))]
        
        // Process each recipient
        for (const pubkey of recipientPubkeys) {
          // Check if this contact already exists
          if (!this.getContact(pubkey)) {
            // Check if contact exists but is hidden
            const existingContact = await db.contacts.get(pubkey)
            if (existingContact && existingContact.hidden) continue
            
            // Find latest message to this contact
            const latestEvent = sentEvents
              .filter(event => event.recipient === pubkey)
              .sort((a, b) => b.created_at - a.created_at)[0]
            
            if (latestEvent) {
              // Create contact
              const contact = {
                pubkey,
                lastMessage: latestEvent.kind == 15 ? '🖼' : latestEvent.content,
                lastMessageTime: new Date(latestEvent.created_at * 1000),
                hidden: false
              }
              
              // Save to database
              await db.contacts.put(contact)
              
              // Add to contacts list
              this.contacts.push(contact)
              
              // Try to get profile information
              this.updateContactProfile(pubkey)
            }
          }
        }
        
        // Sort contacts by lastMessageTime (newest first)
        this.contacts = this.contacts.sort((a, b) => {
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        })
        
        return this.contacts
      } catch (error) {
        console.error('Error loading all contacts', error)
        return this.contacts
      }
    },
    sendDirectMessage(pubkey: string, message: string) {
      const { ndk } = useNostrClient()
      if (!ndk) return
      
      // Use the appropriate method or handle the direct message sending
      // ndk.sendDirectMessage(pubkey, message)
      console.log('Sending message to', pubkey, message)
      // Implementation should be provided based on the NDK's actual API
    },
    async hideContact(pubkey: string) {
      // Update the contact in the database
      await db.contacts.update(pubkey, { hidden: true })
      
      // Remove from current contacts list
      this.contacts = this.contacts.filter(c => c.pubkey !== pubkey)
      
      // If this was the selected contact, deselect it
      if (this.selectedContact?.pubkey === pubkey) {
        this.selectedContact = null
      }
    },
    
    async showContact(pubkey: string) {
      // Update the contact in the database
      await db.contacts.update(pubkey, { hidden: false })
      
      // Refresh contacts list
      await this.getContacts()
    },
    
    async createOrSelectContact(contactData: { pubkey: string, name?: string, picture?: string }) {
      // Check if contact already exists
      const contact = await db.contacts.get(contactData.pubkey)
      
      if (contact) {
        // If it exists but is hidden, unhide it
        if (contact.hidden) {
          await this.showContact(contactData.pubkey)
        }
        
        // Select the contact
        this.selectContact(contact)
      } else {
        // Create new contact with the provided data
        const newContact = {
          pubkey: contactData.pubkey,
          name: contactData.name,
          picture: contactData.picture,
          hidden: false
        }
        
        // Save to database
        await db.contacts.put(newContact)
        
        // Add to contacts list and select it
        this.contacts.push(newContact)
        this.selectContact(newContact)
      }
    }
  }

}) 