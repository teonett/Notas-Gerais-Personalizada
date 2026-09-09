import type { Anexo } from '../domain'
import { BANCO } from '../core/storage/config'
import { abrirBancoDeDados } from '../core/storage/idb'
import { comTransacao } from '../core/repositorios/base'
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
  const banco = await abrirBancoDeDados()
  await comTransacao(banco, [BANCO.stores.anexos], 'readwrite', async (transacao) => {
    transacao.objectStore(BANCO.stores.anexos).put(anexo)
  })
}

export async function processarBlobsPendentes(
  config: ConfiguracaoSync,
): Promise<ResultadoBlobs> {
  const pendentes = await listarPorPrefixo(CHAVES_SINCRONIZACAO.prefixoBlobPendente)
  let baixados = 0

  for (const { chave, valor } of pendentes) {
    const registro = JSON.parse(valor) as RegistroSync
    try {
      const blob = await baixarBlobAnexo(config, registro.id)
      const metadados = (registro.dados ?? {}) as DadosSyncAnexo
      const anexo: Anexo = {
        id: registro.id,
        notaId: metadados.notaId ?? null,
        nome: metadados.nome !== undefined ? String(metadados.nome) : registro.id,
        mime:
          metadados.mime !== undefined
            ? String(metadados.mime)
            : 'application/octet-stream',
        tamanho: blob.size,
        criadaEm:
          typeof metadados.criadaEm === 'string'
            ? metadados.criadaEm
            : new Date().toISOString(),
        dados: blob,
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