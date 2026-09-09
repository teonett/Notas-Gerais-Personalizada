import { STATUS_NOTA } from '../../domain/tipos'
import type { Nota } from '../../domain/nota'
import { STOPWORDS } from './stopwords'

export const TAMANHO_MINIMO_TERMO = 4
export const FRACAO_MAXIMA_TERMO = 0.35

export interface FrequenciaDeTermo {
  termo: string
  peso: number
  quantidadeDeNotas: number
  notaIds: string[]
}

function normalizarTextoBruto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function obterTokens(texto: string): string[] {
  return normalizarTextoBruto(texto).match(/[a-z0-9]{4,}/g) ?? []
}

function eTermoUtil(termo: string): boolean {
  return !STOPWORDS.has(termo)
}

function limiteDeFrequencia(totalDeNotas: number): number {
  return Math.max(2, Math.floor(totalDeNotas * FRACAO_MAXIMA_TERMO))
}

export function listarFrequenciasDeTermos(todas: Nota[]): FrequenciaDeTermo[] {
  const notasAtivas = todas.filter((nota) => nota.status === STATUS_NOTA.ATIVA)
  const ocorrencias = new Map<string, { peso: number; notas: Map<string, number> }>()

  for (const nota of notasAtivas) {
    const pesosDaNota = new Map<string, number>()
    for (const token of obterTokens(nota.titulo)) {
      pesosDaNota.set(token, (pesosDaNota.get(token) ?? 0) + 2)
    }
    for (const token of obterTokens(nota.conteudo)) {
      pesosDaNota.set(token, (pesosDaNota.get(token) ?? 0) + 1)
    }
    for (const [termo, peso] of pesosDaNota) {
      if (!eTermoUtil(termo)) {
        continue
      }
      const atual = ocorrencias.get(termo)
      if (atual === undefined) {
        ocorrencias.set(termo, { peso, notas: new Map([[nota.id, peso]]) })
      } else {
        atual.peso += peso
        atual.notas.set(nota.id, peso)
      }
    }
  }

  const teto = limiteDeFrequencia(notasAtivas.length)
  return [...ocorrencias.entries()]
    .filter(([, dados]) => dados.notas.size >= 2 && dados.notas.size <= teto)
    .map(([termo, dados]) => ({
      termo,
      peso: dados.peso,
      quantidadeDeNotas: dados.notas.size,
      notaIds: [...dados.notas.keys()],
    }))
    .sort((a, b) => b.peso - a.peso)
}