import { useFetch } from '@vueuse/core'
import { computed, reactive } from 'vue'

export const list = reactive(
  useFetch('/__inspect_api/list')
    .get()
    .json<{ root: string; ids: string[] }>(),
)

export const root = computed(() => list.data?.root || '')
