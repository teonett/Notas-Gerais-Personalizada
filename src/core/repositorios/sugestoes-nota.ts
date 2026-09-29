import type { SugestaoNota } from '../../domain'
import { gerarId, STATUS_SUGESTAO_NOTA } from '../../domain'
import { gravarItem, lerItem, listarItens } from '../storage/idb'

const STORE = 'sugestoesNota'

export type NovaSugestaoNotaRepositorio = Pick<
  SugestaoNota,
  'notaId' | 'autorId' | 'conteudoBase' | 'conteudoSugerido'
>

export const sugestoesNotaStore = {
  async criar(nova: NovaSugestaoNotaRepositorio): Promise<SugestaoNota> {
    const sugestao: SugestaoNota = {
      id: gerarId(),
      notaId: nova.notaId,
      autorId: nova.autorId,
      conteudoBase: nova.conteudoBase,
      conteudoSugerido: nova.conteudoSugerido,
      status: STATUS_SUGESTAO_NOTA.PENDENTE,
      criadaEm: new Date().toISOString(),
      revisadaEm: null,
      revisadaPor: null,
    }
    await gravarItem(STORE, sugestao)
    return sugestao
  },

  async obter(id: string): Promise<SugestaoNota | undefined> {
    return lerItem<SugestaoNota>(STORE, id)
  },

  async listarTodas(): Promise<SugestaoNota[]> {
    return listarItens<SugestaoNota>(STORE)
  },

  async listarPorNota(notaId: string): Promise<SugestaoNota[]> {
    const todas = await this.listarTodas()
    return todas.filter((sugestao) => sugestao.notaId === notaId)
  },

  async revisar(
    id: string,
    status: SugestaoNota['status'],
    revisadaPor: string,
  ): Promise<SugestaoNota | undefined> {
    const existente = await this.obter(id)
    if (existente === undefined) {
      return undefined
    }
    const atualizada: SugestaoNota = {
      ...existente,
      status,
      revisadaEm: new Date().toISOString(),
      revisadaPor,
    }
    await gravarItem(STORE, atualizada)
    return atualizada
  },
}
