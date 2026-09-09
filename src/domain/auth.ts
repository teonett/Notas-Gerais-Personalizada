export interface ContaLocal {
  id: string
  nome: string
  nomeNorm: string
  salt: string
  verificador: string
  criadaEm: string
}

export interface SessaoPublica {
  contaId: string
  nome: string
}