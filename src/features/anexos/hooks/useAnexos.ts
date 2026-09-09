import type { Anexo } from '../../../domain'
import { anexosStore } from '../../../core'
import { useLista } from '../../../hooks/useLista'

export function useAnexos(notaId?: string) {
  return useLista<Anexo>(
    () =>
      notaId === undefined
        ? anexosStore.listarTodas()
        : anexosStore.listarPorNota(notaId),
    [notaId === undefined ? null : notaId],
  )
}