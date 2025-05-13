<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import type { Message } from '~/types/nostr'
import { hexToBytes } from '@noble/hashes/utils'


const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['openModal'])

const { ndk } = useNostrClient()
const nostrStore = useNostrStore()
const imageUrl = ref('')

// Format timestamp for messages
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (date >= today) {
    return date.toLocaleTimeString([(new Intl.NumberFormat()).resolvedOptions().locale], { hour: '2-digit', minute: '2-digit', hour12: false })
  } else {
    return date.toLocaleString([(new Intl.NumberFormat()).resolvedOptions().locale], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  }

}

// Check if message is from the current user
const isCurrentUser = (message) => {
  // If the message has isSent flag set, it was sent by the current user
  if (message.isSent) return true

  // Otherwise, check if the pubkey matches the current user's pubkey
  return message.pubkey === nostrStore.currentPubkey
}
const decryptImageContent = async (content: Message) => {
  const fileType = content.tags.find(t => t[0] == 'file-type')?.[1]!

  const encryptionAlgorithm = content.tags.find(t => t[0] == 'encryption-algorithm')?.[1]!
  const decryptionKey = content.tags.find(t => t[0] == 'decryption-key')?.[1]!
  const decryptionNonce = content.tags.find(t => t[0] == 'decryption-nonce')?.[1]!
  try {
    const encryptedData = await fetch(content.content, { redirect: 'follow' });


    const encryptedDataArrayBuffer = await encryptedData.arrayBuffer();
  console.log(`${content.content} bytes: ${encryptedDataArrayBuffer.byteLength}`)

  const keyBytes = hexToBytes(decryptionKey) // 32 bytes for AES-256
  const nonceBytes = hexToBytes(decryptionNonce) // 16 bytes for AES-GCM

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: encryptionAlgorithm },
    false,
    ['decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: encryptionAlgorithm,
      iv: nonceBytes,
    },
    cryptoKey,
    encryptedDataArrayBuffer
  );

  const blob = new Blob([decryptedData], { type: fileType });

    imageUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error decrypting image', {...content}, error)
  }
}

const openModal = () => {
  console.log('openModal', props.message)
  emit('openModal', props.message)
}
const closeModal = () => {
  isModalOpen.value = false
}
onMounted(() => {
  if (props.message.kind == 15) {
    decryptImageContent(props.message).then(() => {
      nextTick()
    })
  }
})

const scrollToReply = () => {
  const element = document.getElementsByName('e' + props.message.tags.find(t => t[0] == 'e')?.[1])
  if (element.length > 0) {
    element[0].scrollIntoView({ behavior: 'smooth' })
  }
}

const getSubject = () => {
  if (props.message.tags.find(t => t[0] == 'subject')?.length > 0) {
    return props.message.tags.find(t => t[0] == 'subject')?.[1]
  }
  return null;
}
</script>

<template>
  <section v-if="getSubject()">
    <h3 class="text-lg font-bold">{{ getSubject() }}</h3>
  </section>
  <div class="chat" :class="isCurrentUser(message) ? 'chat-end' : 'chat-start'" :name="'e' + message.id">
    <div class="chat-image avatar">
      <div v-if="nostrStore.getContact(message.pubkey)?.picture" class="w-10 rounded-full">
        <img :src="nostrStore.getContact(message.pubkey)?.picture">
      </div>
    </div>
    <div class="chat-bubble" :class="isCurrentUser(message) ? 'chat-bubble-primary' : 'chat-bubble-accent'">
      <section v-if="message.kind == 15">
        <img :src="imageUrl" class="w-96 h-auto object-cover">
      </section>
      <section v-else>
        <div v-if="message.tags.find(t => t[0] == 'e')?.length > 0" class="mb-2 text-xs">
        
        Reply to: <a :href="'#e' + message.tags.find(t => t[0] == 'e')?.[1]" @click="scrollToReply">{{ message.tags.find(t => t[0] == 'e')?.[1] }}</a>
      </div>


        <span class="whitespace-pre-line">{{ message.content }}</span>


      </section>

    </div>
    <div class="chat-footer opacity-50 text-xs">
      <a @click="openModal">View event</a> - 
      {{
        formatMessageTime(message.created_at) }}
    </div>
  </div>
 
</template>

<style scoped></style>