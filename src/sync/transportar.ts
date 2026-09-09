import { ERROR_CODES } from '../core/errors/errorCodes'
import { anexosStore } from '../core/repositorios/anexos'
import type { ConfiguracaoSync } from './config'
import { erroSincronizacao, lerConfiguracaoSync } from './config'
import type { RegistroSync, Revisao } from './contrato'
import { CHAVES_SINCRONIZACAO, compararRevisoes, TAMANHO_LOTE } from './contrato'
import {
  apagarSincronizacao,
  contarPorPrefixo,
  gravarSincronizacao,
  lerSincronizacao,
  listarPorPrefixo,
} from './armazenamento'
import { processarBlobsPendentes } from './blobs'
import { enviarBlobAnexo, enviarPull, enviarPush } from './endpoints'
import { aplicarRegistros } from './aplicar'

export interface ResultadoSincronizacao {
  enviadas: number
  recebidas: number
  blobsBaixados: number
}

export interface EstadoSincronizacao {
  configurada: boolean
  url: string
  ultimaSincronizacao: string | null
  pendentes: number
  blobsPendentes: number
}

async function lerCursor(): Promise<Revisao | null> {
  const valor = await lerSincronizacao(CHAVES_SINCRONIZACAO.cursor)
  if (valor === undefined) {
    return null
  }
  return JSON.parse(valor) as Revisao
}

async function enviarPendentes(config: ConfiguracaoSync): Promise<number> {
  const pendentes = await listarPorPrefixo(CHAVES_SINCRONIZACAO.prefixoPendente)
  if (pendentes.length === 0) {
    return 0
  }

  const registros = pendentes.map((p) => JSON.parse(p.valor) as RegistroSync)

  for (const registro of registros) {
    if (registro.tipo === 'anexo' && !registro.apagado) {
      const anexo = await anexosStore.obter(registro.id)
      if (anexo === undefined) {
        throw erroSincronizacao(
          ERROR_CODES.SINCRONIZACAO.FALHA_SERVIDOR,
          'Os dados de um anexo não foram encontrados no dispositivo.',
        )
      }
      const bytes = await anexo.dados.arrayBuffer()
      await enviarBlobAnexo(config, anexo.id, bytes, anexo.mime, anexo.nome)
    }
  }

  const aceitas = await enviarPush(config, registros)
  const aceitasPorChave = new Set(aceitas.map((a) => `${a.tipo}:${a.id}`))

  for (const p of pendentes) {
    const registro = JSON.parse(p.valor) as RegistroSync
    if (aceitasPorChave.has(`${registro.tipo}:${registro.id}`)) {
      await apagarSincronizacao(p.chave)
    }
  }

  return registros.length
}

async function baixarRemoto(
  config: ConfiguracaoSync,
): Promise<{ recebidas: number; blobsBaixados: number }> {
  let cursor = await lerCursor()
  let recebidas = 0
  let blobsBaixados = 0

  for (;;) {
    const mudancas = await enviarPull(config, cursor)
    if (mudancas.length === 0) {
      break
    }
    await aplicarRegistros(mudancas)
    blobsBaixados += (await processarBlobsPendentes(config)).baixados
    recebidas += mudancas.length

    const ultimo = mudancas[mudancas.length - 1].revisao
    if (cursor !== null && compararRevisoes(ultimo, cursor) <= 0) {
      break
    }
    cursor = ultimo
    if (mudancas.length < TAMANHO_LOTE) {
      break
    }
  }

  if (cursor !== null) {
    await gravarSincronizacao(CHAVES_SINCRONIZACAO.cursor, JSON.stringify(cursor))
  }
  return { recebidas, blobsBaixados }
}

export async function sincronizar(): Promise<ResultadoSincronizacao> {
  const config = await lerConfiguracaoSync()
  if (config === null) {
    throw erroSincronizacao(
      ERROR_CODES.SINCRONIZACAO.NAO_CONFIGURADO,
      'Configure a URL e o segredo do servidor de sincronização antes de sincronizar.',
    )
  }

  const enviadas = await enviarPendentes(config)
  const { recebidas, blobsBaixados } = await baixarRemoto(config)
  await gravarSincronizacao(CHAVES_SINCRONIZACAO.ultimaSincronizacao, new Date().toISOString())
  return { enviadas, recebidas, blobsBaixados }
}

export async function obterEstadoSincronizacao(): Promise<EstadoSincronizacao> {
  const [config, ultima, pendentes, blobsPendentes] = await Promise.all([
    lerConfiguracaoSync(),
    lerSincronizacao(CHAVES_SINCRONIZACAO.ultimaSincronizacao),
    contarPorPrefixo(CHAVES_SINCRONIZACAO.prefixoPendente),
    contarPorPrefixo(CHAVES_SINCRONIZACAO.prefixoBlobPendente),
  ])
  return {
    configurada: config !== null,
    url: config?.urlBase ?? '',
    ultimaSincronizacao: ultima ?? null,
    pendentes,
    blobsPendentes,
  }
}