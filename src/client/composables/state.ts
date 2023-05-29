import { useFetch } from '@vueuse/core'
import { computed, reactive } from 'vue'

export const enableDiff = useStorage('vite-inspect-diff', true)
export const showOneColumn = useStorage('vite-inspect-one-column', false)
export const listMode = useStorage<'graph' | 'list' | 'detailed'>('vite-inspect-mode', 'detailed')
export const lineWrapping = useStorage('vite-inspect-line-wrapping', false)

export const list = reactive(
  useFetch('/__inspect_api/list')
    .get()
    .json<{ root: string; ids: string[] }>(),
)

export const root = computed(() => list.data?.root || '')
