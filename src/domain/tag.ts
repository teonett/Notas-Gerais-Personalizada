export interface Tag {
  id: string
  nome: string
  criadaEm: string
}

export type NovaTag = Pick<Tag, 'nome'>