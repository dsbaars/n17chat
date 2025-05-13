<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

// Define props for the modal
const props = defineProps({
  // Controls visibility of modal
  isOpen: Boolean,
  // Modal size: sm, md, lg, xl
  size: {
    type: String,
    default: 'md'
  },
  // Whether to close modal when clicking outside
  closeOnClickOutside: {
    type: Boolean,
    default: true
  },
  // Whether to close modal when Escape key is pressed
  closeOnEsc: {
    type: Boolean,
    default: true
  },
  // Custom width class
  widthClass: {
    type: String,
    default: ''
  }
})

// Define events
const emit = defineEmits(['close', 'update:isOpen'])

// Close the modal
const closeModal = () => {
  emit('close')
  emit('update:isOpen', false)
}

// Handle click outside
const handleBackdropClick = (event) => {
  // Only close if the backdrop itself was clicked (not its children)
  if (props.closeOnClickOutside && event.target === event.currentTarget) {
    closeModal()
  }
}

// Handle keyboard events (ESC to close)
const handleKeydown = (event) => {
  if (props.closeOnEsc && event.key === 'Escape') {
    closeModal()
  }
}

// Add keydown event listener when component is mounted
onMounted(() => {
  if (props.closeOnEsc) {
    window.addEventListener('keydown', handleKeydown)
  }
})

// Remove keydown event listener when component is unmounted
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Calculate modal size class
const sizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  }
  
  return props.widthClass || sizes[props.size] || sizes.md
})
</script>

<template>
  <Teleport to="body">
    <!-- DaisyUI Modal -->
    <div 
      class="modal modal-bottom" 
      :class="{ 'modal-open': isOpen }"
      @click="handleBackdropClick"
    >
      <div class="modal-box" :class="sizeClass">
        <!-- Close button -->
        <button 
          class="btn btn-sm btn-circle absolute right-2 top-2" 
          @click="closeModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <!-- Header slot for title -->
        <slot name="header"></slot>
        
        <!-- Default slot for content -->
        <div class="py-4">
          <slot></slot>
        </div>
        
        <!-- Footer slot for actions -->
        <div class="modal-action">
          <slot name="footer">
            <button class="btn" @click="closeModal">Close</button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Add any custom styling here */
</style> 