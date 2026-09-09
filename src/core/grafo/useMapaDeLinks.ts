import { useEffect, useMemo, useState } from 'react'
import { notasStore } from '../repositorios/notas'
import { construirGrafoDeNotas } from './grafo'
import type { GrafoDeNotas } from './grafo'

export function useMapaDeLinks(): GrafoDeNotas | null {
  const [grafo, setGrafo] = useState<GrafoDeNotas | null>(null)

  useEffect(() => {
    let ativo = true
    notasStore
      .listarTodas()
      .then((todas) => {
        if (ativo) {
          setGrafo(construirGrafoDeNotas(todas))
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