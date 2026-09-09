import type { FormatoNota, StatusNota } from './tipos'

export interface Nota {
  id: string
  titulo: string
  conteudo: string
  formato: FormatoNota
  status: StatusNota
  favorita: boolean
  fixada: boolean
  cadernoId: string | null
  tagIds: string[]
  criadaEm: string
  alteradaEm: string
  excluidaEm: string | null
}

export type NovaNota = Omit<
  Nota,
  'id' | 'status' | 'favorita' | 'fixada' | 'criadaEm' | 'alteradaEm' | 'excluidaEm'
>

export type AlteracaoNota = Partial<
  Omit<Nota, 'id' | 'criadaEm' | 'alteradaEm'>
>

export function tituloDaNota(nota: Nota | undefined, padrao = 'Sem título'): string {
  return nota?.titulo.trim() !== '' ? (nota?.titulo ?? padrao) : padrao
}