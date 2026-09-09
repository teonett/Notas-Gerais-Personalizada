import type { Anexo, Caderno, Nota, Tag } from '../domain'
import type { RegistroSync, Revisao, TipoRegistro } from './contrato'

export type DadosSyncNota = Nota
export type DadosSyncCaderno = Caderno
export type DadosSyncTag = Tag
export type DadosSyncAnexo = Omit<Anexo, 'dados'>

export function dadosDeNota(nota: Nota): DadosSyncNota {
  return nota
}

export function dadosDeCaderno(caderno: Caderno): DadosSyncCaderno {
  return caderno
}

export function dadosDeTag(tag: Tag): DadosSyncTag {
  return tag
}

export function dadosDeAnexo(anexo: Anexo): DadosSyncAnexo {
  const { dados, ...metadados } = anexo
  void dados
  return metadados
}

export function registroSincronizavel(
  tipo: TipoRegistro,
  id: string,
  revisao: Revisao,
  apagado: boolean,
  dados: unknown,
): RegistroSync {
  return { tipo, id, revisao, apagado, dados }
}