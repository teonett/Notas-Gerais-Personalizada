import { PADRAO_LINK_SOURCE } from './constantes'

interface No {
  type: string
  value?: string
  children?: No[]
  url?: string
  title?: string | null
}

type ResolvedorDeTitulos = (titulo: string) => string | null

function dividirPorLinks(texto: string, resolver: ResolvedorDeTitulos): No[] {
  const resultado: No[] = []
  let fim = 0
  for (const partida of texto.matchAll(new RegExp(PADRAO_LINK_SOURCE, 'g'))) {
    const indice = partida.index
    if (indice === undefined) {
      continue
    }
    if (indice > fim) {
      resultado.push({ type: 'text', value: texto.slice(fim, indice) })
    }
    const titulo = partida[1].trim()
    const destinoId = resolver(titulo)
    if (destinoId === null) {
      resultado.push({ type: 'text', value: partida[0] })
    } else {
      resultado.push({
        type: 'link',
        url: `/notas/${destinoId}`,
        title: null,
        children: [{ type: 'text', value: titulo }],
      })
    }
    fim = indice + partida[0].length
  }
  if (fim < texto.length) {
    resultado.push({ type: 'text', value: texto.slice(fim) })
  }
  return resultado
}

function transformarNos(nos: No[], resolver: ResolvedorDeTitulos): No[] {
  const resultado: No[] = []
  for (const no of nos) {
    if (no.type === 'text' && typeof no.value === 'string' && no.value.includes('[[')) {
      resultado.push(...dividirPorLinks(no.value, resolver))
    } else if (Array.isArray(no.children)) {
      resultado.push({ ...no, children: transformarNos(no.children, resolver) })
    } else {
      resultado.push(no)
    }
  }
  return resultado
}

export function pluginLinksInternos(
  resolver: ResolvedorDeTitulos,
): (this: unknown) => (arvore: unknown) => void {
  return () => {
    return (arvore: unknown) => {
      const raiz = arvore as No
      if (Array.isArray(raiz.children)) {
        raiz.children = transformarNos(raiz.children, resolver)
      }
    }
  }
}