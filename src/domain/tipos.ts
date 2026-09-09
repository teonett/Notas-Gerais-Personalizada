export const STATUS_NOTA = {
  ATIVA: 'ATIVA',
  ARQUIVADA: 'ARQUIVADA',
  LIXEIRA: 'LIXEIRA',
} as const

export type StatusNota = (typeof STATUS_NOTA)[keyof typeof STATUS_NOTA]

export const FORMATO_NOTA = {
  TXT: 'TXT',
  MARKDOWN: 'MARKDOWN',
  HTML: 'HTML',
} as const

export type FormatoNota = (typeof FORMATO_NOTA)[keyof typeof FORMATO_NOTA]

export const STATUS_LABELS: Record<StatusNota, string> = {
  ATIVA: 'Ativa',
  ARQUIVADA: 'Arquivada',
  LIXEIRA: 'Na lixeira',
}