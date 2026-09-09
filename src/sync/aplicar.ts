import type { StoreName } from '../core/storage/config'
import { apagarItem, gravarItem } from '../core/storage/idb'
import { anexosStore } from '../core/repositorios/anexos'
import { obterChaveDaSessao } from '../core/auth/sessao'
import { decifrarRegistro, ehEnvelope } from '../core/vault/cifrar'
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

async function recuperarDadosDoServidor(dados: unknown): Promise<unknown> {
  const chave = obterChaveDaSessao()
  if (chave !== null && ehEnvelope(dados)) {
    return decifrarRegistro(chave, dados)
  }
  return dados
}

async function escreverDados(tipo: RegistroSync['tipo'], dados: unknown): Promise<void> {
  if ((dados as { id?: string }).id === undefined) {
    return
  }
  await gravarItem(NOMES_STORES[tipo], dados)
}

async function apagarDados(tipo: RegistroSync['tipo'], id: string): Promise<void> {
  await apagarItem(NOMES_STORES[tipo], id)
}

async function aplicarUm(registro: RegistroSync): Promise<void> {
  const dados = await recuperarDadosDoServidor(registro.dados)

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
      const pendente: RegistroSync = { ...registro, dados }
      await gravarSincronizacao(
        `${CHAVES_SINCRONIZACAO.prefixoBlobPendente}${registro.id}`,
        JSON.stringify(pendente),
      )
    }
    return
  }

  if (dados === null || typeof dados !== 'object') {
    return
  }
  await escreverDados(registro.tipo, dados)
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