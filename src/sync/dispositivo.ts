import { gerarId } from '../domain'
import { lerSincronizacao, gravarSincronizacao } from './armazenamento'
import { CHAVES_SINCRONIZACAO } from './contrato'

let cache: string | null = null

export async function obterDispositivo(): Promise<string> {
  if (cache !== null) {
    return cache
  }
  const existente = await lerSincronizacao(CHAVES_SINCRONIZACAO.dispositivo)
  if (existente !== undefined && existente !== '') {
    cache = existente
    return existente
  }
  const novo = gerarId()
  await gravarSincronizacao(CHAVES_SINCRONIZACAO.dispositivo, novo)
  cache = novo
  return novo
}