<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <AppHeader />
    <div class="container mx-auto py-4 overflow-y-auto mb-18">
      <slot />
    </div>
    <TabBar />
  </div>
</template>

<style scoped></style>
