import { AppError } from '../errors'
import { ERROR_CODES } from '../errors'
import { BANCO, type StoreName } from '../storage/config'
import {
  abrirBancoPeloNome,
  gravarItem,
  gravarMeta,
  listarItens,
} from '../storage/idb'
import { comTransacao, requisicaoParaPromessa } from '../repositorios/base'
import { SINCRONIZACAO } from '../../sync/config'

const LOJAS: StoreName[] = [
  BANCO.stores.notas,
  BANCO.stores.cadernos,
  BANCO.stores.tags,
  BANCO.stores.anexos,
]

export async function haDadosNoBancoAtual(): Promise<boolean> {
  const notas = await listarItens(BANCO.stores.notas)
  return notas.length > 0
}

export interface ResultadoMigracao {
  contagens: Record<StoreName, number>
  configSyncImportada: boolean
}

export async function migrarDadosLegados(): Promise<ResultadoMigracao> {
  const notasDoCofre = await listarItens(BANCO.stores.notas)
  if (notasDoCofre.length > 0) {
    throw new AppError(
      ERROR_CODES.AUTH.LEGADO_VAZIO,
      'A conta atual já possui notas; não é possível migrar os dados anteriores.',
    )
  }

  const legado = await abrirBancoPeloNome(BANCO.nome)
  const resultado: ResultadoMigracao = {
    contagens: {
      meta: 0,
      notas: 0,
      cadernos: 0,
      tags: 0,
      anexos: 0,
      sincronizacao: 0,
    },
    configSyncImportada: false,
  }

  for (const loja of LOJAS) {
    const itens = await comTransacao(legado, loja, 'readonly', async (transacao) =>
      requisicaoParaPromessa(transacao.objectStore(loja).getAll()),
    )
    resultado.contagens[loja] = itens.length
    for (const item of itens) {
      if ((item as { id?: string }).id === undefined) {
        continue
      }
      await gravarItem(loja, item)
    }
  }

  const url = await lerMetaDoLegado(legado, SINCRONIZACAO.metaChaveUrl)
  const segredo = await lerMetaDoLegado(legado, SINCRONIZACAO.metaChaveSegredo)
  if (url !== undefined && segredo !== undefined) {
    await gravarMeta(SINCRONIZACAO.metaChaveUrl, url)
    await gravarMeta(SINCRONIZACAO.metaChaveSegredo, segredo)
    resultado.configSyncImportada = true
  }

  return resultado
}

async function lerMetaDoLegado(
  banco: IDBDatabase,
  chave: string,
): Promise<string | undefined> {
  return comTransacao(banco, BANCO.stores.meta, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(BANCO.stores.meta).get(chave)),
  )
}