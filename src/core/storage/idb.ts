import { AppError } from '../errors'
import { ERROR_CODES } from '../errors'
import { logger } from '../errors'
import { BANCO, type StoreName } from './config'
import type { StorageStatus } from './types'

let instanciaBancoPromessa: Promise<IDBDatabase> | null = null

function criarErro(
  codigo: (typeof ERROR_CODES.ARMAZENAMENTO)[keyof typeof ERROR_CODES.ARMAZENAMENTO],
  mensagem: string,
): AppError {
  return new AppError(codigo, mensagem)
}

function criarIndexSeNaoExistir(
  store: IDBObjectStore,
  nome: string,
  caminho: string | string[],
  opcoes?: IDBIndexParameters,
): void {
  if (!store.indexNames.contains(nome)) {
    store.createIndex(nome, caminho, opcoes)
  }
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(BANCO.nome, BANCO.versao)

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result

      if (!banco.objectStoreNames.contains(BANCO.stores.meta)) {
        banco.createObjectStore(BANCO.stores.meta)
      }

      if (!banco.objectStoreNames.contains(BANCO.stores.notas)) {
        const storeNotas = banco.createObjectStore(BANCO.stores.notas, { keyPath: 'id' })
        criarIndexSeNaoExistir(storeNotas, 'status', 'status')
        criarIndexSeNaoExistir(storeNotas, 'alteradaEm', 'alteradaEm')
        criarIndexSeNaoExistir(storeNotas, 'criadaEm', 'criadaEm')
        criarIndexSeNaoExistir(storeNotas, 'favorita', 'favorita')
        criarIndexSeNaoExistir(storeNotas, 'fixada', 'fixada')
        criarIndexSeNaoExistir(storeNotas, 'cadernoId', 'cadernoId')
        criarIndexSeNaoExistir(storeNotas, 'tagIds', 'tagIds', { multiEntry: true })
      }

      if (!banco.objectStoreNames.contains(BANCO.stores.cadernos)) {
        const storeCadernos = banco.createObjectStore(BANCO.stores.cadernos, { keyPath: 'id' })
        criarIndexSeNaoExistir(storeCadernos, 'nome', 'nome')
        criarIndexSeNaoExistir(storeCadernos, 'paiId', 'paiId')
      }

      if (!banco.objectStoreNames.contains(BANCO.stores.tags)) {
        const storeTags = banco.createObjectStore(BANCO.stores.tags, { keyPath: 'id' })
        criarIndexSeNaoExistir(storeTags, 'nome', 'nome')
      }

      if (!banco.objectStoreNames.contains(BANCO.stores.anexos)) {
        const storeAnexos = banco.createObjectStore(BANCO.stores.anexos, { keyPath: 'id' })
        criarIndexSeNaoExistir(storeAnexos, 'notaId', 'notaId')
        criarIndexSeNaoExistir(storeAnexos, 'criadaEm', 'criadaEm')
      }

      if (!banco.objectStoreNames.contains(BANCO.stores.sincronizacao)) {
        banco.createObjectStore(BANCO.stores.sincronizacao)
      }
    }

    requisicao.onsuccess = () => {
      resolve(requisicao.result)
    }

    requisicao.onerror = () => {
      reject(
        criarErro(
          ERROR_CODES.ARMAZENAMENTO.FALHA_ABRIR_BANCO,
          'Não foi possível abrir o banco de dados local.',
        ),
      )
    }
  })
}

export function abrirBancoDeDados(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(
      criarErro(
        ERROR_CODES.ARMAZENAMENTO.NAO_SUPORTADO,
        'Armazenamento local não suportado neste navegador.',
      ),
    )
  }

  if (instanciaBancoPromessa === null) {
    instanciaBancoPromessa = abrirBanco()
    void instanciaBancoPromessa.catch(() => {
      instanciaBancoPromessa = null
    })
  }

  return instanciaBancoPromessa
}

export async function obterStatusArmazenamento(): Promise<StorageStatus> {
  const suportado = typeof window !== 'undefined' && 'indexedDB' in window
  if (!suportado) {
    return { suportado: false, somenteLeitura: false }
  }

  try {
    const banco = await abrirBancoDeDados()
    return { suportado: true, somenteLeitura: banco.version <= 0 }
  } catch {
    logger.aviso('Falha ao verificar armazenamento local.')
    return { suportado: true, somenteLeitura: true }
  }
}

export async function lerMeta(chave: string): Promise<string | undefined> {
  const banco = await abrirBancoDeDados()
  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(BANCO.stores.meta, 'readonly')
    const requisicao = transacao.objectStore(BANCO.stores.meta).get(chave)

    requisicao.onsuccess = () => {
      resolve(requisicao.result as string | undefined)
    }
    requisicao.onerror = () => {
      reject(
        criarErro(
          ERROR_CODES.ARMAZENAMENTO.FALHA_OPERACAO,
          'Não foi possível ler os dados locais.',
        ),
      )
    }
  })
}

export async function gravarMeta(chave: string, valor: string): Promise<void> {
  const banco = await abrirBancoDeDados()
  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(BANCO.stores.meta, 'readwrite')
    transacao.objectStore(BANCO.stores.meta).put(valor, chave)

    transacao.oncomplete = () => resolve()
    transacao.onerror = () => {
      reject(
        criarErro(
          ERROR_CODES.ARMAZENAMENTO.FALHA_OPERACAO,
          'Não foi possível gravar os dados locais.',
        ),
      )
    }
  })
}

export function prepararPersistencia(): Promise<StorageStatus> {
  return obterStatusArmazenamento()
}

export type { StorageStatus }
export type { StoreName }