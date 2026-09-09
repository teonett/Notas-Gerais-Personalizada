import { BANCO } from '../core/storage/config'
import { apagarItem, gravarItem, lerItem } from '../core/storage/idb'
import { abrirBancoDeDados } from '../core/storage/idb'
import { comTransacao, requisicaoParaPromessa } from '../core/repositorios/base'

const STORE = BANCO.stores.sincronizacao

export async function lerSincronizacao(chave: string): Promise<string | undefined> {
  return lerItem<string>(STORE, chave)
}

export async function gravarSincronizacao(chave: string, valor: string): Promise<void> {
  await gravarItem(STORE, valor, chave)
}

export async function apagarSincronizacao(chave: string): Promise<void> {
  await apagarItem(STORE, chave)
}

export async function listarPorPrefixo(
  prefixo: string,
): Promise<Array<{ chave: string; valor: string }>> {
  const banco = await abrirBancoDeDados()
  const chaves = await comTransacao(banco, STORE, 'readonly', async (transacao) =>
    requisicaoParaPromessa(
      transacao.objectStore(STORE).getAllKeys() as IDBRequest<IDBValidKey[]>,
    ),
  )

  const encontrados: Array<{ chave: string; valor: string }> = []
  for (const chaveBruta of chaves) {
    if (typeof chaveBruta !== 'string' || !chaveBruta.startsWith(prefixo)) {
      continue
    }
    const valor = await lerSincronizacao(chaveBruta)
    if (valor !== undefined) {
      encontrados.push({ chave: chaveBruta, valor })
    }
  }
  return encontrados
}

export async function contarPorPrefixo(prefixo: string): Promise<number> {
  const banco = await abrirBancoDeDados()
  const chaves = await comTransacao(banco, STORE, 'readonly', async (transacao) =>
    requisicaoParaPromessa(
      transacao.objectStore(STORE).getAllKeys() as IDBRequest<IDBValidKey[]>,
    ),
  )
  return chaves.filter((chave) => typeof chave === 'string' && chave.startsWith(prefixo)).length
}