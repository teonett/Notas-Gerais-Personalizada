export { BANCO } from './config'
export type { StoreName } from './config'
export {
  abrirBancoDeDados,
  gravarMeta,
  lerMeta,
  obterStatusArmazenamento,
  prepararPersistencia,
} from './idb'
export type { StorageError, StorageStatus } from './types'