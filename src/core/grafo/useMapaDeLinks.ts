import { useEffect, useMemo, useState } from 'react'
import { notasStore } from '../repositorios/notas'
import { tagsStore } from '../repositorios/tags'
import { construirGrafoDeNotas } from './grafo'
import type { GrafoDeNotas } from './grafo'

export function useMapaDeLinks(): GrafoDeNotas | null {
  const [grafo, setGrafo] = useState<GrafoDeNotas | null>(null)

  useEffect(() => {
    let ativo = true
    Promise.all([notasStore.listarTodas(), tagsStore.listarTodas()])
      .then(([todas, tags]) => {
        if (ativo) {
          setGrafo(construirGrafoDeNotas(todas, tags))
        }
      })
      .catch(() => {
        setGrafo(null)
      })
    return () => {
      ativo = false
    }
  }, [])

  return useMemo(() => grafo, [grafo])
}