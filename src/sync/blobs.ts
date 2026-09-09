import type { Anexo } from '../domain'
import { BANCO } from '../core/storage/config'
import { gravarItem } from '../core/storage/idb'
import { obterChaveDaSessao } from '../core/auth/sessao'
import { decifrarBytes, ehEnvelope } from '../core/vault/cifrar'
import type { RegistroSync } from './contrato'
import { CHAVES_SINCRONIZACAO } from './contrato'
import { apagarSincronizacao, listarPorPrefixo } from './armazenamento'
import { marcarSincronizado } from './mudancas'
import type { ConfiguracaoSync } from './config'
import { baixarBlobAnexo } from './endpoints'
import type { DadosSyncAnexo } from './registros'

export interface ResultadoBlobs {
  baixados: number
}

async function gravarAnexoSincronizado(anexo: Anexo): Promise<void> {
  await gravarItem(BANCO.stores.anexos, anexo)
}

export async function processarBlobsPendentes(
  config: ConfiguracaoSync,
): Promise<ResultadoBlobs> {
  const pendentes = await listarPorPrefixo(CHAVES_SINCRONIZACAO.prefixoBlobPendente)
  let baixados = 0

  for (const { chave, valor } of pendentes) {
    const registro = JSON.parse(valor) as RegistroSync
    try {
      const metadados = (registro.dados ?? {}) as DadosSyncAnexo
      const mime =
        metadados.mime !== undefined
          ? String(metadados.mime)
          : 'application/octet-stream'
      const baixado = await baixarBlobAnexo(config, registro.id)
      const dados = await recuperarBytesBaixados(await baixado.arrayBuffer())
      const anexo: Anexo = {
        id: registro.id,
        notaId: metadados.notaId ?? null,
        nome: metadados.nome !== undefined ? String(metadados.nome) : registro.id,
        mime,
        tamanho: dados.byteLength,
        criadaEm:
          typeof metadados.criadaEm === 'string'
            ? metadados.criadaEm
            : new Date().toISOString(),
        dados: new Blob([dados], { type: mime }),
      }
      await gravarAnexoSincronizado(anexo)
      await marcarSincronizado(registro)
      await apagarSincronizacao(chave)
      baixados += 1
    } catch {
      // mantém pendente para a próxima sincronização
    }
  }

  return { baixados }
}

async function recuperarBytesBaixados(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  const chave = obterChaveDaSessao()
  if (chave === null) {
    return bytes
  }
  const bruto = JSON.parse(new TextDecoder().decode(bytes)) as unknown
  if (!ehEnvelope(bruto)) {
    return bytes
  }
  const dados = await decifrarBytes(chave, bruto)
  const copia = new Uint8Array(dados.byteLength)
  copia.set(dados)
  return copia.buffer
}