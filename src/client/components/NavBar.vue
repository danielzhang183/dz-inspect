<script setup lang="ts">
import { isDark, toggleDark } from '../composables'

defineProps<{
  name?: string
}>()
</script>

<template>
  <nav class="text-xl font-light px-6 py-3 border-b border-main flex gap-3 h-54px">
    <router-link class="my-auto" to="/">
      <div v-if="name" class="text-sm font-mono">
        {{ name }}
      </div>
      <span v-else class="text-md">Vite Inspect</span>
    </router-link>
    <div class="flex-auto" />
    <button class="icon-btn !outline-none mt-1.2" @click="toggleDark()">
      <carbon-moon v-if="isDark" />
      <carbon-sun v-else />
    </button>
  </nav>
</template>
