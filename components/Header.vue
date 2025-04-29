<script setup lang="ts">
import { useNostrStore } from '~/stores/nostr'
import { useNostrClient, initializeNDK } from '~/composables/useNostrClient'
const nostrStore = useNostrStore()
const { ndk, initialized } = useNostrClient()

const pubkey = (await (await ndk.signer).user()).pubkey
const contact = computed(() => nostrStore.getContact(pubkey))

onMounted(async () => {
  if (!initialized) {
    await initializeNDK()
  }
  
})


</script>

<template>
  <div class="navbar bg-base-100 border-b border-base-300">
    <div class="flex-1">
      <a class="btn btn-ghost normal-case text-xl">N17Chat</a>
    </div>
    <div class="flex-none">
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">

          <div class="bg-neutral text-neutral-content rounded-full w-10">
            <img :src="contact?.picture" />
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
