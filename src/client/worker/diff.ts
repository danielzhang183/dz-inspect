import type { Remote } from 'comlink'
import { wrap } from 'comlink'
import type { Exports } from './diff.worker'

let diffWorker: Remote<Exports> | undefined

export async function calculateDiffWithWorker(before: string, after: string) {
  if (!diffWorker) {
    diffWorker = wrap(
      new Worker(new URL('./diff.worker.ts', import.meta.url), {
        type: 'module',
      }),
    )
  }

  return await diffWorker.calculateDiff(before, after)
}
