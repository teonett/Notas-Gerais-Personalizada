import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { APP } from '../config/app'
import { logger } from '../core/errors'
import { TemaContexto } from './contexto'
import type { Tema } from './tipos'

export { TemaContexto } from './contexto'

function temaSistema(): Tema {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'escuro'
  }
  return 'claro'
}

function temaInicial(): Tema {
  if (typeof window === 'undefined') {
    return 'claro'
  }
  const salvo = window.localStorage.getItem(APP.temaStorageKey)
  return salvo === 'claro' || salvo === 'escuro' ? salvo : temaSistema()
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.toggle('dark', tema === 'escuro')
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === 'claro' ? 'escuro' : 'claro'
      try {
        window.localStorage.setItem(APP.temaStorageKey, proximo)
      } catch {
        logger.aviso('Não foi possível persistir a preferência de tema.')
      }
      return proximo
    })
  }, [])

  const valor = useMemo(
    () => ({ tema, alternarTema }),
    [tema, alternarTema],
  )

  return <TemaContexto.Provider value={valor}>{children}</TemaContexto.Provider>
}