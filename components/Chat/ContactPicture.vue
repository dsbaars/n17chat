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

const pubkeyColor = computed(() => {
  return `#${props.contact.pubkey.slice(0, 6)}`
})

// Default size if not provided
const size = props.size
</script>

<template>
  <div class="placeholder">
    <div v-if="contact.picture" class="avatar" :class="size">
      <img :src="contact.picture" class="rounded-full" :style="{ border: `2px solid ${pubkeyColor}` }" :class="size" >
    </div>
    <div v-else class="bg-neutral text-neutral-content rounded-full flex items-center justify-center" :style="{ backgroundColor: pubkeyColor }" :class="size">
      <span>{{ contact.name?.charAt(0) || contact.pubkey.charAt(0) }}</span>
    </div>
  </div>
</template>

<style scoped></style> 