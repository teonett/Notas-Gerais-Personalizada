import { FORMATO_NOTA, STATUS_NOTA, type Anexo, type Caderno, type Nota, type Tag } from '../../domain'
import { CHAVES_SINCRONIZACAO } from '../../sync/contrato'
import { anexosStore, cadernosStore, notasStore, tagsStore } from '../repositorios'
import {
  gravarItensEmTransacao,
  lerItem,
  listarEntradas,
} from '../storage'
import type { EntradaArmazenada, OperacaoGravacao } from '../storage'

export const NOME_MANIFESTO_BACKUP_FIEL = 'thothnet-backup-fiel.json'
export const PREFIXO_ARQUIVO_ANEXO_FIEL = 'thothnet-anexo-'

const TIPO_MANIFESTO = 'THOTHNET_BACKUP_FIEL'
const VERSAO_MANIFESTO = 1
const CARACTERES_RESERVADOS_WINDOWS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*'])

export interface AnexoManifestoFiel extends Omit<Anexo, 'dados'> {
  arquivo: string
}

export interface ManifestoBackupFiel {
  tipo: typeof TIPO_MANIFESTO
  versao: typeof VERSAO_MANIFESTO
  geradoEm: string
  registros: {
    notas: Nota[]
    cadernos: Caderno[]
    tags: Tag[]
    anexos: AnexoManifestoFiel[]
    meta: EntradaArmazenada<string>[]
    sincronizacao: EntradaArmazenada<string>[]
  }
}

export interface ArquivoAnexoFiel {
  nome: string
  dados: Blob
}

export interface BackupFielExportado {
  manifesto: ManifestoBackupFiel
  anexos: ArquivoAnexoFiel[]
}

export interface OpcoesImportacaoBackupFiel {
  restaurarSync: boolean
}

export interface ResumoBackupFiel {
  notasCriadas: number
  cadernosCriados: number
  tagsCriadas: number
  anexosCriados: number
  metaCriadas: number
  syncCriadas: number
  duplicadosIgnorados: number
  anexosAusentes: number
}

interface PlanoImportacaoBackupFiel {
  resumo: ResumoBackupFiel
  cadernos: Caderno[]
  tags: Tag[]
  notas: Nota[]
  anexos: Anexo[]
  meta: EntradaArmazenada<string>[]
  sincronizacao: EntradaArmazenada<string>[]
}

function nomeSeguro(nome: string): string {
  const limpo = Array.from(nome, (caractere) => {
    if (CARACTERES_RESERVADOS_WINDOWS.has(caractere) || caractere.charCodeAt(0) < 32) {
      return '-'
    }
    return caractere
  }).join('').trim()
  return limpo === '' ? 'arquivo' : limpo
}

function nomeArquivoAnexo(anexo: Anexo): string {
  return `${PREFIXO_ARQUIVO_ANEXO_FIEL}${anexo.id}-${nomeSeguro(anexo.nome)}`
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function ehStringNaoVazia(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== ''
}

function ehStringOuNulo(valor: unknown): valor is string | null {
  return typeof valor === 'string' || valor === null
}

function idsSaoUnicos(itens: Array<{ id: string }>): boolean {
  return new Set(itens.map((item) => item.id)).size === itens.length
}

function chavesSaoUnicas(itens: Array<{ chave: string }>): boolean {
  return new Set(itens.map((item) => item.chave)).size === itens.length
}

function cadernoEhValido(valor: unknown): valor is Caderno {
  if (!ehObjeto(valor)) {
    return false
  }
  return (
    ehStringNaoVazia(valor.id) &&
    ehStringNaoVazia(valor.nome) &&
    ehStringOuNulo(valor.paiId) &&
    ehStringNaoVazia(valor.criadaEm)
  )
}

function tagEhValida(valor: unknown): valor is Tag {
  if (!ehObjeto(valor)) {
    return false
  }
  return (
    ehStringNaoVazia(valor.id) &&
    ehStringNaoVazia(valor.nome) &&
    ehStringNaoVazia(valor.criadaEm)
  )
}

function notaEhValida(valor: unknown): valor is Nota {
  if (!ehObjeto(valor)) {
    return false
  }
  return (
    ehStringNaoVazia(valor.id) &&
    typeof valor.titulo === 'string' &&
    typeof valor.conteudo === 'string' &&
    (valor.formato === FORMATO_NOTA.MARKDOWN ||
      valor.formato === FORMATO_NOTA.TXT ||
      valor.formato === FORMATO_NOTA.HTML) &&
    (valor.status === STATUS_NOTA.ATIVA ||
      valor.status === STATUS_NOTA.ARQUIVADA ||
      valor.status === STATUS_NOTA.LIXEIRA) &&
    typeof valor.favorita === 'boolean' &&
    typeof valor.fixada === 'boolean' &&
    ehStringOuNulo(valor.cadernoId) &&
    Array.isArray(valor.tagIds) &&
    valor.tagIds.every((tagId) => ehStringNaoVazia(tagId)) &&
    ehStringNaoVazia(valor.criadaEm) &&
    ehStringNaoVazia(valor.alteradaEm) &&
    ehStringOuNulo(valor.excluidaEm)
  )
}

function anexoEhValido(valor: unknown): valor is AnexoManifestoFiel {
  if (!ehObjeto(valor)) {
    return false
  }
  return (
    ehStringNaoVazia(valor.id) &&
    ehStringOuNulo(valor.notaId) &&
    ehStringNaoVazia(valor.nome) &&
    ehStringNaoVazia(valor.mime) &&
    typeof valor.tamanho === 'number' &&
    Number.isFinite(valor.tamanho) &&
    valor.tamanho >= 0 &&
    ehStringNaoVazia(valor.criadaEm) &&
    ehStringNaoVazia(valor.arquivo)
  )
}

function entradaEhValida(valor: unknown): valor is EntradaArmazenada<string> {
  if (!ehObjeto(valor)) {
    return false
  }
  return ehStringNaoVazia(valor.chave) && typeof valor.valor === 'string'
}

function referenciasSaoValidas(registros: ManifestoBackupFiel['registros']): boolean {
  const idsCadernos = new Set(registros.cadernos.map((caderno) => caderno.id))
  const idsTags = new Set(registros.tags.map((tag) => tag.id))
  const idsNotas = new Set(registros.notas.map((nota) => nota.id))

  const cadernosValidos = registros.cadernos.every(
    (caderno) => caderno.paiId === null || idsCadernos.has(caderno.paiId),
  )
  const notasValidas = registros.notas.every(
    (nota) =>
      (nota.cadernoId === null || idsCadernos.has(nota.cadernoId)) &&
      nota.tagIds.every((tagId) => idsTags.has(tagId)),
  )
  const anexosValidos = registros.anexos.every(
    (anexo) => anexo.notaId === null || idsNotas.has(anexo.notaId),
  )

  return cadernosValidos && notasValidas && anexosValidos
}

function entradaSincronizacaoEhRestauravel(entrada: EntradaArmazenada<string>): boolean {
  return entrada.chave.startsWith(CHAVES_SINCRONIZACAO.prefixoRegistro)
}

function manifestoEhValido(valor: unknown): valor is ManifestoBackupFiel {
  if (!ehObjeto(valor)) {
    return false
  }
  const manifesto = valor
  const registros = manifesto.registros
  if (
    manifesto.tipo !== TIPO_MANIFESTO ||
    manifesto.versao !== VERSAO_MANIFESTO ||
    !ehStringNaoVazia(manifesto.geradoEm) ||
    !ehObjeto(registros)
  ) {
    return false
  }
  const registrosTipados = registros as Record<string, unknown>
  if (
    !Array.isArray(registrosTipados.notas) ||
    !Array.isArray(registrosTipados.cadernos) ||
    !Array.isArray(registrosTipados.tags) ||
    !Array.isArray(registrosTipados.anexos) ||
    !Array.isArray(registrosTipados.meta) ||
    !Array.isArray(registrosTipados.sincronizacao)
  ) {
    return false
  }
  if (
    !registrosTipados.notas.every(notaEhValida) ||
    !registrosTipados.cadernos.every(cadernoEhValido) ||
    !registrosTipados.tags.every(tagEhValida) ||
    !registrosTipados.anexos.every(anexoEhValido) ||
    !registrosTipados.meta.every(entradaEhValida) ||
    !registrosTipados.sincronizacao.every(entradaEhValida)
  ) {
    return false
  }
  const manifestoValido = {
    ...manifesto,
    registros: registrosTipados,
  } as ManifestoBackupFiel
  return (
    idsSaoUnicos(manifestoValido.registros.notas) &&
    idsSaoUnicos(manifestoValido.registros.cadernos) &&
    idsSaoUnicos(manifestoValido.registros.tags) &&
    idsSaoUnicos(manifestoValido.registros.anexos) &&
    chavesSaoUnicas(manifestoValido.registros.meta) &&
    chavesSaoUnicas(manifestoValido.registros.sincronizacao) &&
    referenciasSaoValidas(manifestoValido.registros)
  )
}

async function primeiroManifesto(arquivos: File[]): Promise<ManifestoBackupFiel | null> {
  for (const arquivo of arquivos) {
    if (arquivo.name !== NOME_MANIFESTO_BACKUP_FIEL && !arquivo.name.endsWith('.json')) {
      continue
    }
    try {
      const dados = JSON.parse(await arquivo.text()) as unknown
      if (manifestoEhValido(dados)) {
        return dados
      }
    } catch {
      // Continua procurando um manifesto valido entre os arquivos selecionados.
    }
  }
  return null
}

function arquivoPorNome(arquivos: File[]): Map<string, File> {
  const mapa = new Map<string, File>()
  for (const arquivo of arquivos) {
    mapa.set(arquivo.name, arquivo)
    const caminho = (arquivo as File & { webkitRelativePath?: string }).webkitRelativePath
    if (typeof caminho === 'string' && caminho !== '') {
      mapa.set(caminho, arquivo)
    }
  }
  return mapa
}

function resumoVazio(): ResumoBackupFiel {
  return {
    notasCriadas: 0,
    cadernosCriados: 0,
    tagsCriadas: 0,
    anexosCriados: 0,
    metaCriadas: 0,
    syncCriadas: 0,
    duplicadosIgnorados: 0,
    anexosAusentes: 0,
  }
}

async function planejarImportacaoBackupFiel(
  manifesto: ManifestoBackupFiel,
  arquivos: File[],
  opcoes: OpcoesImportacaoBackupFiel,
): Promise<PlanoImportacaoBackupFiel> {
  const resumo = resumoVazio()
  const plano: PlanoImportacaoBackupFiel = {
    resumo,
    cadernos: [],
    tags: [],
    notas: [],
    anexos: [],
    meta: [],
    sincronizacao: [],
  }

  for (const caderno of manifesto.registros.cadernos) {
    if ((await lerItem<Caderno>('cadernos', caderno.id)) !== undefined) {
      resumo.duplicadosIgnorados += 1
    } else {
      plano.cadernos.push(caderno)
      resumo.cadernosCriados += 1
    }
  }

  for (const tag of manifesto.registros.tags) {
    if ((await lerItem<Tag>('tags', tag.id)) !== undefined) {
      resumo.duplicadosIgnorados += 1
    } else {
      plano.tags.push(tag)
      resumo.tagsCriadas += 1
    }
  }

  for (const nota of manifesto.registros.notas) {
    if ((await lerItem<Nota>('notas', nota.id)) !== undefined) {
      resumo.duplicadosIgnorados += 1
    } else {
      plano.notas.push(nota)
      resumo.notasCriadas += 1
    }
  }

  const anexosPorArquivo = arquivoPorNome(arquivos)
  for (const anexo of manifesto.registros.anexos) {
    if (await lerItem<Anexo>('anexos', anexo.id)) {
      resumo.duplicadosIgnorados += 1
      continue
    }
    const arquivo = anexosPorArquivo.get(anexo.arquivo)
    if (arquivo === undefined) {
      resumo.anexosAusentes += 1
      continue
    }
    const { arquivo: _arquivo, ...metadados } = anexo
    void _arquivo
    plano.anexos.push({ ...metadados, dados: arquivo })
    resumo.anexosCriados += 1
  }

  for (const entrada of manifesto.registros.meta) {
    if ((await lerItem<string>('meta', entrada.chave)) !== undefined) {
      resumo.duplicadosIgnorados += 1
    } else {
      plano.meta.push(entrada)
      resumo.metaCriadas += 1
    }
  }

  if (opcoes.restaurarSync) {
    for (const entrada of manifesto.registros.sincronizacao.filter(entradaSincronizacaoEhRestauravel)) {
      if ((await lerItem<string>('sincronizacao', entrada.chave)) !== undefined) {
        resumo.duplicadosIgnorados += 1
      } else {
        plano.sincronizacao.push(entrada)
        resumo.syncCriadas += 1
      }
    }
  }

  return plano
}

async function aplicarPlanoImportacaoBackupFiel(plano: PlanoImportacaoBackupFiel): Promise<void> {
  const operacoes: OperacaoGravacao[] = [
    ...plano.cadernos.map((valor) => ({ loja: 'cadernos' as const, valor })),
    ...plano.tags.map((valor) => ({ loja: 'tags' as const, valor })),
    ...plano.notas.map((valor) => ({ loja: 'notas' as const, valor })),
    ...plano.anexos.map((valor) => ({ loja: 'anexos' as const, valor })),
    ...plano.meta.map((entrada) => ({
      loja: 'meta' as const,
      chave: entrada.chave,
      valor: entrada.valor,
    })),
    ...plano.sincronizacao.map((entrada) => ({
      loja: 'sincronizacao' as const,
      chave: entrada.chave,
      valor: entrada.valor,
    })),
  ]

  await gravarItensEmTransacao(operacoes)
}

export async function exportarBackupFiel(): Promise<BackupFielExportado> {
  const [notas, cadernos, tags, anexos, meta, sincronizacao] = await Promise.all([
    notasStore.listarTodas(),
    cadernosStore.listarTodas(),
    tagsStore.listarTodas(),
    anexosStore.listarTodas(),
    listarEntradas<string>('meta'),
    listarEntradas<string>('sincronizacao'),
  ])

  const anexosManifesto = anexos.map(({ dados, ...anexo }) => {
    void dados
    return { ...anexo, arquivo: nomeArquivoAnexo({ ...anexo, dados }) }
  })

  return {
    manifesto: {
      tipo: TIPO_MANIFESTO,
      versao: VERSAO_MANIFESTO,
      geradoEm: new Date().toISOString(),
      registros: {
        notas,
        cadernos,
        tags,
        anexos: anexosManifesto,
        meta,
        sincronizacao,
      },
    },
    anexos: anexos.map((anexo) => ({
      nome: nomeArquivoAnexo(anexo),
      dados: anexo.dados,
    })),
  }
}

export async function importarBackupFiel(
  arquivos: FileList | File[],
  opcoes: OpcoesImportacaoBackupFiel,
): Promise<ResumoBackupFiel | null> {
  const todosArquivos = Array.from(arquivos)
  const manifesto = await primeiroManifesto(todosArquivos)
  if (manifesto === null) {
    return null
  }

  const plano = await planejarImportacaoBackupFiel(manifesto, todosArquivos, opcoes)
  if (plano.resumo.anexosAusentes > 0) {
    return {
      ...resumoVazio(),
      duplicadosIgnorados: plano.resumo.duplicadosIgnorados,
      anexosAusentes: plano.resumo.anexosAusentes,
    }
  }

  await aplicarPlanoImportacaoBackupFiel(plano)
  return plano.resumo
}
