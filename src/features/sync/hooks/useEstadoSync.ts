import { useCallback, useEffect, useRef, useState } from 'react'
import type { EstadoSincronizacao } from '../../../sync'
import { obterEstadoSincronizacao } from '../../../sync'

export function useEstadoSync() {
  const [estado, setEstado] = useState<EstadoSincronizacao>({
    configurada: false,
    url: '',
    ultimaSincronizacao: null,
    pendentes: 0,
    blobsPendentes: 0,
  })
  const [versao, setVersao] = useState(0)

  const carregarRef = useRef<() => Promise<EstadoSincronizacao>>(obterEstadoSincronizacao)

  useEffect(() => {
    carregarRef.current = obterEstadoSincronizacao
  })

  useEffect(() => {
    let ativo = true
    carregarRef
      .current()
      .then((resultado) => {
        if (ativo) {
          setEstado(resultado)
        }
      })
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [versao])

  const recarregar = useCallback(() => {
    setVersao((atual) => atual + 1)
  }, [])

  return { estado, recarregar }
}