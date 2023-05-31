<script setup lang="ts">
import { list } from '../composables'
import { clearRoot } from '../composables/utils'
console.log(list.data)
</script>

<template>
  <div v-if="list.data && list.data.modules">
    <RouterLink
      class="block border-b border-main px-3 py-2 text-left font-mono text-sm"
      v-for="m in list.data.modules"
      :key="m.id"
      :to="`/id?id=${encodeURIComponent(m.id)}`"
    >
      {{ clearRoot(m.id) }}
    </RouterLink>
  </div>
</template>
