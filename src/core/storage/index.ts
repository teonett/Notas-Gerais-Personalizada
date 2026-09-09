export { BANCO } from './config'
export type { StoreName } from './config'
export {
  abrirBancoDeDados,
  apagarItem,
  gravarItem,
  gravarMeta,
  lerItem,
  lerMeta,
  listarItens,
  obterStatusArmazenamento,
  prepararPersistencia,
} from './idb'
export type { StorageError, StorageStatus } from './types'