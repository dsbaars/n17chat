<script setup lang="ts"></script>

<template>
  <div class="flex flex-col h-screen">
    <Header />
    <div class="flex-1 overflow-y-hidden mb-18">
      <slot />
    </div>
    <TabBar />
  </div>
</template>

<style scoped></style>
