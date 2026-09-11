import type { Caderno, FormatoNota, Nota, StatusNota, Tag } from '../../domain'
import { cadernosStore, notasStore, tagsStore } from '../repositorios'

export const ESCOPOS_EXPORTACAO_JSON = ['CADERNOS', 'NOTAS', 'TUDO'] as const
export type EscopoExportacaoJson = (typeof ESCOPOS_EXPORTACAO_JSON)[number]

export interface CadernoEmArquivo {
  nome: string
  pai: string | null
}

export interface NotaEmArquivo {
  titulo: string
  conteudo: string
  formato: FormatoNota
  status: StatusNota
  favorita: boolean
  fixada: boolean
  caderno: string | null
  tags: string[]
}

export interface ConteudoJson {
  versao: 1
  cadernos: CadernoEmArquivo[]
  tags: string[]
  notas: NotaEmArquivo[]
}

export interface ResumoImportacao {
  cadernosCriados: number
  tagsCriadas: number
  notasCriadas: number
}

function ehFormatoNota(valor: unknown): valor is FormatoNota {
  return valor === 'MARKDOWN' || valor === 'TXT' || valor === 'HTML'
}

function ehStatusNota(valor: unknown): valor is StatusNota {
  return valor === 'ATIVA' || valor === 'ARQUIVADA' || valor === 'LIXEIRA'
}

function notaEmArquivo(
  nota: Nota,
  nomeDoCaderno: Map<string, string>,
  nomeDaTag: Map<string, string>,
): NotaEmArquivo {
  return {
    titulo: nota.titulo,
    conteudo: nota.conteudo,
    formato: nota.formato,
    status: nota.status,
    favorita: nota.favorita,
    fixada: nota.fixada,
    caderno: nota.cadernoId === null ? null : nomeDoCaderno.get(nota.cadernoId) ?? null,
    tags: nota.tagIds
      .map((id) => nomeDaTag.get(id))
      .filter((nome): nome is string => nome !== undefined),
  }
}

function ordenarCadernos(cadernos: Caderno[]): Caderno[] {
  const ids = new Set(cadernos.map((c) => c.id))
  const ordenados: Caderno[] = []
  let pendentes = [...cadernos]
  while (pendentes.length > 0) {
    const restantes: Caderno[] = []
    for (const caderno of pendentes) {
      const paiConfirmado =
        caderno.paiId === null || !ids.has(caderno.paiId)
          ? true
          : ordenados.some((o) => o.id === caderno.paiId)
      if (paiConfirmado) {
        ordenados.push(caderno)
      } else {
        restantes.push(caderno)
      }
    }
    if (restantes.length === pendentes.length) {
      ordenados.push(...restantes)
      break
    }
    pendentes = restantes
  }
  return ordenados
}

export function montarJson(
  cadernos: Caderno[],
  tags: Tag[],
  notas: Nota[],
  escopo: EscopoExportacaoJson,
): string {
  const base = { versao: 1 as const }
  const nomeDoCaderno = new Map(cadernos.map((c) => [c.id, c.nome]))
  const paiNome = (c: Caderno): string | null =>
    c.paiId === null ? null : nomeDoCaderno.get(c.paiId) ?? null
  if (escopo === 'CADERNOS') {
    return JSON.stringify({
      ...base,
      cadernos: ordenarCadernos(cadernos).map((c) => ({ nome: c.nome, pai: paiNome(c) })),
    })
  }
  if (escopo === 'NOTAS') {
    return JSON.stringify({
      ...base,
      notas: notas.map((n) => notaEmArquivo(n, new Map(), new Map())),
    })
  }
  const nomeDaTag = new Map(tags.map((t) => [t.id, t.nome]))
  return JSON.stringify({
    ...base,
    cadernos: ordenarCadernos(cadernos).map((c) => ({ nome: c.nome, pai: paiNome(c) })),
    tags: tags.map((t) => t.nome),
    notas: notas.map((n) => notaEmArquivo(n, nomeDoCaderno, nomeDaTag)),
  })
}

export function parseJsonIntercambio(texto: string): ConteudoJson | null {
  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch {
    return null
  }
  if (typeof bruto !== 'object' || bruto === null) {
    return null
  }
  const dados = bruto as Record<string, unknown>
  if (dados.versao !== 1) {
    return null
  }
  const cadernos: CadernoEmArquivo[] = []
  if (Array.isArray(dados.cadernos)) {
    for (const item of dados.cadernos) {
      if (typeof item !== 'object' || item === null) {
        return null
      }
      const caderno = item as Record<string, unknown>
      if (typeof caderno.nome !== 'string') {
        return null
      }
      cadernos.push({
        nome: caderno.nome,
        pai: typeof caderno.pai === 'string' ? caderno.pai : null,
      })
    }
  }
  const tags = Array.isArray(dados.tags) ? dados.tags.filter((t): t is string => typeof t === 'string') : []
  const notas: NotaEmArquivo[] = []
  if (Array.isArray(dados.notas)) {
    for (const item of dados.notas) {
      if (typeof item !== 'object' || item === null) {
        return null
      }
      const nota = item as Record<string, unknown>
      if (typeof nota.titulo !== 'string' || typeof nota.conteudo !== 'string') {
        return null
      }
      if (!ehFormatoNota(nota.formato) || !ehStatusNota(nota.status)) {
        return null
      }
      notas.push({
        titulo: nota.titulo,
        conteudo: nota.conteudo,
        formato: nota.formato,
        status: nota.status,
        favorita: nota.favorita === true,
        fixada: nota.fixada === true,
        caderno: typeof nota.caderno === 'string' ? nota.caderno : null,
        tags: Array.isArray(nota.tags)
          ? nota.tags.filter((t): t is string => typeof t === 'string')
          : [],
      })
    }
  }
  return { versao: 1, cadernos, tags, notas }
}

export async function importarDadosJson(dados: ConteudoJson): Promise<ResumoImportacao> {
  const [cadernosExistentes, tagsExistentes] = await Promise.all([
    cadernosStore.listarTodas(),
    tagsStore.listarTodas(),
  ])
  const chaveDeNome = (nome: string) => nome.trim().toLowerCase()
  const idDoCaderno = new Map(cadernosExistentes.map((c) => [chaveDeNome(c.nome), c.id]))
  const idDaTag = new Map(tagsExistentes.map((t) => [chaveDeNome(t.nome), t.id]))

  let cadernosCriados = 0
  let tagsCriadas = 0
  let notasCriadas = 0

  for (const cadernoDeArquivo of dados.cadernos) {
    const nome = cadernoDeArquivo.nome.trim()
    if (nome === '' || idDoCaderno.has(chaveDeNome(nome))) {
      continue
    }
    const paiId =
      cadernoDeArquivo.pai === null ? null : idDoCaderno.get(chaveDeNome(cadernoDeArquivo.pai)) ?? null
    const novo = await cadernosStore.criar(nome, paiId)
    idDoCaderno.set(chaveDeNome(nome), novo.id)
    cadernosCriados += 1
  }

  for (const nomeDeTag of dados.tags) {
    const nome = nomeDeTag.trim()
    if (nome === '' || idDaTag.has(chaveDeNome(nome))) {
      continue
    }
    const nova = await tagsStore.criar(nome)
    idDaTag.set(chaveDeNome(nome), nova.id)
    tagsCriadas += 1
  }

  for (const notaDeArquivo of dados.notas) {
    const titulo = notaDeArquivo.titulo.trim()
    if (titulo === '') {
      continue
    }
    const cadernoId =
      notaDeArquivo.caderno === null
        ? null
        : idDoCaderno.get(chaveDeNome(notaDeArquivo.caderno)) ?? null
    const tagIds: string[] = []
    for (const nomeDeTag of notaDeArquivo.tags) {
      const nome = nomeDeTag.trim()
      if (nome === '') {
        continue
      }
      let id = idDaTag.get(chaveDeNome(nome))
      if (id === undefined) {
        const nova = await tagsStore.criar(nome)
        idDaTag.set(chaveDeNome(nome), nova.id)
        id = nova.id
        tagsCriadas += 1
      }
      tagIds.push(id)
    }
    await notasStore.criar({
      titulo,
      conteudo: notaDeArquivo.conteudo,
      formato: notaDeArquivo.formato,
      status: notaDeArquivo.status,
      favorita: notaDeArquivo.favorita,
      fixada: notaDeArquivo.fixada,
      cadernoId,
      tagIds,
    })
    notasCriadas += 1
  }

  return { cadernosCriados, tagsCriadas, notasCriadas }
}