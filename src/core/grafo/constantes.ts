export const PADRAO_LINK_SOURCE = '\\[\\[([^|\\[\\]\\n]{1,200})\\]\\]'

export function criarPadraoLink(): RegExp {
  return new RegExp(PADRAO_LINK_SOURCE, 'g')
}