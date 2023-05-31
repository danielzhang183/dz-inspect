import { useFetch } from '@vueuse/core'
import { computed, reactive } from 'vue'
import type { ModulesList } from '../../types'

export const enableDiff = useStorage('vite-inspect-diff', true)
export const showOneColumn = useStorage('vite-inspect-one-column', false)
export const listMode = useStorage<'graph' | 'list' | 'detailed'>('vite-inspect-mode', 'detailed')
export const lineWrapping = useStorage('vite-inspect-line-wrapping', false)

export const list = reactive(
  useFetch('/__inspect_api/list')
    .get()
    .json<ModulesList>(),
)

export const root = computed(() => list.data?.root || '')
