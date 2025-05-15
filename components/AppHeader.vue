<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import { useNostrClient, initializeNDK } from '~/composables/useNostrClient'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import type { ThemeMode } from '~/stores/theme'

const nostrStore = useNostrStore()
const colorMode = useColorMode()
const { ndk, initialized } = useNostrClient()

const contact = ref<Contact | null>(null)

watch(() => nostrStore.currentPubkey, (newPubkey) => {
  nostrStore.updateContactProfile(newPubkey).then(() => {
    contact.value = nostrStore.getContact(newPubkey)
  })
})

// Safely handle possibly undefined ndk
let pubkey = ''
onMounted(async () => {
  // if (!initialized) {
  //   await initializeNDK()
  // }

  if (ndk && ndk.signer) {
    const user = await (await ndk.signer).user()
    if (user) {
      pubkey = user.pubkey
    }
  }
})


// Set theme function
const setTheme = (theme: ThemeMode) => {
  colorMode.preference = theme
}
</script>

<template>
  <div class="navbar bg-base-100 border-b border-base-300">
    <div class="flex-1">
      <a class="btn btn-ghost normal-case text-xl" @click="navigateTo('/')">n17.chat</a>
    </div>
    <div class="flex-none">
      <!-- Theme Switcher -->
      <div class="dropdown dropdown-end mr-2">
        <label tabindex="0" class="btn btn-ghost btn-circle">
          <SunIcon v-if="$colorMode.preference === 'light'" class="h-5 w-5" />
          <MoonIcon v-else-if="$colorMode.preference === 'dark'" class="h-5 w-5" />
          <ComputerDesktopIcon v-else class="h-5 w-5" />
        </label>
        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
          <li><a :class="{ 'active': $colorMode.preference === 'light' }" @click="setTheme('light')">
            <SunIcon class="h-5 w-5 mr-2" />Light
          </a></li>
          <li><a :class="{ 'active': $colorMode.preference === 'dark' }" @click="setTheme('dark')">
            <MoonIcon class="h-5 w-5 mr-2" />Dark
          </a></li>
          <li><a :class="{ 'active': $colorMode.preference === 'system' }" @click="setTheme('system')">
            <ComputerDesktopIcon class="h-5 w-5 mr-2" />System
          </a></li>
        </ul>
      </div>
      
      <!-- Avatar Dropdown -->
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">
          <div class="bg-neutral text-neutral-content rounded-full w-10" v-if="contact?.picture">
            <img :src="contact?.picture" >
          </div>
        </label>
        <!-- <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
          <li><a>Profile</a></li>
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul> -->
      </div>
    </div>
  </div>
</template>

<style scoped></style> 