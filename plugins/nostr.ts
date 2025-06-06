import { useNostrStore } from '~/stores/nostr'
import { initializeNDK } from '~/composables/useNostrClient'
// import { NSchema } from '@nostrify/nostrify'
import { NDKUser, type NDKTag } from '@nostr-dev-kit/ndk'

export default defineNuxtPlugin(async () => {
  // // Initialize NDK and get instances
  // const { ndk, metadataNdk } = await initializeNDK()
  
  // // Initialize store and fetch initial data
  // const store = useNostrStore()

  // const selfPubkey = (await (ndk!.signer)!.user()).pubkey
  // store.setCurrentPubkey(selfPubkey)
  
  // ndk?.subscribe([{
  //   kinds: [1059],
  //   "#p": [selfPubkey]
  // }], {
  //   closeOnEose: false
  // }, {
  //   onEvent: async (event) => {
  //     console.log('event', event.relay?.url, event.id)
  //     try {
  //       const sender = new NDKUser({
  //         pubkey: event.pubkey
  //       })
  //       const unwrapped = await ndk?.signer?.decrypt(sender, event.content, 'nip44')

  //       if (!unwrapped) {
  //         console.error('Failed to unwrap event')
  //         return
  //       }

  //       const parsed = JSON.parse(unwrapped)

  //       const sealSender = new NDKUser({
  //         pubkey: parsed.pubkey
  //       })
  //       const unsealed = await ndk?.signer?.decrypt(sealSender, parsed.content, 'nip44')
      
  //       if (!unsealed) {
  //         console.error('Failed to unseal event')
  //         return
  //       }

  //       const parsedUnsealed = JSON.parse(unsealed)
  //       if (!parsedUnsealed.id || parsedUnsealed.id.length === 0) {
  //         parsedUnsealed.id = event.id
  //       }

  //       if (!parsedUnsealed.pubkey || parsedUnsealed.pubkey.length === 0) {
  //         parsedUnsealed.pubkey = parsed.pubkey
  //       }

  //       const subject = parsedUnsealed.tags.find((tag: NDKTag) => tag[0] === 'subject')
  //       if (subject) {
  //         console.log('subject', subject[1])
  //       }

  //       await store.processEncryptedEvent(parsedUnsealed, parsedUnsealed.pubkey === selfPubkey)
  //     } catch (error) {
  //       console.error('Error decrypting event', error)
  //     }
  //   },
  //   onEvents: (events) => {
  //     console.log('events', events)
  //   }
  // })


    
  return {
    provide: {
      // The composable useNostrClient() should be used instead of these
      // These are kept for backward compatibility
      // ndk,
      // metadataNdk,
      // nostrSubscribe: (filter: any) => ndk?.subscribe(filter)
    }
  }
}) 