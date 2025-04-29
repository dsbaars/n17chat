<script setup lang="ts">
import { PaperAirplaneIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  send: [message: string]
}>()

const message = ref('')

// const updateValue = (event) => {
//   const target = event.target
//   emit('update:modelValue', target.value)
// }

const handleEnter = (event) => {
  if (event.shiftKey) {
    addNewline()
  } else {
    handleSend()
  }
}

const handleSend = () => {
  if (!message.value.trim()) return;

  // Remove trailing newlines
  const cleanMessage = message.value.replace(/\n+$/, "");
  emit("send", cleanMessage);
  message.value = "";

  // Reset textarea height
  const textarea = document.querySelector("textarea");
  if (textarea) {
    textarea.style.height = "auto";
  }
}

const autoGrow = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = "auto";
  const newHeight = Math.min(textarea.scrollHeight, 250);
  textarea.style.height = newHeight + "px";
}

const addNewline = () => {
  message.value += "\n";
  const textarea = document.querySelector("textarea");
  if (textarea) {
    nextTick(() => autoGrow(textarea));
  }
}

const handleBackspace = () => {
  autoGrow(document.querySelector("textarea"));
}

</script>

<template>

  <div class="flex w-full items-center border rounded-xl flex-1 mr-2">
    <textarea v-model="message" rows="1" type="text" placeholder="Type a message..."
      class="max-h-[250px] flex-grow resize-none overflow-y-auto px-4 py-2 border-none bg-transparent focus:outline-none"
      @keydown.enter.exact.prevent="handleEnter" @keydown.shift.enter.prevent="addNewline"
      @keydown.backspace="handleBackspace" @keydown.delete="handleBackspace" @input="(e) => autoGrow(e.target as HTMLTextAreaElement)" />

    <button class="btn btn-primary" @click="$emit('send')">
      <PaperAirplaneIcon class="h-5 w-5" />
    </button>
  </div>
</template>
