import { STATUS_NOTA } from '../../domain/tipos'
import type { Nota } from '../../domain/nota'
import type { Tag } from '../../domain/tag'
import { PADRAO_LINK_SOURCE } from './constantes'
import { listarFrequenciasDeTermos } from './termos'

export type TipoRelacao = 'wikilink' | 'tag' | 'termo'
export const TIPOS_RELACAO: TipoRelacao[] = ['wikilink', 'tag', 'termo']

export const TIPOS_RELACAO_ROTULOS: Record<TipoRelacao, string> = {
  wikilink: 'Wikilinks',
  tag: 'Tags',
  termo: 'Palavras-chave',
}

export interface Relacao {
  origemId: string
  destinoId: string
  tipo: TipoRelacao
  rotulo?: string
  peso: number
}

export interface GrafoDeNotas {
  notasAtivas: Nota[]
  relacoes: Relacao[]
  porTipo: Record<TipoRelacao, Relacao[]>
  resolverPorTitulo: (titulo: string) => string | null
  obterPorId: (id: string) => Nota | undefined
}

const MAX_NOTAS_POR_TAG = 12
const MAX_TERMOS_NO_ROTULO = 2

export function normalizarTitulo(titulo: string): string {
  return titulo.trim().toLowerCase().replace(/\s+/g, ' ')
}

function chaveDePar(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function conectarPares(
  idsPorChave: Map<string, Set<string>>,
  porPar: Map<string, { rotulos: string[]; peso: number }>,
  rotulo: string,
): void {
  for (const ids of idsPorChave.values()) {
    const lista = [...ids]
    if (lista.length < 2) {
      continue
    }
    for (let i = 0; i < lista.length - 1; i += 1) {
      for (let j = i + 1; j < lista.length; j += 1) {
        const chave = chaveDePar(lista[i], lista[j])
        const atual = porPar.get(chave)
        if (atual === undefined) {
          porPar.set(chave, { rotulos: [rotulo], peso: 1 })
        } else {
          if (!atual.rotulos.includes(rotulo)) {
            atual.rotulos.push(rotulo)
          }
          atual.peso += 1
        }
      }
    }
  }
}

export function extrairLinksDoTexto(conteudo: string): string[] {
  const titulos: string[] = []
  for (const partida of conteudo.matchAll(new RegExp(PADRAO_LINK_SOURCE, 'g'))) {
    titulos.push(partida[1].trim())
  }
  return titulos
}

export function construirGrafoDeNotas(todas: Nota[], todasTags: Tag[] = []): GrafoDeNotas {
  const notasAtivas = todas.filter((nota) => nota.status === STATUS_NOTA.ATIVA)
  const porId = new Map(notasAtivas.map((nota) => [nota.id, nota]))

  const tituloPorId = new Map<string, string>()
  for (const nota of notasAtivas) {
    const chave = normalizarTitulo(nota.titulo)
    if (!tituloPorId.has(chave)) {
      tituloPorId.set(chave, nota.id)
    }
  }

  const nomePorTagId = new Map(todasTags.map((tag) => [tag.id, tag.nome]))

  const wikilinks: Relacao[] = []
  const wikilinksVistos = new Set<string>()
  for (const nota of notasAtivas) {
    for (const alvo of extrairLinksDoTexto(nota.conteudo)) {
      const destinoId = tituloPorId.get(normalizarTitulo(alvo))
      if (destinoId === undefined || destinoId === nota.id) {
        continue
      }
      const chave = `${nota.id}|${destinoId}`
      if (wikilinksVistos.has(chave)) {
        continue
      }
      wikilinksVistos.add(chave)
      wikilinks.push({ origemId: nota.id, destinoId, tipo: 'wikilink', peso: 1 })
    }
  }

  const porTag = new Map<string, Set<string>>()
  for (const nota of notasAtivas) {
    for (const tagId of nota.tagIds) {
      const ids = porTag.get(tagId)
      if (ids === undefined) {
        porTag.set(tagId, new Set([nota.id]))
      } else {
        ids.add(nota.id)
      }
    }
  }

  const tagPares = new Map<string, { rotulos: string[]; peso: number }>()
  for (const [tagId, ids] of porTag) {
    if (ids.size < 2 || ids.size > MAX_NOTAS_POR_TAG) {
      continue
    }
    const nome = nomePorTagId.get(tagId) ?? tagId
    conectarPares(new Map([[tagId, ids]]), tagPares, nome)
  }

  const relacoesDeTag: Relacao[] = []
  for (const [chave, dados] of tagPares) {
    const [origemId, destinoId] = chave.split('|')
    relacoesDeTag.push({
      origemId,
      destinoId,
      tipo: 'tag',
      rotulo: dados.rotulos.join(', '),
      peso: dados.peso,
    })
  }

  const termoPares = new Map<string, { rotulos: string[]; peso: number }>()
  for (const frequencia of listarFrequenciasDeTermos(todas)) {
    conectarPares(
      new Map([[frequencia.termo, new Set(frequencia.notaIds)]]),
      termoPares,
      frequencia.termo,
    )
  }

  const relacoesDeTermo: Relacao[] = []
  for (const [chave, dados] of termoPares) {
    const [origemId, destinoId] = chave.split('|')
    relacoesDeTermo.push({
      origemId,
      destinoId,
      tipo: 'termo',
      rotulo: dados.rotulos.slice(0, MAX_TERMOS_NO_ROTULO).join(', '),
      peso: dados.peso,
    })
  }

  const relacoes = [...wikilinks, ...relacoesDeTag, ...relacoesDeTermo]
  const porTipo: Record<TipoRelacao, Relacao[]> = {
    wikilink: wikilinks,
    tag: relacoesDeTag,
    termo: relacoesDeTermo,
  }

  return {
    notasAtivas,
    relacoes,
    porTipo,
    resolverPorTitulo: (titulo) => tituloPorId.get(normalizarTitulo(titulo)) ?? null,
    obterPorId: (id) => porId.get(id),
  }
}

export function vizinhancaDe(notaId: string, grafo: GrafoDeNotas): Set<string> {
  const conjunto = new Set<string>([notaId])
  for (const relacao of grafo.relacoes) {
    if (relacao.origemId === notaId) {
      conjunto.add(relacao.destinoId)
    }
    if (relacao.destinoId === notaId) {
      conjunto.add(relacao.origemId)
    }
  }
  return conjunto
}

export function backlinksDe(notaId: string, grafo: GrafoDeNotas): Relacao[] {
  return grafo.relacoes.filter(
    (relacao) => relacao.tipo === 'wikilink' && relacao.destinoId === notaId,
  )
}