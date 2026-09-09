import { abrirBancoDeDados } from '../core/storage/idb'
import type { StoreName } from '../core/storage/config'
import { comTransacao } from '../core/repositorios/base'
import { anexosStore } from '../core/repositorios/anexos'
import type { RegistroSync } from './contrato'
import { CHAVES_SINCRONIZACAO } from './contrato'
import { gravarSincronizacao } from './armazenamento'
import { lerRevisaoLocal, marcarSincronizado } from './mudancas'
import { compararRevisoes } from './contrato'

const NOMES_STORES: Record<RegistroSync['tipo'], StoreName> = {
  nota: 'notas',
  caderno: 'cadernos',
  tag: 'tags',
  anexo: 'anexos',
}

async function escreverDados(tipo: RegistroSync['tipo'], dados: unknown): Promise<void> {
  const banco = await abrirBancoDeDados()
  const storeNome = NOMES_STORES[tipo]
  await comTransacao(banco, [storeNome], 'readwrite', async (transacao) => {
    transacao.objectStore(storeNome).put(dados)
  })
}

async function apagarDados(tipo: RegistroSync['tipo'], id: string): Promise<void> {
  const banco = await abrirBancoDeDados()
  const storeNome = NOMES_STORES[tipo]
  await comTransacao(banco, [storeNome], 'readwrite', async (transacao) => {
    transacao.objectStore(storeNome).delete(id)
  })
}

async function aplicarUm(registro: RegistroSync): Promise<void> {
  if (registro.apagado) {
    await apagarDados(registro.tipo, registro.id)
    if (registro.tipo === 'nota') {
      await anexosStore.removerPorNota(registro.id)
    }
    return
  }

  if (registro.tipo === 'anexo') {
    const existente = await anexosStore.obter(registro.id)
    if (existente === undefined) {
      await gravarSincronizacao(
        `${CHAVES_SINCRONIZACAO.prefixoBlobPendente}${registro.id}`,
        JSON.stringify(registro),
      )
    }
    return
  }

  if (registro.dados === null || typeof registro.dados !== 'object') {
    return
  }
  await escreverDados(registro.tipo, registro.dados)
}

export async function aplicarRegistros(registros: RegistroSync[]): Promise<void> {
  for (const registro of registros) {
    const local = await lerRevisaoLocal(registro.tipo, registro.id)
    if (local !== null && compararRevisoes(registro.revisao, local) <= 0) {
      continue
    }
    await aplicarUm(registro)
    await marcarSincronizado(registro)
  }
}