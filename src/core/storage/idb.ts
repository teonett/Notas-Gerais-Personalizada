import { AppError } from '../errors'
import { ERROR_CODES } from '../errors'
import { logger } from '../errors'
import { BANCO, type StoreName } from './config'
import type { StorageStatus } from './types'
import { comTransacao, requisicaoParaPromessa } from '../repositorios/base'
import { AUT } from '../auth/constantes'
import type { Nota, Usuario } from '../../domain'
import {
  NOME_USUARIO_PADRAO,
  PAPEL_USUARIO,
  USUARIO_PADRAO_ID,
  VISIBILIDADE_NOTA,
} from '../../domain'
import {
  cifrarBytes,
  decifrarBytes,
  ehEnvelope,
  type EnvelopeCifrado,
} from '../vault/cifrar'
import { valorDoPersistivel, valorPersistivel } from '../vault/serial'

const bancosPorNome = new Map<string, Promise<IDBDatabase>>()
const migracoesMultiusuarioPorNome = new Map<string, Promise<void>>()

let contaAtivaId: string | null = null
let contaAtivaNome: string | null = null
let chaveAtiva: CryptoKey | null = null

const MIGRACAO_MULTIUSUARIO = {
  metaChave: 'thothnet:migracaoMultiusuario',
  versao: '1',
} as const

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

function obterStoreDoUpgrade(
  banco: IDBDatabase,
  transacao: IDBTransaction | null,
  nome: StoreName,
  opcoes?: IDBObjectStoreParameters,
): IDBObjectStore {
  if (banco.objectStoreNames.contains(nome)) {
    if (transacao === null) {
      throw new Error('Transacao de upgrade indisponivel.')
    }
    return transacao.objectStore(nome)
  }
  return banco.createObjectStore(nome, opcoes)
}

function montarEsquema(banco: IDBDatabase, transacao: IDBTransaction | null): void {
  if (!banco.objectStoreNames.contains(BANCO.stores.meta)) {
    banco.createObjectStore(BANCO.stores.meta)
  }

  const storeNotas = obterStoreDoUpgrade(banco, transacao, BANCO.stores.notas, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeNotas, 'status', 'status')
  criarIndexSeNaoExistir(storeNotas, 'alteradaEm', 'alteradaEm')
  criarIndexSeNaoExistir(storeNotas, 'criadaEm', 'criadaEm')
  criarIndexSeNaoExistir(storeNotas, 'favorita', 'favorita')
  criarIndexSeNaoExistir(storeNotas, 'fixada', 'fixada')
  criarIndexSeNaoExistir(storeNotas, 'cadernoId', 'cadernoId')
  criarIndexSeNaoExistir(storeNotas, 'tagIds', 'tagIds', { multiEntry: true })
  criarIndexSeNaoExistir(storeNotas, 'ownerId', 'ownerId')
  criarIndexSeNaoExistir(storeNotas, 'visibilidade', 'visibilidade')

  const storeCadernos = obterStoreDoUpgrade(banco, transacao, BANCO.stores.cadernos, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeCadernos, 'nome', 'nome')
  criarIndexSeNaoExistir(storeCadernos, 'paiId', 'paiId')

  const storeTags = obterStoreDoUpgrade(banco, transacao, BANCO.stores.tags, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeTags, 'nome', 'nome')

  const storeAnexos = obterStoreDoUpgrade(banco, transacao, BANCO.stores.anexos, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeAnexos, 'notaId', 'notaId')
  criarIndexSeNaoExistir(storeAnexos, 'criadaEm', 'criadaEm')

  if (!banco.objectStoreNames.contains(BANCO.stores.sincronizacao)) {
    banco.createObjectStore(BANCO.stores.sincronizacao)
  }

  const storeUsuarios = obterStoreDoUpgrade(banco, transacao, BANCO.stores.usuarios, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeUsuarios, 'nome', 'nome')
  criarIndexSeNaoExistir(storeUsuarios, 'ativo', 'ativo')

  const storeGrupos = obterStoreDoUpgrade(banco, transacao, BANCO.stores.grupos, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeGrupos, 'nome', 'nome')
  criarIndexSeNaoExistir(storeGrupos, 'criadoPor', 'criadoPor')

  const storeMembros = obterStoreDoUpgrade(banco, transacao, BANCO.stores.membrosGrupos, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeMembros, 'grupoId', 'grupoId')
  criarIndexSeNaoExistir(storeMembros, 'usuarioId', 'usuarioId')

  const storePermissoes = obterStoreDoUpgrade(banco, transacao, BANCO.stores.permissoesNota, { keyPath: 'id' })
  criarIndexSeNaoExistir(storePermissoes, 'notaId', 'notaId')
  criarIndexSeNaoExistir(storePermissoes, 'alvoId', 'alvoId')
  criarIndexSeNaoExistir(storePermissoes, 'alvoTipo', 'alvoTipo')

  const storeSugestoes = obterStoreDoUpgrade(banco, transacao, BANCO.stores.sugestoesNota, { keyPath: 'id' })
  criarIndexSeNaoExistir(storeSugestoes, 'notaId', 'notaId')
  criarIndexSeNaoExistir(storeSugestoes, 'autorId', 'autorId')
  criarIndexSeNaoExistir(storeSugestoes, 'status', 'status')
}

function abrirBancoComNome(nome: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(nome, BANCO.versao)

    requisicao.onupgradeneeded = () => {
      montarEsquema(requisicao.result, requisicao.transaction)
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
  const nome = nomeDoBancoAtivo()
  return abrirBancoPeloNome(nome).then(async (banco) => {
    await migrarMultiusuarioSeNecessario(nome, banco)
    return banco
  })
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
  nome?: string | null,
): void {
  contaAtivaId = contaId
  contaAtivaNome = nome ?? null
  chaveAtiva = chave
}

export function obterUsuarioPadraoAtual(): Pick<Usuario, 'id' | 'nome'> {
  return {
    id: contaAtivaId ?? USUARIO_PADRAO_ID,
    nome: contaAtivaNome ?? NOME_USUARIO_PADRAO,
  }
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

async function lerMetaNoBanco(banco: IDBDatabase, chave: string): Promise<string | undefined> {
  const bruto = await comTransacao(banco, BANCO.stores.meta, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(BANCO.stores.meta).get(chave)),
  )
  if (bruto === undefined) {
    return undefined
  }
  return (await desembalar(bruto)) as string
}

async function gravarMetaNoBanco(
  banco: IDBDatabase,
  chave: string,
  valor: string,
): Promise<void> {
  const empacotado = await embalar(valor)
  await comTransacao(banco, BANCO.stores.meta, 'readwrite', async (transacao) => {
    transacao.objectStore(BANCO.stores.meta).put(empacotado, chave)
  })
}

async function listarItensNoBanco<T>(banco: IDBDatabase, loja: StoreName): Promise<T[]> {
  const brutos = await comTransacao(banco, loja, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(loja).getAll()),
  )
  const itens: T[] = []
  for (const bruto of brutos) {
    itens.push((await desembalar(bruto)) as T)
  }
  return itens
}

async function gravarItemNoBanco(
  banco: IDBDatabase,
  loja: StoreName,
  valor: unknown,
): Promise<void> {
  const identificador = (valor as { id?: string }).id
  const empacotado = await embalar(valor, identificador)
  await comTransacao(banco, loja, 'readwrite', async (transacao) => {
    transacao.objectStore(loja).put(empacotado)
  })
}

function notaPrecisaMigrar(nota: Nota): boolean {
  return nota.ownerId === undefined || nota.ownerId === null || nota.visibilidade === undefined
}

async function migrarMultiusuarioNoBanco(banco: IDBDatabase): Promise<void> {
  if (contaAtivaId !== null && chaveAtiva === null) {
    return
  }

  const usuarioPadrao = obterUsuarioPadraoAtual()
  const notas = await listarItensNoBanco<Nota>(banco, BANCO.stores.notas)
  const usuarios = await listarItensNoBanco<Usuario>(banco, BANCO.stores.usuarios)
  const existeUsuarioPadrao = usuarios.some((usuario) => usuario.id === usuarioPadrao.id)
  const notasPendentes = notas.filter(notaPrecisaMigrar)
  const migracaoRegistrada = await lerMetaNoBanco(banco, MIGRACAO_MULTIUSUARIO.metaChave)

  if (
    migracaoRegistrada === MIGRACAO_MULTIUSUARIO.versao &&
    existeUsuarioPadrao &&
    notasPendentes.length === 0
  ) {
    return
  }

  const agora = new Date().toISOString()
  if (!existeUsuarioPadrao) {
    await gravarItemNoBanco(banco, BANCO.stores.usuarios, {
      id: usuarioPadrao.id,
      nome: usuarioPadrao.nome,
      papeis: [PAPEL_USUARIO.USUARIO],
      ativo: true,
      criadaEm: agora,
    } satisfies Usuario)
  }

  for (const nota of notasPendentes) {
    await gravarItemNoBanco(banco, BANCO.stores.notas, {
      ...nota,
      ownerId: nota.ownerId ?? usuarioPadrao.id,
      visibilidade: nota.visibilidade ?? VISIBILIDADE_NOTA.PRIVADA,
    } satisfies Nota)
  }

  await gravarMetaNoBanco(
    banco,
    MIGRACAO_MULTIUSUARIO.metaChave,
    MIGRACAO_MULTIUSUARIO.versao,
  )
}

async function migrarMultiusuarioSeNecessario(
  nome: string,
  banco: IDBDatabase,
): Promise<void> {
  let migracao = migracoesMultiusuarioPorNome.get(nome)
  if (migracao === undefined) {
    migracao = migrarMultiusuarioNoBanco(banco).finally(() => {
      migracoesMultiusuarioPorNome.delete(nome)
    })
    migracoesMultiusuarioPorNome.set(nome, migracao)
  }
  await migracao
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

export interface OperacaoGravacao {
  loja: StoreName
  valor: unknown
  chave?: string
}

interface OperacaoGravacaoPreparada {
  loja: StoreName
  valor: unknown
  chave?: string
}

export async function gravarItensEmTransacao(operacoes: OperacaoGravacao[]): Promise<void> {
  if (operacoes.length === 0) {
    return
  }

  const preparadas: OperacaoGravacaoPreparada[] = []
  for (const operacao of operacoes) {
    if (operacao.chave === undefined) {
      const identificador = (operacao.valor as { id?: string }).id
      preparadas.push({
        loja: operacao.loja,
        valor: await embalar(operacao.valor, identificador),
      })
    } else {
      preparadas.push({
        loja: operacao.loja,
        valor: await embalar(operacao.valor),
        chave: operacao.chave,
      })
    }
  }

  const lojas = [...new Set(preparadas.map((operacao) => operacao.loja))]
  const banco = await abrirBancoDeDados()
  await comTransacao(banco, lojas, 'readwrite', async (transacao) => {
    try {
      for (const operacao of preparadas) {
        const store = transacao.objectStore(operacao.loja)
        if (operacao.chave === undefined) {
          store.put(operacao.valor)
        } else {
          store.put(operacao.valor, operacao.chave)
        }
      }
    } catch (erro) {
      transacao.abort()
      throw erro
    }
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

export interface EntradaArmazenada<T> {
  chave: string
  valor: T
}

export async function listarEntradas<T>(loja: StoreName): Promise<EntradaArmazenada<T>[]> {
  const banco = await abrirBancoDeDados()
  const brutos = await comTransacao(banco, loja, 'readonly', async (transacao) => {
    const store = transacao.objectStore(loja)
    const [chaves, valores] = await Promise.all([
      requisicaoParaPromessa(store.getAllKeys() as IDBRequest<IDBValidKey[]>),
      requisicaoParaPromessa(store.getAll()),
    ])
    return chaves.map((chave, indice) => ({ chave, valor: valores[indice] }))
  })

  const entradas: EntradaArmazenada<T>[] = []
  for (const bruto of brutos) {
    if (typeof bruto.chave !== 'string') {
      continue
    }
    entradas.push({
      chave: bruto.chave,
      valor: (await desembalar(bruto.valor)) as T,
    })
  }
  return entradas
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
