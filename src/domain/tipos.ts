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

export const PAPEL_USUARIO = {
  USUARIO: 'USUARIO',
  ADMIN: 'ADMIN',
} as const

export type PapelUsuario = (typeof PAPEL_USUARIO)[keyof typeof PAPEL_USUARIO]

export const VISIBILIDADE_NOTA = {
  PRIVADA: 'PRIVADA',
  PUBLICA: 'PUBLICA',
} as const

export type VisibilidadeNota = (typeof VISIBILIDADE_NOTA)[keyof typeof VISIBILIDADE_NOTA]

export const STATUS_SUGESTAO_NOTA = {
  PENDENTE: 'PENDENTE',
  ACEITA: 'ACEITA',
  REJEITADA: 'REJEITADA',
  CONFLITO: 'CONFLITO',
} as const

export type StatusSugestaoNota = (
  typeof STATUS_SUGESTAO_NOTA
)[keyof typeof STATUS_SUGESTAO_NOTA]

export const TIPO_ALVO_PERMISSAO = {
  USUARIO: 'USUARIO',
  GRUPO: 'GRUPO',
} as const

export type TipoAlvoPermissao = (
  typeof TIPO_ALVO_PERMISSAO
)[keyof typeof TIPO_ALVO_PERMISSAO]
