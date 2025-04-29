<script setup lang="ts">
// Define props for the component
const props = defineProps({
  contact: {
    type: Object,
    required: true
  },
  size: {
    type: String,
    default: 'w-12 h-12'
  }
})

// Default size if not provided
const size = props.size
</script>

<template>
  <div class="placeholder">
    <div v-if="contact.picture" class="avatar" :class="size">
      <img :src="contact.picture" class="rounded-full" :class="size" />
    </div>
    <div v-else class="bg-neutral text-neutral-content rounded-full flex items-center justify-center" :class="size">
      <span>{{ contact.name?.charAt(0) || contact.pubkey.charAt(0) }}</span>
    </div>
  </div>
</template>

<style scoped></style> 