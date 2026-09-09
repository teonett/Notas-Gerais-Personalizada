import { createContext } from 'react'
import type { Tema } from './tipos'

export interface TemaContextoValor {
  tema: Tema
  alternarTema: () => void
}

export const TemaContexto = createContext<TemaContextoValor | null>(null)