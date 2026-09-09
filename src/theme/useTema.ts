import { useContext } from 'react'
import { TemaContexto } from './contexto'

export function useTema() {
  const contexto = useContext(TemaContexto)
  if (contexto === null) {
    throw new Error('useTema deve ser usado dentro de <TemaProvider>')
  }
  return contexto
}