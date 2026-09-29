export const BANCO = {
  nome: 'thothnet',
  versao: 5,
  stores: {
    meta: 'meta',
    notas: 'notas',
    cadernos: 'cadernos',
    tags: 'tags',
    anexos: 'anexos',
    sincronizacao: 'sincronizacao',
    usuarios: 'usuarios',
    grupos: 'grupos',
    membrosGrupos: 'membrosGrupos',
    permissoesNota: 'permissoesNota',
    sugestoesNota: 'sugestoesNota',
  } as const,
} as const

export type StoreName = (typeof BANCO.stores)[keyof typeof BANCO.stores]
