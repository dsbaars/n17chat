<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const hasNostrExtension = ref(false)
const isChecking = ref(false)

const checkNostrExtension = () => {
  hasNostrExtension.value = typeof window !== "undefined" && "nostr" in window
}

onMounted(() => {
  checkNostrExtension()
})

const refreshCheck = () => {
  isChecking.value = true
  setTimeout(() => {
    checkNostrExtension()
    isChecking.value = false
  }, 500)
}

const popularExtensions = [
  {
    name: 'nos2x',
    description: 'A popular Nostr extension for Chrome and Firefox',
    url: 'https://github.com/fiatjaf/nos2x',
    icon: '🔌'
  },
  {
    name: 'Alby',
    description: 'Bitcoin Lightning wallet with Nostr support',
    url: 'https://getalby.com/',
    icon: '⚡'
  }
]

const redirectToHome = () => {
  window.location.href = '/'
}
</script>

<template>
  <div class="min-h-screen bg-base-100 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">🔐</div>
        <h1 class="text-4xl font-bold text-base-content mb-4">
          Nostr Extension Required
        </h1>
        <p class="text-lg text-base-content/70">
          n17.chat requires a NIP-07 compatible Nostr extension to function properly.
        </p>
      </div>

      <!-- Main Content Card -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <div class="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="font-bold">What is NIP-07?</h3>
              <div class="text-sm">
                NIP-07 is a Nostr Improvement Proposal that defines how web applications can interact with Nostr extensions. 
                It provides a secure way for websites to request signatures and encryption from your Nostr client.
              </div>
            </div>
          </div>

          <!-- Extension Detection Status -->
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="badge badge-lg" :class="hasNostrExtension ? 'badge-success' : 'badge-error'">
                {{ hasNostrExtension ? '✅ Extension Detected' : '❌ No Extension Found' }}
              </div>
              <button 
                @click="refreshCheck" 
                class="btn btn-sm btn-outline"
                :disabled="isChecking"
              >
                <svg v-if="isChecking" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 animate-spin">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {{ isChecking ? 'Checking...' : 'Refresh' }}
              </button>
              <button 
                @click="redirectToHome" 
                class="btn btn-sm btn-primary"
                v-if="hasNostrExtension"
              >
                Go to App
              </button>
            </div>
          </div>

          <!-- Popular Extensions -->
          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-4">Popular NIP-07 Extensions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="extension in popularExtensions" 
                :key="extension.name"
                class="card bg-base-100 border border-base-300 hover:border-primary/50 transition-colors"
              >
                <div class="card-body p-4">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl">{{ extension.icon }}</span>
                    <h4 class="font-semibold">{{ extension.name }}</h4>
                  </div>
                  <p class="text-sm text-base-content/70 mb-3">{{ extension.description }}</p>
                  <a 
                    :href="extension.url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="btn btn-sm btn-primary"
                  >
                    Get Extension
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="collapse collapse-arrow bg-base-100">
            <input type="checkbox" /> 
            <div class="collapse-title text-lg font-medium">
              How to Install and Use
            </div>
            <div class="collapse-content">
              <div class="space-y-4">
                <div class="flex gap-3">
                  <div class="badge badge-primary">1</div>
                  <div>
                    <strong>Install an Extension:</strong> Choose one of the popular extensions above or find another NIP-07 compatible client.
                  </div>
                </div>
                <div class="flex gap-3">
                  <div class="badge badge-primary">2</div>
                  <div>
                    <strong>Create or Import Keys:</strong> Set up your Nostr keys in the extension. You can generate new keys or import existing ones.
                  </div>
                </div>
                <div class="flex gap-3">
                  <div class="badge badge-primary">3</div>
                  <div>
                    <strong>Grant Permissions:</strong> When prompted, allow the extension to interact with n17.chat.
                  </div>
                </div>
                <div class="flex gap-3">
                  <div class="badge badge-primary">4</div>
                  <div>
                    <strong>Start Chatting:</strong> Once connected, you can start using n17.chat to communicate with other Nostr users.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div class="mt-6">
            <h3 class="text-xl font-semibold mb-4">What You Can Do with n17.chat</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center p-4 bg-base-100 rounded-lg">
                <div class="text-3xl mb-2">💬</div>
                <h4 class="font-semibold mb-2">Private Messages</h4>
                <p class="text-sm text-base-content/70">Send encrypted direct messages to other Nostr users</p>
              </div>
              <div class="text-center p-4 bg-base-100 rounded-lg">
                <div class="text-3xl mb-2">🔒</div>
                <h4 class="font-semibold mb-2">End-to-End Encryption</h4>
                <p class="text-sm text-base-content/70">Your messages are encrypted and secure</p>
              </div>
              <div class="text-center p-4 bg-base-100 rounded-lg">
                <div class="text-3xl mb-2">🌐</div>
                <h4 class="font-semibold mb-2">Decentralized</h4>
                <p class="text-sm text-base-content/70">No central server, powered by Nostr relays</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 text-base-content/60">
        <p class="text-sm">
          n17.chat is built on the Nostr protocol. Learn more about 
          <a href="https://github.com/nostr-protocol/nips/blob/master/07.md" target="_blank" rel="noopener noreferrer" class="link link-primary">NIP-07</a> 
          and the 
          <a href="https://nostr.com/" target="_blank" rel="noopener noreferrer" class="link link-primary">Nostr protocol</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  backdrop-filter: blur(10px);
}
</style> 