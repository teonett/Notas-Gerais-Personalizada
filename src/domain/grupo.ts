export interface Grupo {
  id: string
  nome: string
  criadoPor: string
  criadaEm: string
}

export interface MembroGrupo {
  id: string
  grupoId: string
  usuarioId: string
  adicionadaEm: string
}

export type NovoGrupo = Pick<Grupo, 'nome' | 'criadoPor'>
