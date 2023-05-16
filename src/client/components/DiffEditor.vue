<script setup lang="ts">
import { onMounted, ref, toRefs, watchEffect } from 'vue'
import { useCodeMirror } from '../composables/codemirror'
import { guessMode } from '../composables/utils'

const props = defineProps<{ from: string; to: string; id: string }>()
const { from, to } = toRefs(props)

const fromEl = ref<HTMLTextAreaElement>()
const toEl = ref<HTMLTextAreaElement>()

onMounted(() => {
  const cm1 = useCodeMirror(
    fromEl,
    from,
    {
      mode: 'javascript',
      readOnly: true,
      lineNumbers: true,
      scrollbarStyle: 'null',
    },
  )

  const cm2 = useCodeMirror(
    toEl,
    to,
    {
      mode: 'javascript',
      readOnly: true,
      lineNumbers: true,
      scrollbarStyle: 'null',
    },
  )

  watchEffect(() => {
    cm1.setOption('mode', guessMode(from.value))
    cm2.setOption('mode', guessMode(to.value))
  })
})
</script>

<template>
  <div class="grid grid-cols-[1fr,min-content,1fr] h-full overflow-auto">
    <textarea ref="fromEl" v-text="from" />
    <div class="border-main border-r" />
    <textarea ref="toEl" v-text="to" />
  </div>
</template>