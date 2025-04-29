<script setup lang="ts">
// Layout definition
definePageMeta({
  layout: 'chat'
})

</script>

<template>
  <div class="flex h-full">
    <SideBar />
    <div class="flex-1">
      <Messages />
    </div>
  </div>
</template>

<style scoped></style>
