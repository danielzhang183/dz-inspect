<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useFetch } from '@vueuse/core'
import { msToTime } from '../../composables/utils'
import { Pane, Splitpanes } from 'splitpanes'

const route = useRoute()
const id = computed(() => route?.query.id as string)

console.log(id)

const currentIdx = ref(0)
const { data } = useFetch(computed(() => `/__inspect_api/id?id=${encodeURIComponent(id.value)}`))
  .get()
  .json<{transforms: {name: string; end: number; start: number; result: string}[]}>()
const panelSize = useLocalStorage('dz-inspect-module-panel-size', '10')

const from = computed(() => data.value?.transforms[currentIdx.value - 1]?.result || '')
const to = computed(() => data.value?.transforms[currentIdx.value]?.result || '')
</script>

<template>
  <NavBar :name="id"/>
  <Container v-if="data && data.transforms" flex overflow-hidden>
    <Splitpanes h-full of-hidden @resize="panelSize = $event[0].size">
      <Pane
        :size="panelSize" min-size="10"
        flex="~ col" border="r main"
        overflow-y-auto
      >
        <div border="b main" />
        <template v-for="tr, idx of data.transforms" :key="tr.name">
          <button
            class="block border-b border-main px-3 py-2 text-left font-mono text-sm !outline-none"
            :class="{ 'font-bold': currentIdx === idx }"
            @click="currentIdx = idx"
          >
            {{ tr.name }} <span class="text-xs opacity-50">{{ msToTime(tr.end - tr.start) }}</span>
          </button>
        </template>
      </Pane>
      <Pane min-size="5">
        <div h-full of-auto>
          <DiffEditor :from="from" :to="to" h-unset />
        </div>
      </Pane>
    </Splitpanes>
  </Container>
</template>
