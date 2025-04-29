<script setup>
import { ref } from 'vue'
import Alert from './Alert.vue'

const alerts = ref([
  { id: 1, type: 'info', title: 'Information', message: 'This is an information alert', closable: true },
  { id: 2, type: 'success', title: 'Success', message: 'Operation completed successfully', closable: true },
  { id: 3, type: 'warning', title: 'Warning', message: 'This action cannot be undone', closable: true },
  { id: 4, type: 'error', title: 'Error', message: 'Something went wrong', closable: true }
])

const autoCloseAlert = ref({
  type: 'info',
  title: 'Auto Close',
  message: 'This alert will close automatically after 5 seconds',
  closable: true,
  autoClose: true,
  duration: 5000
})

const closeAlert = (id) => {
  alerts.value = alerts.value.filter(alert => alert.id !== id)
}

const addRandomAlert = () => {
  const types = ['info', 'success', 'warning', 'error']
  const randomType = types[Math.floor(Math.random() * types.length)]
  const newId = Math.max(0, ...alerts.value.map(a => a.id)) + 1
  
  alerts.value.push({
    id: newId,
    type: randomType,
    title: randomType.charAt(0).toUpperCase() + randomType.slice(1),
    message: `This is a ${randomType} message (ID: ${newId})`,
    closable: true
  })
}
</script>

<template>
  <div class="p-4 space-y-4">
    <h2 class="text-2xl font-bold mb-4">Alert Component Demo</h2>
    
    <div class="space-y-2">
      <button class="btn btn-primary" @click="addRandomAlert">Add Random Alert</button>
      
      <h3 class="text-xl font-semibold mt-6">Static Alerts</h3>
      <Alert 
        v-for="alert in alerts" 
        :key="alert.id"
        :type="alert.type"
        :title="alert.title"
        :message="alert.message"
        :closable="alert.closable"
        @close="closeAlert(alert.id)"
      />
      
      <h3 class="text-xl font-semibold mt-6">Auto-close Alert (5 seconds)</h3>
      <Alert 
        v-if="autoCloseAlert"
        :type="autoCloseAlert.type"
        :title="autoCloseAlert.title"
        :message="autoCloseAlert.message"
        :closable="autoCloseAlert.closable"
        :auto-close="autoCloseAlert.autoClose"
        :duration="autoCloseAlert.duration"
        @close="autoCloseAlert = null"
      />
      <button
v-if="!autoCloseAlert" class="btn btn-outline" @click="autoCloseAlert = {
        type: 'info',
        title: 'Auto Close',
        message: 'This alert will close automatically after 5 seconds',
        closable: true,
        autoClose: true,
        duration: 5000
      }">
        Show Auto-close Alert Again
      </button>
    </div>
    
    <h3 class="text-xl font-semibold mt-6">Alert Types (No Title)</h3>
    <div class="space-y-2">
      <Alert type="info" message="This is an info alert without title" />
      <Alert type="success" message="This is a success alert without title" />
      <Alert type="warning" message="This is a warning alert without title" />
      <Alert type="error" message="This is an error alert without title" />
    </div>
  </div>
</template> 