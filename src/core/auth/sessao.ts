import type { ContaLocal, SessaoPublica } from '../../domain'
import { AppError } from '../errors'
import { ERROR_CODES } from '../errors'
import { garantirPrimeiroAdministrador } from '../governanca'
import { configurarCofre, excluirBancoPeloNome, fecharBancoPeloNome } from '../storage/idb'
import { AUT } from './constantes'
import { apagarConta, criarConta, obterContaPorNome } from './contas'
import { compararSegredos, derivarChaveEVerificador } from './crypto'

interface SessaoAtiva {
  contaId: string
  nome: string
  chave: CryptoKey
}

let sessao: SessaoAtiva | null = null
const ouvintes = new Set<() => void>()

function notificar(): void {
  for (const ouvinte of [...ouvintes]) {
    ouvinte()
  }
}

export function assinarSessao(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function estaDesbloqueada(): boolean {
  return sessao !== null
}

export function obterSessao(): SessaoPublica | null {
  if (sessao === null) {
    return null
  }
  return { contaId: sessao.contaId, nome: sessao.nome }
}

export function obterChaveDaSessao(): CryptoKey | null {
  return sessao?.chave ?? null
}

async function ativarSessao(conta: ContaLocal, chave: CryptoKey): Promise<void> {
  configurarCofre(conta.id, chave, conta.nome)
  await garantirPrimeiroAdministrador({ usuarioId: conta.id })
  sessao = { contaId: conta.id, nome: conta.nome, chave }
  notificar()
}

export async function desbloquear(nome: string, senha: string): Promise<void> {
  const conta = await obterContaPorNome(nome)
  if (conta === undefined) {
    throw new AppError(
      ERROR_CODES.AUTH.CONTA_NAO_ENCONTRADA,
      'Não existe uma conta com esse nome de usuário.',
    )
  }
  const { chave, verificador } = await derivarChaveEVerificador(senha, conta.salt)
  if (!compararSegredos(verificador, conta.verificador)) {
    throw new AppError(
      ERROR_CODES.AUTH.SENHA_INVALIDA,
      'A senha está incorreta para essa conta.',
    )
  }
  await ativarSessao(conta, chave)
}

export async function criarContaLocal(nome: string, senha: string): Promise<ContaLocal> {
  const conta = await criarConta(nome, senha)
  const { chave } = await derivarChaveEVerificador(senha, conta.salt)
  await ativarSessao(conta, chave)
  return conta
}

export async function bloquear(): Promise<void> {
  const contaId = sessao?.contaId ?? null
  configurarCofre(contaId, null)
  sessao = null
  notificar()
}

export async function removerContaAtual(): Promise<void> {
  if (sessao === null) {
    return
  }
  const id = sessao.contaId
  const nomeBanco = `${AUT.prefixoBancoCofre}${id}`
  await bloquear()
  await fecharBancoPeloNome(nomeBanco)
  await excluirBancoPeloNome(nomeBanco)
  await apagarConta(id)
}

export async function removerConta(id: string): Promise<void> {
  if (sessao?.contaId === id) {
    await removerContaAtual()
    return
  }
  await fecharBancoPeloNome(`${AUT.prefixoBancoCofre}${id}`)
  await excluirBancoPeloNome(`${AUT.prefixoBancoCofre}${id}`)
  await apagarConta(id)
}
