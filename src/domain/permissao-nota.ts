import type { TipoAlvoPermissao } from './tipos'

export interface PermissaoNota {
  id: string
  notaId: string
  alvoTipo: TipoAlvoPermissao
  alvoId: string
  podeSugerir: boolean
  criadaEm: string
}

export type NovaPermissaoNota = Omit<PermissaoNota, 'id' | 'criadaEm'>
