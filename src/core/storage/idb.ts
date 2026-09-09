import { AppError } from '../errors'
import { ERROR_CODES } from '../errors'
import { logger } from '../errors'
import { BANCO, type StoreName } from './config'
import type { StorageStatus } from './types'
import { comTransacao, requisicaoParaPromessa } from '../repositorios/base'
import { AUT } from '../auth/constantes'
import {
  cifrarBytes,
  decifrarBytes,
  ehEnvelope,
  type EnvelopeCifrado,
} from '../vault/cifrar'
import { valorDoPersistivel, valorPersistivel } from '../vault/serial'

const bancosPorNome = new Map<string, Promise<IDBDatabase>>()

let contaAtivaId: string | null = null
let chaveAtiva: CryptoKey | null = null

function criarErro(
  codigo: (typeof ERROR_CODES.ARMAZENAMENTO)[keyof typeof ERROR_CODES.ARMAZENAMENTO],
  mensagem: string,
): AppError {
  return new AppError(codigo, mensagem)
}

function criarErroAuth(
  codigo: (typeof ERROR_CODES.AUTH)[keyof typeof ERROR_CODES.AUTH],
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

function montarEsquema(banco: IDBDatabase): void {
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

function abrirBancoComNome(nome: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(nome, BANCO.versao)

    requisicao.onupgradeneeded = () => {
      montarEsquema(requisicao.result)
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

export function nomeDoBancoAtivo(): string {
  return contaAtivaId === null ? BANCO.nome : `${AUT.prefixoBancoCofre}${contaAtivaId}`
}

export function abrirBancoPeloNome(nome: string): Promise<IDBDatabase> {
  let promessa = bancosPorNome.get(nome)
  if (promessa === undefined) {
    promessa = abrirBancoComNome(nome)
    promessa.catch(() => {
      bancosPorNome.delete(nome)
    })
    bancosPorNome.set(nome, promessa)
  }
  return promessa
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
  return abrirBancoPeloNome(nomeDoBancoAtivo())
}

export async function fecharBancoPeloNome(nome: string): Promise<void> {
  const promessa = bancosPorNome.get(nome)
  bancosPorNome.delete(nome)
  if (promessa !== undefined) {
    const banco = await promessa.catch(() => null)
    banco?.close()
  }
}

export async function fecharBancoDeDados(): Promise<void> {
  await fecharBancoPeloNome(nomeDoBancoAtivo())
}

export function configurarCofre(
  contaId: string | null,
  chave: CryptoKey | null,
): void {
  contaAtivaId = contaId
  chaveAtiva = chave
}

export function obterChaveDeCifragem(): CryptoKey | null {
  return chaveAtiva
}

export async function excluirBancoPeloNome(nome: string): Promise<void> {
  await fecharBancoPeloNome(nome)
  if (typeof indexedDB === 'undefined') {
    return
  }
  await new Promise<void>((resolve) => {
    const requisicao = indexedDB.deleteDatabase(nome)
    requisicao.onsuccess = () => resolve()
    requisicao.onerror = () => resolve()
    requisicao.onblocked = () => resolve()
  })
}

async function embalar(valor: unknown, identificador?: string): Promise<unknown> {
  const persistivel = await valorPersistivel(valor)
  if (chaveAtiva === null) {
    if (contaAtivaId !== null) {
      throw criarErroAuth(
        ERROR_CODES.AUTH.SESSAO_BLOQUEADA,
        'Os dados estão bloqueados até você digitar a senha da conta.',
      )
    }
    return persistivel
  }
  const bytes = new TextEncoder().encode(JSON.stringify(persistivel))
  const envelope = await cifrarBytes(chaveAtiva, bytes)
  if (identificador !== undefined) {
    return { ...envelope, id: identificador }
  }
  return envelope
}

async function desembalar(valor: unknown): Promise<unknown> {
  if (ehEnvelope(valor)) {
    if (chaveAtiva === null) {
      throw criarErroAuth(
        ERROR_CODES.AUTH.SESSAO_BLOQUEADA,
        'Os dados estão bloqueados até você digitar a senha da conta.',
      )
    }
    const persistivel = await desembalarEnvelope(chaveAtiva, valor)
    return valorDoPersistivel(persistivel)
  }
  return valorDoPersistivel(valor)
}

async function desembalarEnvelope(chave: CryptoKey, envelope: EnvelopeCifrado): Promise<unknown> {
  const bytes = await decifrarBytes(chave, envelope)
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

export async function lerItem<T>(loja: StoreName, id: string): Promise<T | undefined> {
  const banco = await abrirBancoDeDados()
  const bruto = await comTransacao(banco, loja, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(loja).get(id)),
  )
  if (bruto === undefined) {
    return undefined
  }
  return (await desembalar(bruto)) as T
}

export async function gravarItem(
  loja: StoreName,
  valor: unknown,
  chave?: string,
): Promise<void> {
  const banco = await abrirBancoDeDados()
  if (chave === undefined) {
    const identificador = (valor as { id?: string }).id
    const empacotado = await embalar(valor, identificador)
    await comTransacao(banco, loja, 'readwrite', async (transacao) => {
      transacao.objectStore(loja).put(empacotado)
    })
    return
  }
  const empacotado = await embalar(valor)
  await comTransacao(banco, loja, 'readwrite', async (transacao) => {
    transacao.objectStore(loja).put(empacotado, chave)
  })
}

export async function listarItens<T>(loja: StoreName): Promise<T[]> {
  const banco = await abrirBancoDeDados()
  const brutos = await comTransacao(banco, loja, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(loja).getAll()),
  )
  const itens: T[] = []
  for (const bruto of brutos) {
    itens.push((await desembalar(bruto)) as T)
  }
  return itens
}

export async function apagarItem(loja: StoreName, id: string): Promise<void> {
  const banco = await abrirBancoDeDados()
  await comTransacao(banco, loja, 'readwrite', async (transacao) => {
    transacao.objectStore(loja).delete(id)
  })
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
  const bruto = await comTransacao(banco, BANCO.stores.meta, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(BANCO.stores.meta).get(chave)),
  )
  if (bruto === undefined) {
    return undefined
  }
  return (await desembalar(bruto)) as string
}

export async function gravarMeta(chave: string, valor: string): Promise<void> {
  const banco = await abrirBancoDeDados()
  const empacotado = await embalar(valor)
  await comTransacao(banco, BANCO.stores.meta, 'readwrite', async (transacao) => {
    transacao.objectStore(BANCO.stores.meta).put(empacotado, chave)
  })
}

export function prepararPersistencia(): Promise<StorageStatus> {
  return obterStatusArmazenamento()
}

export type { StorageStatus }
export type { StoreName }