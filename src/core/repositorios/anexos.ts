import type { Anexo, NovoAnexo } from '../../domain'
import { gerarId } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'
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
    await gravarItem(STORE, anexo)
    await registrarAnexo(anexo)
    return anexo
  },

  async obter(id: string): Promise<Anexo | undefined> {
    return lerItem<Anexo>(STORE, id)
  },

  async listarPorNota(notaId: string): Promise<Anexo[]> {
    const anexos = await this.listarTodas()
    return anexos
      .filter((anexo) => anexo.notaId === notaId)
      .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
  },

  async listarTodas(): Promise<Anexo[]> {
    const anexos = await listarItens<Anexo>(STORE)
    return anexos.sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
  },

  async remover(id: string): Promise<void> {
    await apagarItem(STORE, id)
    await registrarRemocao('anexo', id)
  },

  async removerPorNota(notaId: string): Promise<void> {
    const aRemover = (await this.listarTodas()).filter(
      (anexo) => anexo.notaId === notaId,
    )
    for (const anexo of aRemover) {
      await apagarItem(STORE, anexo.id)
    }
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