import type { Anexo, NovoAnexo } from '../../domain'
import { gerarId } from '../../domain'
import { abrirBancoDeDados } from '../storage/idb'
import { comTransacao, requisicaoParaPromessa } from './base'
import { registrarAnexo, registrarRemocao } from '../../sync/mudancas'

const STORE = 'anexos'

function construirAnexo(novo: NovoAnexo): Anexo {
  return {
    id: gerarId(),
    notaId: novo.notaId ?? null,
    nome: novo.nome.trim(),
    mime: novo.mime,
    tamanho: novo.dados.size,
    dados: novo.dados,
    criadaEm: new Date().toISOString(),
  }
}

export const anexosStore = {
  async criar(novo: NovoAnexo): Promise<Anexo> {
    const anexo = construirAnexo(novo)
    const banco = await abrirBancoDeDados()
    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      transacao.objectStore(STORE).put(anexo)
    })
    await registrarAnexo(anexo)
    return anexo
  },

  async obter(id: string): Promise<Anexo | undefined> {
    const banco = await abrirBancoDeDados()
    return comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      return requisicaoParaPromessa(transacao.objectStore(STORE).get(id))
    })
  },

  async listarPorNota(notaId: string): Promise<Anexo[]> {
    const banco = await abrirBancoDeDados()
    let anexos = await comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      const indice = transacao.objectStore(STORE).index('notaId')
      return requisicaoParaPromessa(indice.getAll(notaId))
    })
    anexos = (anexos as Anexo[]).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    return anexos
  },

  async listarTodas(): Promise<Anexo[]> {
    const banco = await abrirBancoDeDados()
    let anexos = await comTransacao(banco, [STORE], 'readonly', async (transacao) => {
      return requisicaoParaPromessa(transacao.objectStore(STORE).getAll())
    })
    anexos = (anexos as Anexo[]).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    return anexos
  },

  async remover(id: string): Promise<void> {
    const banco = await abrirBancoDeDados()
    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      transacao.objectStore(STORE).delete(id)
    })
    await registrarRemocao('anexo', id)
  },

  async removerPorNota(notaId: string): Promise<void> {
    const banco = await abrirBancoDeDados()
    const aRemover: Anexo[] = []
    await comTransacao(banco, [STORE], 'readwrite', async (transacao) => {
      const store = transacao.objectStore(STORE)
      const anexos = await requisicaoParaPromessa(store.index('notaId').getAll(notaId))
      for (const anexo of anexos) {
        aRemover.push(anexo)
        store.delete(anexo.id)
      }
    })
    for (const anexo of aRemover) {
      await registrarRemocao('anexo', anexo.id)
    }
  },
}

export function baixarAnexo(anexo: Anexo): void {
  const url = URL.createObjectURL(anexo.dados)
  const link = document.createElement('a')
  link.href = url
  link.download = anexo.nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const urlsDeAnexos = new Map<string, string>()

export function urlDeBlobAnexo(anexo: Anexo): string {
  let url = urlsDeAnexos.get(anexo.id)
  if (url === undefined) {
    url = URL.createObjectURL(anexo.dados)
    urlsDeAnexos.set(anexo.id, url)
  }
  return url
}