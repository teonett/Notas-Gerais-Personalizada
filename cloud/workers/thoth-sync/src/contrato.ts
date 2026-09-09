export const TIPOS_REGISTRO = {
  nota: 'nota',
  caderno: 'caderno',
  tag: 'tag',
  anexo: 'anexo',
} as const

export type TipoRegistro = (typeof TIPOS_REGISTRO)[keyof typeof TIPOS_REGISTRO]

export interface Revisao {
  carimbo: number
  dispositivo: string
}

export interface RegistroSync {
  tipo: TipoRegistro
  id: string
  revisao: Revisao
  apagado: boolean
  dados: Record<string, unknown> | null
}

export function compararRevisoes(a: Revisao, b: Revisao): number {
  if (a.carimbo !== b.carimbo) {
    return a.carimbo - b.carimbo
  }
  if (a.dispositivo === b.dispositivo) {
    return 0
  }
  return a.dispositivo < b.dispositivo ? -1 : 1
}

export const TAMANHO_LOTE = 200