import type { Anexo, Caderno, Nota, Tag } from '../domain'
import type { RegistroSync, Revisao, TipoRegistro } from './contrato'
import { CHAVES_SINCRONIZACAO, novaRevisao } from './contrato'
import { apagarSincronizacao, gravarSincronizacao, lerSincronizacao } from './armazenamento'
import { obterDispositivo } from './dispositivo'
import { dadosDeAnexo, dadosDeCaderno, dadosDeNota, dadosDeTag } from './registros'

async function registrarMudanca(
  tipo: TipoRegistro,
  id: string,
  apagado: boolean,
  dados: unknown,
): Promise<void> {
  const dispositivo = await obterDispositivo()
  const revisao = novaRevisao(dispositivo)
  const registro: RegistroSync = { tipo, id, revisao, apagado, dados }
  await gravarSincronizacao(
    `${CHAVES_SINCRONIZACAO.prefixoPendente}${tipo}:${id}`,
    JSON.stringify(registro),
  )
  await gravarSincronizacao(
    `${CHAVES_SINCRONIZACAO.prefixoRegistro}${tipo}:${id}`,
    JSON.stringify(revisao),
  )
}

export async function registrarNota(nota: Nota): Promise<void> {
  await registrarMudanca('nota', nota.id, false, dadosDeNota(nota))
}

export async function registrarCaderno(caderno: Caderno): Promise<void> {
  await registrarMudanca('caderno', caderno.id, false, dadosDeCaderno(caderno))
}

export async function registrarTag(tag: Tag): Promise<void> {
  await registrarMudanca('tag', tag.id, false, dadosDeTag(tag))
}

export async function registrarAnexo(anexo: Anexo): Promise<void> {
  await registrarMudanca('anexo', anexo.id, false, dadosDeAnexo(anexo))
}

export async function registrarRemocao(tipo: TipoRegistro, id: string): Promise<void> {
  await registrarMudanca(tipo, id, true, null)
}

export async function marcarSincronizado(registro: RegistroSync): Promise<void> {
  await gravarSincronizacao(
    `${CHAVES_SINCRONIZACAO.prefixoRegistro}${registro.tipo}:${registro.id}`,
    JSON.stringify(registro.revisao),
  )
}

export async function removerPendente(tipo: TipoRegistro, id: string): Promise<void> {
  await apagarSincronizacao(`${CHAVES_SINCRONIZACAO.prefixoPendente}${tipo}:${id}`)
}

export async function lerRevisaoLocal(tipo: TipoRegistro, id: string): Promise<Revisao | null> {
  const valor = await lerSincronizacao(
    `${CHAVES_SINCRONIZACAO.prefixoRegistro}${tipo}:${id}`,
  )
  if (valor === undefined) {
    return null
  }
  return JSON.parse(valor) as Revisao
}