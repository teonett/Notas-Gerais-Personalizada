export interface Caderno {
  id: string
  nome: string
  paiId: string | null
  criadaEm: string
}

export type NovoCaderno = Pick<Caderno, 'nome' | 'paiId'>