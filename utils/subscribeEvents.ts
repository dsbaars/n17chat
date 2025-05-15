import { NDKUser, type NDKTag } from "@nostr-dev-kit/ndk"
import { useNostrStore } from "~/stores/nostr"
import { initializeNDK } from "~/composables/useNostrClient"
import { useRelayStore } from "~/stores/relays"

export async function subscribeEvents() {
  const { ndk, metadataNdk } = await initializeNDK()
  const follows = await getFollows(metadataNdk, (await metadataNdk?.signer?.user())?.pubkey)

  // Initialize store and fetch initial data
  const store = useNostrStore()
  const relayStore = useRelayStore()

  await relayStore.fetchRelayInfo()

  const selfPubkey = (await (ndk!.signer)!.user()).pubkey
  store.setCurrentPubkey(selfPubkey)
  
  ndk?.subscribe([{
    kinds: [1059],
    "#p": [selfPubkey]
  }], {
    closeOnEose: false
  }, {
    onEvent: async (event) => {
      try {
        const sender = new NDKUser({
          pubkey: event.pubkey
        })
        const unwrapped = await ndk?.signer?.decrypt(sender, event.content, 'nip44')

        if (!unwrapped) {
          console.error('Failed to unwrap event')
          return
        }

        const parsed = JSON.parse(unwrapped)

        const sealSender = new NDKUser({
          pubkey: parsed.pubkey
        })
        const unsealed = await ndk?.signer?.decrypt(sealSender, parsed.content, 'nip44')
      
        if (!unsealed) {
          console.error('Failed to unseal event')
          return
        }

        const parsedUnsealed = JSON.parse(unsealed)
        if (!parsedUnsealed.id || parsedUnsealed.id.length === 0) {
          parsedUnsealed.id = event.id
        }

        if (!parsedUnsealed.pubkey || parsedUnsealed.pubkey.length === 0) {
          parsedUnsealed.pubkey = parsed.pubkey
        }

        const subject = parsedUnsealed.tags.find((tag: NDKTag) => tag[0] === 'subject')
        if (subject) {
          console.log('subject', subject[1])
        }

        await store.processEncryptedEvent(parsedUnsealed, parsedUnsealed.pubkey === selfPubkey)
      } catch (error) {
        console.error('Error decrypting event', error)
      }
    },
    onEvents: (events) => {
      console.log('events', events)
    }
  })

  console.log('KLAAR')
}