<script setup>
import { ref, onMounted, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  closable: {
    type: Boolean,
    default: false
  },
  autoClose: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    default: 5000
  }
})

const emit = defineEmits(['close'])

const visible = ref(true)
let timer = null

const close = () => {
  visible.value = false
  emit('close')
}

// Handle auto-close functionality
watch(() => props.autoClose, (newValue) => {
  if (newValue && visible.value) {
    setupAutoClose()
  } else if (!newValue && timer) {
    clearTimeout(timer)
    timer = null
  }
}, { immediate: true })

const setupAutoClose = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    close()
  }, props.duration)
}

onMounted(() => {
  if (props.autoClose) {
    setupAutoClose()
  }
})
</script>

<template>
  <div v-if="visible" :class="['alert', `alert-${type}`, 'shadow-lg']">
    <div class="flex w-full justify-between">
      <div class="flex items-center">
        <div v-if="type === 'info'">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 flex-shrink-0 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div v-else-if="type === 'success'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div v-else-if="type === 'warning'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div v-else-if="type === 'error'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 v-if="title" class="font-bold">{{ title }}</h3>
          <div class="text-sm">{{ message }}</div>
        </div>
      </div>
      <button v-if="closable" @click="close" class="btn btn-ghost btn-sm">
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.alert {
  margin-bottom: 1rem;
}
</style> 