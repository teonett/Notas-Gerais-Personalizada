import type { Tag } from '../../domain'
import { gerarId } from '../../domain'
import { abrirBancoDeDados } from '../storage/idb'
import { comTransacao, requisicaoParaPromessa } from './base'
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
    const banco = await abrirBancoDeDados()

    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      transacao.objectStore(STORE).put(tag)
    })
    await registrarTag(tag)

    return tag
  },

  async obter(id: string): Promise<Tag | undefined> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      return requisicaoParaPromessa(transacao.objectStore(STORE).get(id))
    })
  },

  async listarTodas(): Promise<Tag[]> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      return requisicaoParaPromessa(transacao.objectStore(STORE).getAll())
    })
  },

  async listar(): Promise<Tag[]> {
    const todas = await this.listarTodas()
    return todas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  },

  async renomear(id: string, nome: string): Promise<Tag | undefined> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      const store = transacao.objectStore(STORE)
      const existente = await requisicaoParaPromessa(store.get(id))
      if (existente === undefined) {
        return undefined
      }
      const atualizada: Tag = { ...existente, nome: nome.trim() }
      await requisicaoParaPromessa(store.put(atualizada))
      await registrarTag(atualizada)
      return atualizada
    })
  },

  async remover(id: string): Promise<void> {
    const banco = await abrirBancoDeDados()
    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      transacao.objectStore(STORE).delete(id)
    })
    await registrarRemocao('tag', id)
  },
}