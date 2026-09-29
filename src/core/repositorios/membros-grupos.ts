import type { MembroGrupo } from '../../domain'
import { gerarId } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'

const STORE = 'membrosGrupos'

export type NovoMembroGrupoRepositorio = Pick<MembroGrupo, 'grupoId' | 'usuarioId'>

export const membrosGruposStore = {
  async adicionar(novo: NovoMembroGrupoRepositorio): Promise<MembroGrupo> {
    const membro: MembroGrupo = {
      id: gerarId(),
      grupoId: novo.grupoId,
      usuarioId: novo.usuarioId,
      adicionadaEm: new Date().toISOString(),
    }
    await gravarItem(STORE, membro)
    return membro
  },

  async obter(id: string): Promise<MembroGrupo | undefined> {
    return lerItem<MembroGrupo>(STORE, id)
  },

  async listarTodas(): Promise<MembroGrupo[]> {
    return listarItens<MembroGrupo>(STORE)
  },

  async listarPorGrupo(grupoId: string): Promise<MembroGrupo[]> {
    const todos = await this.listarTodas()
    return todos.filter((membro) => membro.grupoId === grupoId)
  },

  async listarPorUsuario(usuarioId: string): Promise<MembroGrupo[]> {
    const todos = await this.listarTodas()
    return todos.filter((membro) => membro.usuarioId === usuarioId)
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
  },
}
