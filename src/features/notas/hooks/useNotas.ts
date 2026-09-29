import { notasStore, resolverContextoAutorizacaoNota } from '../../../core'
import type { AFiltroNota } from '../../../core'
import { podeVisualizar } from '../../../domain'
import type { Nota } from '../../../domain'
import { useLista } from '../../../hooks/useLista'
import { useContextoNotaAtual } from './useContextoNotaAtual'

export function useNotas(filtro: AFiltroNota = {}) {
  const contextoNota = useContextoNotaAtual()
  return useLista<Nota>(
    async () => {
      const notas = await notasStore.listar(filtro)
      const visiveis: Nota[] = []
      for (const nota of notas) {
        try {
          const autorizacao = await resolverContextoAutorizacaoNota(nota, contextoNota)
          if (podeVisualizar(autorizacao)) {
            visiveis.push(nota)
          }
        } catch {
          // Se o usuario atual nao existe mais, a nota nao deve ser exposta na UI.
        }
      }
      return visiveis
    },
    [filtro, contextoNota],
  )
}
