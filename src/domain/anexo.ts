export const PREFIXO_ANEXO = 'keep://anexos/'

export interface Anexo {
  id: string
  notaId: string | null
  nome: string
  mime: string
  tamanho: number
  dados: Blob
  criadaEm: string
}

export type NovoAnexo = Pick<Anexo, 'notaId' | 'nome' | 'mime' | 'dados'>

export function urlDeAnexo(id: string): string {
  return `${PREFIXO_ANEXO}${id}`
}

export function idDeUrlDeAnexo(url: string): string | null {
  if (!url.startsWith(PREFIXO_ANEXO)) {
    return null
  }
  const id = url.slice(PREFIXO_ANEXO.length)
  return id === '' ? null : id
}