import { notasStore } from '../../../core'
import type { AFiltroNota } from '../../../core'
import type { Nota } from '../../../domain'
import { useLista } from '../../../hooks/useLista'

export function useNotas(filtro: AFiltroNota = {}) {
  return useLista<Nota>(() => notasStore.listar(filtro), [filtro])
}