<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import { NostrKind } from '~/types/nostr'
import type { Message } from '~/types/nostr'
import { hexToBytes } from '@noble/hashes/utils'
import LinkPreview from './LinkPreview.vue'

const props = defineProps({
  message: {
    type: Object as () => Message,
    required: true
  }
})

const emit = defineEmits(['openModal'])

const nostrStore = useNostrStore()
const imageUrl = ref('')
const processedContent = ref<{ type: 'text' | 'image' | 'video' | 'url', content: string }[]>([])
const firstUrlLink = ref<string | null>(null)

// Format timestamp for messages
const formatMessageTime = (timestamp: number) => {
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
const isCurrentUser = (message: Message) => {
  // If the message has isSent flag set, it was sent by the current user
  if ('isSent' in message && message.isSent) return true

  // Otherwise, check if the pubkey matches the current user's pubkey
  return message.pubkey === nostrStore.currentPubkey
}

const decryptImageContent = async (content: Message) => {
  const fileType = content.tags.find((t: string[]) => t[0] === 'file-type')?.[1]
  if (!fileType) return

  const encryptionAlgorithm = content.tags.find((t: string[]) => t[0] === 'encryption-algorithm')?.[1]
  if (!encryptionAlgorithm) return

  const decryptionKey = content.tags.find((t: string[]) => t[0] === 'decryption-key')?.[1]
  if (!decryptionKey) return

  const decryptionNonce = content.tags.find((t: string[]) => t[0] === 'decryption-nonce')?.[1]
  if (!decryptionNonce) return

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

// Link detection helpers
const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|avif)(\?[^\\s]*)?)/gi
const videoRegex = /(https?:\/\/.*\.(?:mp4|webm|ogg|mov)(\?[^\\s]*)?)/gi
const urlRegex = /(https?:\/\/[^\s]+)/gi

// Detect links in content
const detectLinks = (content: string) => {
  const result: { type: 'text' | 'image' | 'video' | 'url', content: string }[] = []
  
  // Split the content by URLs
  let lastIndex = 0
  let match: RegExpExecArray | null
  const matches: { index: number, match: string, type: 'image' | 'video' | 'url' }[] = []
  
  // Reset regex indices
  imageRegex.lastIndex = 0
  videoRegex.lastIndex = 0 
  urlRegex.lastIndex = 0
  
  // Find all image links
  while ((match = imageRegex.exec(content)) !== null) {
    matches.push({ index: match.index, match: match[0], type: 'image' })
  }
  
  // Find all video links
  while ((match = videoRegex.exec(content)) !== null) {
    matches.push({ index: match.index, match: match[0], type: 'video' })
  }
  
  // Find all other URLs
  while ((match = urlRegex.exec(content)) !== null) {
    // Check if this URL is already detected as image or video
    const isSpecialType = matches.some(m => 
      m.index === match!.index && m.match === match![0]
    )
    
    if (!isSpecialType) {
      matches.push({ index: match.index, match: match[0], type: 'url' })
    }
  }
  
  // Sort matches by their position in the string
  matches.sort((a, b) => a.index - b.index)
  
  // Process content
  for (const m of matches) {
    // Add text before the match if any
    if (m.index > lastIndex) {
      result.push({ type: 'text', content: content.substring(lastIndex, m.index) })
    }
    
    // Add the matched content with appropriate type
    result.push({ type: m.type, content: m.match })
    
    lastIndex = m.index + m.match.length
  }
  
  // Add any remaining text after the last match
  if (lastIndex < content.length) {
    result.push({ type: 'text', content: content.substring(lastIndex) })
  }
  
  // Find the first URL type link for preview
  // We want to prioritize regular URLs over image/video URLs for previews
  const firstUrlItem = matches.find(m => m.type === 'url')
  
  if (firstUrlItem) {
    firstUrlLink.value = firstUrlItem.match
  } else {
    firstUrlLink.value = null
  }
  
  return result
}

const openModal = () => {
  emit('openModal', props.message)
}

onMounted(() => {
  if (props.message.kind === 15) {
    decryptImageContent(props.message).then(() => {
      nextTick()
    })
  } else if (props.message.kind === NostrKind.DirectMessage || props.message.kind === 1) {
    // Process text messages to detect links
    processedContent.value = detectLinks(props.message.content)
  }
})

const scrollToReply = () => {
  const replyTag = props.message.tags.find((t: string[]) => t[0] === 'e')
  const replyId = replyTag?.[1]
  if (replyId) {
    const element = document.getElementsByName('e' + replyId)
    if (element.length > 0) {
      element[0].scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const getSubject = () => {
  const subjectTag = props.message.tags.find((t: string[]) => t[0] === 'subject')
  if (subjectTag && subjectTag.length > 0) {
    return subjectTag[1]
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
        <img :src="nostrStore.getContact(message.pubkey)?.picture" alt="Avatar">
      </div>
    </div>
    <div class="chat-bubble" :class="isCurrentUser(message) ? 'chat-bubble-primary' : 'chat-bubble-accent'">
      <section v-if="message.kind == 15">
        <img :src="imageUrl" class="w-96 h-auto object-cover" alt="Encrypted image">
      </section>
      <section v-else-if="message.kind == 444">
        <code>(Welcome Event for MLS)</code>
      </section>
      <section v-else>
        <div v-if="message.tags.some((t: string[]) => t[0] === 'e' && t.length > 1)" class="mb-2 text-xs">
          <template v-if="message.tags.find((t: string[]) => t[0] === 'e')">
            Reply to: <a :href="'#e' + message.tags.find((t: string[]) => t[0] === 'e')![1]" @click="scrollToReply">
              {{ message.tags.find((t: string[]) => t[0] === 'e')![1] }}
            </a>
          </template>
        </div>

        <!-- Regular text content display -->
        <div v-if="!processedContent.length" class="whitespace-pre-line">{{ message.content }}</div>
        
        <!-- Processed content with links -->
        <div v-else class="whitespace-pre-line">
          <template v-for="(part, index) in processedContent" :key="index">
            <!-- Text content -->
            <span v-if="part.type === 'text'">{{ part.content }}</span>
            
            <!-- Image link -->
            <div v-else-if="part.type === 'image'" class="my-2">
              <img :src="part.content" class="max-w-full max-h-96 rounded" alt="Image" loading="lazy" @error="part.type = 'url'">
              <a :href="part.content" target="_blank" class="text-xs block">{{ part.content }}</a>
            </div>
            
            <!-- Video link -->
            <div v-else-if="part.type === 'video'" class="my-2">
              <video controls class="max-w-full max-h-96 rounded" :src="part.content"/>
              <a :href="part.content" target="_blank" class="text-xs block">{{ part.content }}</a>
            </div>
            
            <!-- URL link -->
            <a v-else-if="part.type === 'url'" :href="part.content" target="_blank" class="text-base underline hover:striped">{{ part.content }}</a>
          </template>
        </div>
        
        <!-- Link preview (only show for URL links) -->
        <div v-if="firstUrlLink" class="mt-2 border-t pt-2 border-opacity-20 max-w-120">
          <LinkPreview :url="firstUrlLink" />
        </div>
      </section>
    </div>
    <div class="chat-footer opacity-50 text-xs">
      <a @click="openModal">View event</a> - 
      {{ formatMessageTime(message.created_at) }}
      <span v-if="message.kind != 14 && message.kind != 15">- (kind: {{ message.kind }})</span>
    </div>
  </div>
</template>

<style scoped></style>