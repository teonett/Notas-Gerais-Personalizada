import { STATUS_NOTA } from '../../domain/tipos'
import type { Nota } from '../../domain/nota'
import { PADRAO_LINK_SOURCE } from './constantes'

export interface Relacao {
  origemId: string
  destinoId: string
}

export interface GrafoDeNotas {
  notasAtivas: Nota[]
  relacoes: Relacao[]
  resolverPorTitulo: (titulo: string) => string | null
  obterPorId: (id: string) => Nota | undefined
}

export function normalizarTitulo(titulo: string): string {
  return titulo.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function extrairLinksDoTexto(conteudo: string): string[] {
  const titulos: string[] = []
  for (const partida of conteudo.matchAll(new RegExp(PADRAO_LINK_SOURCE, 'g'))) {
    titulos.push(partida[1].trim())
  }
  return titulos
}

export function construirGrafoDeNotas(todas: Nota[]): GrafoDeNotas {
  const notasAtivas = todas.filter((nota) => nota.status === STATUS_NOTA.ATIVA)
  const porId = new Map(notasAtivas.map((nota) => [nota.id, nota]))

  const tituloPorId = new Map<string, string>()
  for (const nota of notasAtivas) {
    const chave = normalizarTitulo(nota.titulo)
    if (!tituloPorId.has(chave)) {
      tituloPorId.set(chave, nota.id)
    }
  }

  const relacoes: Relacao[] = []
  const vistas = new Set<string>()
  for (const nota of notasAtivas) {
    for (const alvo of extrairLinksDoTexto(nota.conteudo)) {
      const destinoId = tituloPorId.get(normalizarTitulo(alvo))
      if (destinoId === undefined || destinoId === nota.id) {
        continue
      }
      const chave = `${nota.id}|${destinoId}`
      if (vistas.has(chave)) {
        continue
      }
      vistas.add(chave)
      relacoes.push({ origemId: nota.id, destinoId })
    }
  }

  return {
    notasAtivas,
    relacoes,
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
  return grafo.relacoes.filter((relacao) => relacao.destinoId === notaId)
}