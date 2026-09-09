import { BANCO } from '../core/storage/config'
import { abrirBancoDeDados } from '../core/storage/idb'
import { comTransacao, requisicaoParaPromessa } from '../core/repositorios/base'

const STORE = BANCO.stores.sincronizacao

export async function lerSincronizacao(chave: string): Promise<string | undefined> {
  const banco = await abrirBancoDeDados()
  return comTransacao(banco, STORE, 'readonly', async (transacao) => {
    return requisicaoParaPromessa(
      transacao.objectStore(STORE).get(chave) as IDBRequest<string | undefined>,
    )
  })
}

export async function gravarSincronizacao(chave: string, valor: string): Promise<void> {
  const banco = await abrirBancoDeDados()
  await comTransacao(banco, STORE, 'readwrite', async (transacao) => {
    transacao.objectStore(STORE).put(valor, chave)
  })
}

export async function apagarSincronizacao(chave: string): Promise<void> {
  const banco = await abrirBancoDeDados()
  await comTransacao(banco, STORE, 'readwrite', async (transacao) => {
    transacao.objectStore(STORE).delete(chave)
  })
}

export async function listarPorPrefixo(
  prefixo: string,
): Promise<Array<{ chave: string; valor: string }>> {
  const banco = await abrirBancoDeDados()
  const chaves = await comTransacao(banco, STORE, 'readonly', async (transacao) => {
    return requisicaoParaPromessa(
      transacao.objectStore(STORE).getAllKeys() as IDBRequest<IDBValidKey[]>,
    )
  })

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
  const chaves = await comTransacao(banco, STORE, 'readonly', async (transacao) => {
    return requisicaoParaPromessa(
      transacao.objectStore(STORE).getAllKeys() as IDBRequest<IDBValidKey[]>,
    )
  })
  return chaves.filter((chave) => typeof chave === 'string' && chave.startsWith(prefixo)).length
}