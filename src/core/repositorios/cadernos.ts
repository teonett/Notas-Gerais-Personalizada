import type { Caderno } from '../../domain'
import { gerarId } from '../../domain'
import { abrirBancoDeDados } from '../storage/idb'
import { comTransacao, requisicaoParaPromessa } from './base'
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
    const banco = await abrirBancoDeDados()

    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      transacao.objectStore(STORE).put(caderno)
    })
    await registrarCaderno(caderno)

    return caderno
  },

  async obter(id: string): Promise<Caderno | undefined> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      return requisicaoParaPromessa(transacao.objectStore(STORE).get(id))
    })
  },

  async listarTodas(): Promise<Caderno[]> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      return requisicaoParaPromessa(transacao.objectStore(STORE).getAll())
    })
  },

  async listar(): Promise<Caderno[]> {
    const todos = await this.listarTodas()
    return todos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  },

  async renomear(id: string, nome: string): Promise<Caderno | undefined> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      const store = transacao.objectStore(STORE)
      const existente = await requisicaoParaPromessa(store.get(id))
      if (existente === undefined) {
        return undefined
      }
      const atualizado: Caderno = { ...existente, nome: nome.trim() }
      await requisicaoParaPromessa(store.put(atualizado))
      await registrarCaderno(atualizado)
      return atualizado
    })
  },

  async remover(id: string): Promise<void> {
    const banco = await abrirBancoDeDados()
    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      transacao.objectStore(STORE).delete(id)
    })
    await registrarRemocao('caderno', id)
  },
}