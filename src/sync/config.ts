import { AppError } from '../core/errors/AppError'
import { ERROR_CODES } from '../core/errors/errorCodes'

export interface ConfiguracaoSync {
  urlBase: string
  segredo: string
}

export const SINCRONIZACAO = {
  metaChaveUrl: 'thothnet:sincronizacaoUrl',
  metaChaveSegredo: 'thothnet:sincronizacaoSegredo',
} as const

import { lerMeta, gravarMeta } from '../core/storage/idb'

function normalizarUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function validarConfiguracao(config: ConfiguracaoSync): string | null {
  if (config.segredo.trim() === '') {
    return 'Informe o segredo compartilhado.'
  }
  const url = normalizarUrl(config.urlBase)
  if (!/^https?:\/\/.+/i.test(url)) {
    return 'A URL deve começar com http:// ou https://.'
  }
  return null
}

export function limparUrlSync(url: string): string {
  return normalizarUrl(url)
}

export async function lerConfiguracaoSync(): Promise<ConfiguracaoSync | null> {
  const url = await lerMeta(SINCRONIZACAO.metaChaveUrl)
  const segredo = await lerMeta(SINCRONIZACAO.metaChaveSegredo)
  if (url === undefined || segredo === undefined) {
    return null
  }
  return { urlBase: url, segredo }
}

export async function salvarConfiguracaoSync(config: ConfiguracaoSync): Promise<void> {
  await gravarMeta(SINCRONIZACAO.metaChaveUrl, normalizarUrl(config.urlBase))
  await gravarMeta(SINCRONIZACAO.metaChaveSegredo, config.segredo.trim())
}

export async function removerConfiguracaoSync(): Promise<void> {
  await Promise.all([
    gravarMeta(SINCRONIZACAO.metaChaveUrl, ''),
    gravarMeta(SINCRONIZACAO.metaChaveSegredo, ''),
  ])
}

export function erroSincronizacao(
  codigo: (typeof ERROR_CODES.SINCRONIZACAO)[keyof typeof ERROR_CODES.SINCRONIZACAO],
  mensagem: string,
): AppError {
  return new AppError(codigo, mensagem)
}