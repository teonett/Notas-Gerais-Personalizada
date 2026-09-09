import type { Nota } from '../../domain'
import { gerarId, STATUS_NOTA } from '../../domain'
import { apagarItem, gravarItem, lerItem, listarItens } from '../storage/idb'
import { tagsStore } from './tags'
import { registrarNota, registrarRemocao } from '../../sync/mudancas'

export interface AFiltroNota {
  status?: Nota['status'] | undefined
  cadernoId?: string | null | undefined
  tagId?: string | undefined
  termo?: string | undefined
  favoritas?: boolean | undefined
  ordenacao?: 'alteradaEm' | 'titulo' | undefined
}

export type NovaNota = Pick<Nota, 'titulo' | 'conteudo' | 'formato'> &
  Partial<Pick<Nota, 'cadernoId' | 'tagIds'>>

const STORE = 'notas'

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function objetoDaNota(nova: NovaNota, agora: string): Nota {
  return {
    id: gerarId(),
    titulo: nova.titulo.trim(),
    conteudo: nova.conteudo,
    formato: nova.formato,
    status: STATUS_NOTA.ATIVA,
    favorita: false,
    fixada: false,
    cadernoId: nova.cadernoId ?? null,
    tagIds: nova.tagIds ?? [],
    criadaEm: agora,
    alteradaEm: agora,
    excluidaEm: null,
  }
}

function aplicarFiltros(notas: Nota[], filtro: AFiltroNota): Nota[] {
  let resultado = notas

  if (filtro.status !== undefined) {
    resultado = resultado.filter((n) => n.status === filtro.status)
  }
  if (filtro.cadernoId !== undefined) {
    resultado = resultado.filter((n) => n.cadernoId === filtro.cadernoId)
  }
  if (filtro.tagId !== undefined) {
    resultado = resultado.filter((n) => n.tagIds.includes(filtro.tagId as string))
  }
  if (filtro.favoritas) {
    resultado = resultado.filter((n) => n.favorita)
  }

  return resultado
}

export async function buscarPorTermo(notas: Nota[], termo: string): Promise<Nota[]> {
  const busca = normalizarTexto(termo)
  const todasTags = await tagsStore.listarTodas()
  const tagsCorrespondentes = todasTags
    .filter((tag) => normalizarTexto(tag.nome).includes(busca))
    .map((tag) => tag.id)

  return notas.filter((nota) => {
    const bloco = normalizarTexto(`${nota.titulo}\n${nota.conteudo}`)
    const porConteudo = bloco.includes(busca)
    const porTag = nota.tagIds.some((id) => tagsCorrespondentes.includes(id))
    return porConteudo || porTag
  })
}

export const notasStore = {
  async criar(nova: NovaNota): Promise<Nota> {
    const agora = new Date().toISOString()
    const nota = objetoDaNota(nova, agora)
    await gravarItem(STORE, nota)
    await registrarNota(nota)
    return nota
  },

  async atualizar(id: string, mudancas: Partial<Omit<Nota, 'id'>>): Promise<Nota | undefined> {
    const existente = await lerItem<Nota>(STORE, id)
    if (existente === undefined) {
      return undefined
    }
    const atualizada: Nota = {
      ...existente,
      ...mudancas,
      alteradaEm: new Date().toISOString(),
    }
    await gravarItem(STORE, atualizada)
    await registrarNota(atualizada)
    return atualizada
  },

  async obter(id: string): Promise<Nota | undefined> {
    return lerItem<Nota>(STORE, id)
  },

  async listarTodas(): Promise<Nota[]> {
    return listarItens<Nota>(STORE)
  },

  async listar(filtro: AFiltroNota = {}): Promise<Nota[]> {
    const todas = await this.listarTodas()
    const filtradas = aplicarFiltros(todas, filtro)

    let resultado = filtradas
    if (filtro.termo !== undefined && filtro.termo.trim() !== '') {
      resultado = await buscarPorTermo(filtradas, filtro.termo)
    }

    resultado.sort((a, b) => {
      if (a.fixada !== b.fixada) {
        return a.fixada ? -1 : 1
      }
      if (filtro.ordenacao === 'titulo') {
        return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
      }
      return b.alteradaEm.localeCompare(a.alteradaEm)
    })

    return resultado
  },

  async remover(ids: string[]): Promise<void> {
    for (const id of ids) {
      await apagarItem(STORE, id)
    }
    for (const id of ids) {
      await registrarRemocao('nota', id)
    }
  },

  async limparLixeira(): Promise<void> {
    const lixeira = await this.listar({ status: STATUS_NOTA.LIXEIRA })
    for (const nota of lixeira) {
      await registrarRemocao('nota', nota.id)
    }
    for (const nota of lixeira) {
      await apagarItem(STORE, nota.id)
    }
  },

  async mudarStatus(id: string, status: Nota['status']): Promise<Nota | undefined> {
    const mudancas: Partial<Nota> = { status }
    if (status === STATUS_NOTA.LIXEIRA) {
      mudancas.excluidaEm = new Date().toISOString()
    } else {
      mudancas.excluidaEm = null
    }
    return this.atualizar(id, mudancas)
  },

  async alternarFavorita(id: string): Promise<Nota | undefined> {
    const nota = await this.obter(id)
    if (nota === undefined) {
      return undefined
    }
    return this.atualizar(id, { favorita: !nota.favorita })
  },

  async alternarFixada(id: string): Promise<Nota | undefined> {
    const nota = await this.obter(id)
    if (nota === undefined) {
      return undefined
    }
    return this.atualizar(id, { fixada: !nota.fixada })
  },

  async duplicar(id: string): Promise<Nota | undefined> {
    const nota = await this.obter(id)
    if (nota === undefined) {
      return undefined
    }
    const agora = new Date().toISOString()
    const copia: Nota = {
      ...nota,
      id: gerarId(),
      titulo: `${nota.titulo} — cópia`,
      favorita: false,
      fixada: false,
      criadaEm: agora,
      alteradaEm: agora,
      excluidaEm: null,
    }
    await gravarItem(STORE, copia)
    await registrarNota(copia)
    return copia
  },

  async contagemPorStatus(): Promise<Record<Nota['status'], number>> {
    const todas = await this.listarTodas()
    return {
      ATIVA: todas.filter((n) => n.status === STATUS_NOTA.ATIVA).length,
      ARQUIVADA: todas.filter((n) => n.status === STATUS_NOTA.ARQUIVADA).length,
      LIXEIRA: todas.filter((n) => n.status === STATUS_NOTA.LIXEIRA).length,
    }
  },

  async contagemPorCaderno(cadernoId: string): Promise<number> {
    const todas = await this.listarTodas()
    return todas.filter(
      (n) => n.cadernoId === cadernoId && n.status === STATUS_NOTA.ATIVA,
    ).length
  },

  async contagemPorTag(tagId: string): Promise<number> {
    const todas = await this.listarTodas()
    return todas.filter((n) => n.tagIds.includes(tagId)).length
  },

  async removerTagDeTodasNotas(tagId: string): Promise<void> {
    const todas = await this.listarTodas()
    for (const nota of todas) {
      if (nota.tagIds.includes(tagId)) {
        await this.atualizar(nota.id, {
          tagIds: nota.tagIds.filter((t) => t !== tagId),
        })
      }
    }
  },
}