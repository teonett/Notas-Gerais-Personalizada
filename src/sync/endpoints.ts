import type { ConfiguracaoSync } from './config'
import { erroSincronizacao } from './config'
import { ERROR_CODES } from '../core/errors/errorCodes'
import type { RegistroSync, Revisao } from './contrato'

async function requisicao(
  config: ConfiguracaoSync,
  caminho: string,
  init: RequestInit,
): Promise<Response> {
  let resposta: Response
  try {
    resposta = await fetch(`${config.urlBase}${caminho}`, init)
  } catch {
    throw erroSincronizacao(
      ERROR_CODES.SINCRONIZACAO.SEM_CONEXAO,
      'Não foi possível conectar ao servidor de sincronização.',
    )
  }

  if (resposta.status === 401 || resposta.status === 403) {
    throw erroSincronizacao(
      ERROR_CODES.SINCRONIZACAO.FALHA_AUTENTICACAO,
      'O segredo compartilhado foi recusado pelo servidor.',
    )
  }
  if (!resposta.ok) {
    throw erroSincronizacao(
      ERROR_CODES.SINCRONIZACAO.FALHA_SERVIDOR,
      `O servidor de sincronização respondeu com erro (${resposta.status}).`,
    )
  }
  return resposta
}

function cabecalhos(config: ConfiguracaoSync, tipo: string): Record<string, string> {
  return {
    Authorization: `Bearer ${config.segredo}`,
    'Content-Type': tipo,
  }
}

export interface RespostaPush {
  aceitas: Array<Pick<RegistroSync, 'tipo' | 'id' | 'revisao'>>
}

export async function enviarPush(
  config: ConfiguracaoSync,
  mudancas: RegistroSync[],
): Promise<Array<Pick<RegistroSync, 'tipo' | 'id' | 'revisao'>>> {
  const resposta = await requisicao(config, '/api/sync/push', {
    method: 'POST',
    headers: cabecalhos(config, 'application/json'),
    body: JSON.stringify({ mudancas }),
  })
  const corpo = (await resposta.json()) as RespostaPush
  return corpo.aceitas
}

export async function enviarPull(
  config: ConfiguracaoSync,
  desde: Revisao | null,
): Promise<RegistroSync[]> {
  const resposta = await requisicao(config, '/api/sync/pull', {
    method: 'POST',
    headers: cabecalhos(config, 'application/json'),
    body: JSON.stringify({ desde }),
  })
  const corpo = (await resposta.json()) as { mudancas: RegistroSync[] }
  return corpo.mudancas
}

export async function enviarBlobAnexo(
  config: ConfiguracaoSync,
  id: string,
  bytes: ArrayBuffer,
  mime: string,
  nome: string,
): Promise<void> {
  await requisicao(config, `/api/anexos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.segredo}`,
      'Content-Type': mime || 'application/octet-stream',
      'x-anexo-nome': nome,
      'x-anexo-mime': mime,
    },
    body: bytes,
  })
}

export async function baixarBlobAnexo(config: ConfiguracaoSync, id: string): Promise<Blob> {
  const resposta = await requisicao(config, `/api/anexos/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: cabecalhos(config, 'application/octet-stream'),
  })
  return resposta.blob()
}