import { NDKEvent, NDKPrivateKeySigner, NDKRelaySet, NDKUser, type NDKTag } from "@nostr-dev-kit/ndk";
import type NDK from "@nostr-dev-kit/ndk";
import { NostrKind } from "~/types/nostr";

export async function giftWrap(ndk: NDK, content: string, targetUser: NDKUser) {
    const signer = await ndk.signer

    if (!signer) {
        throw new Error('No signer found')
    }

    const sealContent = await signer.encrypt(targetUser, JSON.stringify(content), 'nip44')

    const seal = new NDKEvent(ndk, {
        kind: NostrKind.Seal,
        content: sealContent,
        created_at: Math.floor(Date.now() / 1000),
    })

    await seal.sign();

    const ephemeralKey = NDKPrivateKeySigner.generate()
    const giftWrapContent = await ephemeralKey.encrypt(targetUser, JSON.stringify(seal), 'nip44')

    const giftWrap = new NDKEvent(ndk, {
        kind: NostrKind.GiftWrap,
        content: giftWrapContent,
        tags: [['p', targetUser.pubkey]],
        created_at: Math.floor(Date.now() / 1000),
    })

    await giftWrap.sign(ephemeralKey);

    return giftWrap
}

export async function ungiftWrap(ndk: NDK, event: NDKEvent) {
    const signer = await ndk.signer

    if (!signer) {
        throw new Error('No signer found')
    }

      const unwrapped = await signer.decrypt(event.author, event.content, 'nip44')

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

      return parsedUnsealed
}

export async function sendPrivateDirectMessage(ndk: NDK, pubkey: string, message: string) {
    const signer = await ndk.signer
    const sender = await signer?.user()

    const recipient = await ndk.getUser({
        pubkey: pubkey
    })

    if (!recipient) {
        throw new Error('Recipient not found')
    }

    if (!sender) {
        throw new Error('Sender not found')
    }

    const rumor = {
        kind: NostrKind.DirectMessage,
        content: message,
        tags: [['p', pubkey]],
        created_at: Math.floor(Date.now() / 1000),
    }

    const wraps = await Promise.all([
        giftWrap(ndk, rumor, recipient),
        giftWrap(ndk, rumor, sender),
    ]);

    await Promise.all(
        wraps.map(async (wrap) => {
            const dmRelays = await getInboxDMRelays(ndk, wrap.pubkey)
            const writeRelays = NDKRelaySet.fromRelayUrls(dmRelays, ndk);
            const published = await wrap.publish(writeRelays)
            return published
        })
    )

    return wraps
}

export async function getInboxDMRelays(ndk: NDK, pubkey: string) {
    const event = await ndk.fetchEvent({
        authors: [pubkey],
        "kinds": [10050],
        limit: 1,
    });

    if (!event) {
        return []
    }

    return event.tags.filter((tag: NDKTag) => tag[0] === 'relay').map((tag: NDKTag) => tag[1])
}

export async function getFollows(ndk: NDK, pubkey: string) {
    const user = await ndk.getUser({
        pubkey: pubkey
    })

    if (!user) {
        return []
    }

    return user.followSet()
}

export function getOutboxRelays(pubkey: string) {
    return `wss://relay.damus.io?pubkey=${pubkey}`
}