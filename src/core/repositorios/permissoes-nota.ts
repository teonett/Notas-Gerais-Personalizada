import type { PermissaoNota } from '../../domain'
import { gerarId } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'

const STORE = 'permissoesNota'

export type NovaPermissaoNotaRepositorio = Omit<PermissaoNota, 'id' | 'criadaEm'>

export const permissoesNotaStore = {
  async criar(nova: NovaPermissaoNotaRepositorio): Promise<PermissaoNota> {
    const permissao: PermissaoNota = {
      id: gerarId(),
      notaId: nova.notaId,
      alvoTipo: nova.alvoTipo,
      alvoId: nova.alvoId,
      podeSugerir: nova.podeSugerir,
      criadaEm: new Date().toISOString(),
    }
    await gravarItem(STORE, permissao)
    return permissao
  },

  async conceder(nova: NovaPermissaoNotaRepositorio): Promise<PermissaoNota> {
    const existente = (await this.listarPorNota(nova.notaId)).find(
      (permissao) =>
        permissao.alvoTipo === nova.alvoTipo && permissao.alvoId === nova.alvoId,
    )
    if (existente !== undefined) {
      const atualizada: PermissaoNota = {
        ...existente,
        podeSugerir: nova.podeSugerir,
      }
      await gravarItem(STORE, atualizada)
      return atualizada
    }
    return this.criar(nova)
  },

  async obter(id: string): Promise<PermissaoNota | undefined> {
    return lerItem<PermissaoNota>(STORE, id)
  },

  async listarTodas(): Promise<PermissaoNota[]> {
    return listarItens<PermissaoNota>(STORE)
  },

  async listarPorNota(notaId: string): Promise<PermissaoNota[]> {
    const todas = await this.listarTodas()
    return todas.filter((permissao) => permissao.notaId === notaId)
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
  },

  async removerPorNotaAlvo(
    notaId: string,
    alvoTipo: PermissaoNota['alvoTipo'],
    alvoId: string,
  ): Promise<void> {
    const permissoes = await this.listarPorNota(notaId)
    for (const permissao of permissoes) {
      if (permissao.alvoTipo === alvoTipo && permissao.alvoId === alvoId) {
        await apagarItem(STORE, permissao.id)
      }
    }
  },
}
