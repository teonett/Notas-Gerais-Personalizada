import { useEffect, useMemo, useState } from 'react'
import type { ContextoOperacaoNota } from '../../../core'
import { obterUsuarioPadraoAtual } from '../../../core'
import { assinarSessao } from '../../../core/auth/sessao'
import type { Nota } from '../../../domain'

export function useContextoNotaAtual(): ContextoOperacaoNota {
  const [usuarioId, setUsuarioId] = useState(() => obterUsuarioPadraoAtual().id)

  useEffect(
    () =>
      assinarSessao(() => {
        setUsuarioId(obterUsuarioPadraoAtual().id)
      }),
    [],
  )

  return useMemo(() => ({ usuarioId }), [usuarioId])
}

export function ehDonoNaUi(nota: Nota, contexto: ContextoOperacaoNota): boolean {
  return nota.ownerId !== undefined && nota.ownerId === contexto.usuarioId
}
