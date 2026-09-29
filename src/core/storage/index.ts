export { BANCO } from './config'
export type { StoreName } from './config'
export {
  abrirBancoDeDados,
  apagarItem,
  gravarItem,
  gravarItensEmTransacao,
  gravarMeta,
  lerItem,
  lerMeta,
  listarEntradas,
  listarItens,
  obterStatusArmazenamento,
  obterUsuarioPadraoAtual,
  prepararPersistencia,
} from './idb'
export type { EntradaArmazenada } from './idb'
export type { OperacaoGravacao } from './idb'
export type { StorageError, StorageStatus } from './types'
