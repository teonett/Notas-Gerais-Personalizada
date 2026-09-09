import type { ContaLocal } from '../../domain'
import { AppError } from '../errors'
import { ERROR_CODES } from '../errors'
import { comTransacao, requisicaoParaPromessa } from '../repositorios/base'
import type { StoreName } from '../storage/config'
import { AUT } from './constantes'
import {
  digerirTexto,
  gerarSalt,
  materialDaConta,
  validarSenha,
  verificadorDeMaterial,
} from './crypto'

const LOJA = AUT.lojaContas as StoreName

function erro(
  codigo: (typeof ERROR_CODES.AUTH)[keyof typeof ERROR_CODES.AUTH],
  mensagem: string,
): AppError {
  return new AppError(codigo, mensagem)
}

export function normalizarNomeConta(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR')
}

async function abrirBancoDeContas(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(AUT.nomeBancoContas, AUT.versaoBancoContas)
    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result
      if (!banco.objectStoreNames.contains(LOJA)) {
        const loja = banco.createObjectStore(LOJA, { keyPath: 'id' })
        loja.createIndex(AUT.indiceNome, 'nomeNorm', { unique: true })
      }
    }
    requisicao.onsuccess = () => resolve(requisicao.result)
    requisicao.onerror = () =>
      reject(
        erro(
          ERROR_CODES.AUTH.CONTA_NAO_ENCONTRADA,
          'Não foi possível acessar as contas locais.',
        ),
      )
  })
}

export async function listarContas(): Promise<ContaLocal[]> {
  const banco = await abrirBancoDeContas()
  const contas = await comTransacao<ContaLocal[]>(banco, LOJA, 'readonly', async (transacao) =>
    requisicaoParaPromessa<ContaLocal[]>(
      transacao.objectStore(LOJA).getAll() as IDBRequest<ContaLocal[]>,
    ),
  )
  return contas.sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
}

export async function obterContaPorNome(nome: string): Promise<ContaLocal | undefined> {
  const banco = await abrirBancoDeContas()
  return comTransacao(banco, LOJA, 'readonly', async (transacao) =>
    requisicaoParaPromessa(
      transacao.objectStore(LOJA).index(AUT.indiceNome).get(normalizarNomeConta(nome)) as IDBRequest<ContaLocal | undefined>,
    ),
  )
}

export async function criarConta(nome: string, senha: string): Promise<ContaLocal> {
  const nomeLimp = nome.trim()
  if (nomeLimp === '') {
    throw erro(
      ERROR_CODES.AUTH.CONTA_NAO_ENCONTRADA,
      'Informe um nome de usuário para a conta.',
    )
  }
  const falhaSenha = validarSenha(senha)
  if (falhaSenha !== null) {
    throw erro(ERROR_CODES.AUTH.SENHA_FRACA, falhaSenha)
  }
  const nomeNorm = normalizarNomeConta(nomeLimp)
  if ((await obterContaPorNome(nomeNorm)) !== undefined) {
    throw erro(
      ERROR_CODES.AUTH.CONTA_JA_EXISTE,
      'Já existe uma conta com esse nome de usuário.',
    )
  }
  const salt = gerarSalt()
  const material = await materialDaConta(senha, salt)
  const conta: ContaLocal = {
    id: await digerirTexto(nomeNorm),
    nome: nomeLimp,
    nomeNorm,
    salt,
    verificador: verificadorDeMaterial(material),
    criadaEm: new Date().toISOString(),
  }
  const banco = await abrirBancoDeContas()
  await comTransacao(banco, LOJA, 'readwrite', async (transacao) => {
    transacao.objectStore(LOJA).put(conta)
  })
  return conta
}

export async function apagarConta(id: string): Promise<void> {
  const banco = await abrirBancoDeContas()
  await comTransacao(banco, LOJA, 'readwrite', async (transacao) => {
    transacao.objectStore(LOJA).delete(id)
  })
}