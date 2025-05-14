<script setup lang="ts">
interface Props {
  status: 'connected' | 'disconnected' | 'connecting';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  label: false
});

const statusClasses = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'status-success';
    case 'disconnected':
      return 'status-error';
    case 'connecting':
      return 'status-warning';
    default:
      return '';
  }
});

const statusText = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'connecting':
      return 'Connecting';
    default:
      return '';
  }
});

const isPulsating = computed(() => props.status === 'connected');
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="isPulsating" class="inline-grid *:[grid-area:1/1]">
      <div
:class="[
        'status', 
        statusClasses, 
        `status-${size}`, 
        'animate-ping opacity-60'
      ]"/>
      <div
:class="[
        'status', 
        statusClasses, 
        `status-${size}`
      ]"/>
    </div>
    <div
v-else :class="[
      'status', 
      statusClasses, 
      `status-${size}`
    ]"/>
    
    <span v-if="label" class="text-xs font-medium">{{ statusText }}</span>
  </div>
</template> 