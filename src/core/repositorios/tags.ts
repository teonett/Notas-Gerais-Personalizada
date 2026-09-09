import type { Tag } from '../../domain'
import { gerarId } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'
import { registrarRemocao, registrarTag } from '../../sync/mudancas'

const STORE = 'tags'

export const tagsStore = {
  async criar(nome: string): Promise<Tag> {
    const agora = new Date().toISOString()
    const tag: Tag = {
      id: gerarId(),
      nome: nome.trim(),
      criadaEm: agora,
    }
    await gravarItem(STORE, tag)
    await registrarTag(tag)
    return tag
  },

  async obter(id: string): Promise<Tag | undefined> {
    return lerItem<Tag>(STORE, id)
  },

  async listarTodas(): Promise<Tag[]> {
    return listarItens<Tag>(STORE)
  },

  async listar(): Promise<Tag[]> {
    const todas = await this.listarTodas()
    return todas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  },

  async renomear(id: string, nome: string): Promise<Tag | undefined> {
    const existente = await lerItem<Tag>(STORE, id)
    if (existente === undefined) {
      return undefined
    }
    const atualizada: Tag = { ...existente, nome: nome.trim() }
    await gravarItem(STORE, atualizada)
    await registrarTag(atualizada)
    return atualizada
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
    await registrarRemocao('tag', id)
  },
}