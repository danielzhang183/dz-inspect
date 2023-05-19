import { diff_match_patch as Diff } from 'diff-match-patch'
import { expose } from 'comlink'

function calculateDiff(before: string, after: string) {
  const diff = new Diff()
  const changes = diff.diff_main(before, after)
  diff.diff_cleanupSemantic(changes)
  return changes
}

const exports = {
  calculateDiff,
}

export type Exports = typeof exports

expose(exports)
