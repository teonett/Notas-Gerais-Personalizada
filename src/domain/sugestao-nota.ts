import type { StatusSugestaoNota } from './tipos'

export interface SugestaoNota {
  id: string
  notaId: string
  autorId: string
  conteudoBase: string
  conteudoSugerido: string
  status: StatusSugestaoNota
  criadaEm: string
  revisadaEm: string | null
  revisadaPor: string | null
}

export type NovaSugestaoNota = Pick<
  SugestaoNota,
  'notaId' | 'autorId' | 'conteudoBase' | 'conteudoSugerido'
>
