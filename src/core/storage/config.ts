export const BANCO = {
  nome: 'thothnet',
  versao: 4,
  stores: {
    meta: 'meta',
    notas: 'notas',
    cadernos: 'cadernos',
    tags: 'tags',
    anexos: 'anexos',
    sincronizacao: 'sincronizacao',
  } as const,
} as const

export type StoreName = (typeof BANCO.stores)[keyof typeof BANCO.stores]