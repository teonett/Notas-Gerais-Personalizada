import type { Caderno } from '../../domain'
import { gerarId } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'
import { registrarCaderno, registrarRemocao } from '../../sync/mudancas'

const STORE = 'cadernos'

export const cadernosStore = {
  async criar(nome: string, paiId: string | null = null): Promise<Caderno> {
    const agora = new Date().toISOString()
    const caderno: Caderno = {
      id: gerarId(),
      nome: nome.trim(),
      paiId,
      criadaEm: agora,
    }
    await gravarItem(STORE, caderno)
    await registrarCaderno(caderno)
    return caderno
  },

  async obter(id: string): Promise<Caderno | undefined> {
    return lerItem<Caderno>(STORE, id)
  },

  async listarTodas(): Promise<Caderno[]> {
    return listarItens<Caderno>(STORE)
  },

  async listar(): Promise<Caderno[]> {
    const todos = await this.listarTodas()
    return todos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  },

  async renomear(id: string, nome: string): Promise<Caderno | undefined> {
    const existente = await lerItem<Caderno>(STORE, id)
    if (existente === undefined) {
      return undefined
    }
    const atualizado: Caderno = { ...existente, nome: nome.trim() }
    await gravarItem(STORE, atualizado)
    await registrarCaderno(atualizado)
    return atualizado
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
    await registrarRemocao('caderno', id)
  },
}