<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNostrStore } from '~/stores/nostr'
import { getFollows } from '~/utils/nipHelpers'
import { useNostrClient } from '~/composables/useNostrClient'
import ContactPicture from '~/components/Chat/ContactPicture.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'contactSelected'])

const followedUsers = ref([])
const loading = ref(true)
const nostrStore = useNostrStore()
const searchTerm = ref('')
const progress = ref(0)
const progressMax = ref(0)

// Filtered users based on search term
const filteredUsers = computed(() => {
  if (!searchTerm.value.trim()) return followedUsers.value
  
  const term = searchTerm.value.toLowerCase()
  return followedUsers.value.filter(user => {
    const name = user.profile?.name || user.npub || ''
    return name.toLowerCase().includes(term)
  })
})

watch(() => props.isOpen, async (newIsOpen) => {
  if (newIsOpen) {
    await loadFollows()
  }
})

// Load follows when component is mounted
onMounted(async () => {
  // console.log('FollowsModal mounted')
  // await loadFollows()
})

async function loadFollows() {
  loading.value = true
  try {
    const { metadataNdk } = useNostrClient()
    if (!metadataNdk) return
    
    const signer = await metadataNdk.signer
    const user = await signer?.user()
    
    if (!user) {
      console.error('No authenticated user found')
      loading.value = false
      return
    }
    
    const follows = await getFollows(metadataNdk, user.pubkey)
    console.log('follows', follows)
    if (!follows) {
      loading.value = false
      return
    }

    // Convert follows into a format suitable for display
    const users = []
    progressMax.value = (follows as Set<string>).size
    for (const pubkey of follows) {
      progress.value++
      const profile = await metadataNdk.getUser({ pubkey }).fetchProfile()

      users.push({
        pubkey,
        profile,
        npub: pubkey.slice(0, 8) + '...'
      })
    }
    
    followedUsers.value = users
  } catch (error) {
    console.error('Error loading follows:', error)
  } finally {
    loading.value = false
  }
}

function selectContact(user) {
  nostrStore.createOrSelectContact({
    pubkey: user.pubkey,
    name: user.profile?.name,
    picture: user.profile?.picture
  })
  emit('contactSelected', user)
  emit('close')
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <dialog id="follows_modal" class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Start a conversation</h3>
      
      <!-- Search input -->
      <div class="form-control mb-4">
        <label class="input">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70">
            <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" />
          </svg>
          <input v-model="searchTerm" type="text" placeholder="Search follows" class="grow">
        </label>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="loading" class="flex justify-center py-8 flex-col">
        <div class="flex flex-col items-center">
          <span class="loading loading-spinner loading-lg"/>
          <span class="text-sm text-base-content/60">Loading follows...</span>
        </div>
        <div class="flex flex-col items-center mt-5">
          <progress class="progress progress-accent w-56" :value="progress" :max="progressMax"></progress>
          <span class="text-sm text-base-content/60">{{ progress }} / {{ progressMax }}</span>
        </div>
      </div>
      
      <!-- Follows list -->
      <div v-else class="max-h-[60vh] overflow-y-auto">
        <div v-if="filteredUsers.length === 0" class="text-center py-8 text-base-content/60">
          {{ searchTerm ? 'No matches found' : 'You are not following anyone yet' }}
        </div>
        
        <div v-else>
          <div 
            v-for="user in filteredUsers" 
            :key="user.pubkey"
            class="flex items-center p-3 hover:bg-base-300 cursor-pointer rounded-lg"
            @click="selectContact(user)"
          >
            <ContactPicture :contact="{ pubkey: user.pubkey, picture: user.profile?.picture, name: user.profile?.name }" size="w-10 h-10" />
            
            <div class="ml-3">
              <div class="font-medium">{{ user.profile?.name || user.npub }}</div>
              <div class="text-sm text-base-content/60">{{ user.npub }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-action">
        <button class="btn" @click="closeModal">Close</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="closeModal">
      <button>close</button>
    </form>
  </dialog>
</template> 