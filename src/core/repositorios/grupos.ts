import type { Grupo } from '../../domain'
import { gerarId } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'

const STORE = 'grupos'

export type NovoGrupoRepositorio = Pick<Grupo, 'nome' | 'criadoPor'>

export const gruposStore = {
  async criar(novo: NovoGrupoRepositorio): Promise<Grupo> {
    const grupo: Grupo = {
      id: gerarId(),
      nome: novo.nome.trim(),
      criadoPor: novo.criadoPor,
      criadaEm: new Date().toISOString(),
    }
    await gravarItem(STORE, grupo)
    return grupo
  },

  async obter(id: string): Promise<Grupo | undefined> {
    return lerItem<Grupo>(STORE, id)
  },

  async listarTodas(): Promise<Grupo[]> {
    return listarItens<Grupo>(STORE)
  },

  async listar(): Promise<Grupo[]> {
    const todos = await this.listarTodas()
    return todos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  },

  async renomear(id: string, nome: string): Promise<Grupo | undefined> {
    const existente = await this.obter(id)
    if (existente === undefined) {
      return undefined
    }
    const atualizado: Grupo = { ...existente, nome: nome.trim() }
    await gravarItem(STORE, atualizado)
    return atualizado
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
  },
}
