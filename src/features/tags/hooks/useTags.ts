import { tagsStore } from '../../../core'
import type { Tag } from '../../../domain'
import { useLista } from '../../../hooks/useLista'

export function useTags() {
  return useLista<Tag>(() => tagsStore.listar(), [])
}