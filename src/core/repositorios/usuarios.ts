import type { Usuario } from '../../domain'
import { gerarId, PAPEL_USUARIO } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'

const STORE = 'usuarios'

export type NovoUsuarioRepositorio = Pick<Usuario, 'nome'> &
  Partial<Pick<Usuario, 'id' | 'papeis' | 'ativo'>>

export const usuariosStore = {
  async criar(novo: NovoUsuarioRepositorio): Promise<Usuario> {
    const usuario: Usuario = {
      id: novo.id ?? gerarId(),
      nome: novo.nome.trim(),
      papeis: novo.papeis ?? [PAPEL_USUARIO.USUARIO],
      ativo: novo.ativo ?? true,
      criadaEm: new Date().toISOString(),
    }
    await gravarItem(STORE, usuario)
    return usuario
  },

  async garantir(novo: NovoUsuarioRepositorio): Promise<Usuario> {
    if (novo.id !== undefined) {
      const existente = await this.obter(novo.id)
      if (existente !== undefined) {
        return existente
      }
    }
    return this.criar(novo)
  },

  async obter(id: string): Promise<Usuario | undefined> {
    return lerItem<Usuario>(STORE, id)
  },

  async listarTodas(): Promise<Usuario[]> {
    return listarItens<Usuario>(STORE)
  },

  async listar(): Promise<Usuario[]> {
    const todos = await this.listarTodas()
    return todos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  },

  async atualizar(
    id: string,
    mudancas: Partial<Omit<Usuario, 'id' | 'criadaEm'>>,
  ): Promise<Usuario | undefined> {
    const existente = await this.obter(id)
    if (existente === undefined) {
      return undefined
    }
    const atualizado: Usuario = { ...existente, ...mudancas }
    await gravarItem(STORE, atualizado)
    return atualizado
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
  },
}
