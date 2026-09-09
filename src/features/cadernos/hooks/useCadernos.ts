import { cadernosStore } from '../../../core'
import type { Caderno } from '../../../domain'
import { useLista } from '../../../hooks/useLista'

export function useCadernos() {
  return useLista<Caderno>(() => cadernosStore.listar(), [])
}