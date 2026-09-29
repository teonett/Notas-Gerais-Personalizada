import type { PapelUsuario } from './tipos'

export const USUARIO_PADRAO_ID = 'usuario-padrao'
export const NOME_USUARIO_PADRAO = 'Usuario padrao'

export interface Usuario {
  id: string
  nome: string
  papeis: PapelUsuario[]
  ativo: boolean
  criadaEm: string
}

export type NovoUsuario = Pick<Usuario, 'nome' | 'papeis'>
