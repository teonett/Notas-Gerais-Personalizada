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
  dados: unknown
}

export function novaRevisao(dispositivo: string): Revisao {
  return { carimbo: Date.now(), dispositivo }
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

export function revisaoParaChave(revisao: Revisao): string {
  return `${revisao.carimbo}__${revisao.dispositivo}`
}

export function revisaoDeChave(chave: string): Revisao | null {
  const separador = chave.indexOf('__')
  if (separador <= 0) {
    return null
  }
  const carimbo = Number(chave.slice(0, separador))
  const dispositivo = chave.slice(separador + 2)
  if (!Number.isFinite(carimbo) || dispositivo === '') {
    return null
  }
  return { carimbo, dispositivo }
}

export const CHAVES_SINCRONIZACAO = {
  dispositivo: 'dispositivo',
  cursor: 'cursor',
  ultimaSincronizacao: 'ultimaSincronizacao',
  prefixoRegistro: 'reg:',
  prefixoPendente: 'pendente:',
  prefixoBlobPendente: 'blobPendente:',
} as const

export const TAMANHO_LOTE = 200