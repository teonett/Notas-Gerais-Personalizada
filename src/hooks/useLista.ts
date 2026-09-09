import { useCallback, useEffect, useRef, useState } from 'react'

export function useLista<T>(
  carregar: () => Promise<T[]>,
  dependencias: unknown[],
): { itens: T[]; carregando: boolean; erro: unknown; recarregar: () => void } {
  const [itens, setItens] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<unknown>(null)
  const [versao, setVersao] = useState(0)

  const carregarRef = useRef(carregar)

  useEffect(() => {
    carregarRef.current = carregar
  })

  const chave = JSON.stringify(dependencias)

  useEffect(() => {
    let ativo = true
    carregarRef
      .current()
      .then((resultado) => {
        if (ativo) {
          setItens(resultado)
          setErro(null)
        }
      })
      .catch((falha: unknown) => {
        if (ativo) {
          setErro(falha)
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [chave, versao])

  const recarregar = useCallback(() => {
    setVersao((atual) => atual + 1)
  }, [])

  return { itens, carregando, erro, recarregar }
}