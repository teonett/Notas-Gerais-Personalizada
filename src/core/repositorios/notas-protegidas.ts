import type { AlteracaoNota, Nota, StatusSugestaoNota, SugestaoNota } from '../../domain'
import {
  podeDuplicar,
  podeEditarDireto,
  podeExcluir,
  podeMoverLixeira,
  podeSugerir,
  podeTransferir,
  podeVisualizar,
  STATUS_SUGESTAO_NOTA,
} from '../../domain'
import {
  erroAcessoNegado,
  type ContextoOperacaoNota,
  resolverContextoAutorizacaoNota,
} from '../autorizacao/notas'
import { usuariosStore } from './usuarios'
import { notasStore } from './notas'
import { sugestoesNotaStore } from './sugestoes-nota'

export type AlteracaoNotaProtegida = Partial<
  Omit<AlteracaoNota, 'ownerId' | 'criadaEm' | 'alteradaEm'>
>

export interface NovaSugestaoProtegida {
  notaId: string
  conteudoSugerido: string
}

export type DecisaoSugestaoNota =
  | typeof STATUS_SUGESTAO_NOTA.ACEITA
  | typeof STATUS_SUGESTAO_NOTA.REJEITADA

async function obterNotaOuNada(id: string): Promise<Nota | undefined> {
  return notasStore.obter(id)
}

async function exigirVisualizacao(
  nota: Nota,
  contexto: ContextoOperacaoNota,
): Promise<Awaited<ReturnType<typeof resolverContextoAutorizacaoNota>>> {
  const autorizacao = await resolverContextoAutorizacaoNota(nota, contexto)
  if (!podeVisualizar(autorizacao)) {
    throw erroAcessoNegado('Voce nao tem permissao para visualizar esta nota.')
  }
  return autorizacao
}

async function exigirDonoParaEdicao(
  nota: Nota,
  contexto: ContextoOperacaoNota,
): Promise<Awaited<ReturnType<typeof resolverContextoAutorizacaoNota>>> {
  const autorizacao = await resolverContextoAutorizacaoNota(nota, contexto)
  if (!podeEditarDireto(autorizacao)) {
    throw erroAcessoNegado('Somente o dono da nota pode editar este registro.')
  }
  return autorizacao
}

export const notasProtegidasStore = {
  async obterComoUsuario(
    id: string,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Nota | undefined> {
    const nota = await obterNotaOuNada(id)
    if (nota === undefined) {
      return undefined
    }
    await exigirVisualizacao(nota, contexto)
    return nota
  },

  async atualizarComoUsuario(
    id: string,
    mudancas: AlteracaoNotaProtegida,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Nota | undefined> {
    const nota = await obterNotaOuNada(id)
    if (nota === undefined) {
      return undefined
    }
    await exigirDonoParaEdicao(nota, contexto)
    return notasStore.atualizar(id, mudancas)
  },

  async mudarStatusComoUsuario(
    id: string,
    status: Nota['status'],
    contexto: ContextoOperacaoNota = {},
  ): Promise<Nota | undefined> {
    const nota = await obterNotaOuNada(id)
    if (nota === undefined) {
      return undefined
    }
    const autorizacao = await resolverContextoAutorizacaoNota(nota, contexto)
    if (!podeMoverLixeira(autorizacao)) {
      throw erroAcessoNegado('Somente o dono da nota pode alterar o status deste registro.')
    }
    return notasStore.mudarStatus(id, status)
  },

  async removerComoUsuario(
    ids: string[],
    contexto: ContextoOperacaoNota = {},
  ): Promise<void> {
    const notas: Nota[] = []
    for (const id of ids) {
      const nota = await obterNotaOuNada(id)
      if (nota !== undefined) {
        notas.push(nota)
      }
    }

    for (const nota of notas) {
      const autorizacao = await resolverContextoAutorizacaoNota(nota, contexto)
      if (!podeExcluir(autorizacao)) {
        throw erroAcessoNegado('Somente o dono da nota pode excluir este registro.')
      }
    }

    await notasStore.remover(ids)
  },

  async duplicarComoUsuario(
    id: string,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Nota | undefined> {
    const nota = await obterNotaOuNada(id)
    if (nota === undefined) {
      return undefined
    }
    const autorizacao = await exigirVisualizacao(nota, contexto)
    if (!podeDuplicar(autorizacao)) {
      throw erroAcessoNegado('Voce nao tem permissao para duplicar esta nota.')
    }
    return notasStore.duplicar(id, { usuarioId: autorizacao.usuario.id })
  },

  async transferirComoUsuario(
    id: string,
    novoOwnerId: string,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Nota | undefined> {
    const nota = await obterNotaOuNada(id)
    if (nota === undefined) {
      return undefined
    }
    const autorizacao = await resolverContextoAutorizacaoNota(nota, contexto)
    if (!podeTransferir(autorizacao)) {
      throw erroAcessoNegado('Somente administradores podem transferir titularidade.')
    }
    if ((await usuariosStore.obter(novoOwnerId)) === undefined) {
      throw erroAcessoNegado('Novo dono da nota nao existe.')
    }
    return notasStore.atualizar(id, { ownerId: novoOwnerId })
  },

  async criarSugestaoComoUsuario(
    nova: NovaSugestaoProtegida,
    contexto: ContextoOperacaoNota = {},
  ): Promise<SugestaoNota | undefined> {
    const nota = await obterNotaOuNada(nova.notaId)
    if (nota === undefined) {
      return undefined
    }
    const autorizacao = await exigirVisualizacao(nota, contexto)
    if (!podeSugerir(autorizacao)) {
      throw erroAcessoNegado('Voce nao tem permissao para sugerir alteracoes nesta nota.')
    }
    return sugestoesNotaStore.criar({
      notaId: nota.id,
      autorId: autorizacao.usuario.id,
      conteudoBase: nota.conteudo,
      conteudoSugerido: nova.conteudoSugerido,
    })
  },

  async revisarSugestaoComoUsuario(
    sugestaoId: string,
    decisao: DecisaoSugestaoNota,
    contexto: ContextoOperacaoNota = {},
  ): Promise<SugestaoNota | undefined> {
    const sugestao = await sugestoesNotaStore.obter(sugestaoId)
    if (sugestao === undefined) {
      return undefined
    }
    const nota = await obterNotaOuNada(sugestao.notaId)
    if (nota === undefined) {
      return undefined
    }
    const autorizacao = await exigirDonoParaEdicao(nota, contexto)

    if (decisao === STATUS_SUGESTAO_NOTA.REJEITADA) {
      return sugestoesNotaStore.revisar(sugestao.id, STATUS_SUGESTAO_NOTA.REJEITADA, autorizacao.usuario.id)
    }

    const status: StatusSugestaoNota =
      nota.conteudo === sugestao.conteudoBase
        ? STATUS_SUGESTAO_NOTA.ACEITA
        : STATUS_SUGESTAO_NOTA.CONFLITO

    if (status === STATUS_SUGESTAO_NOTA.ACEITA) {
      await notasStore.atualizar(nota.id, { conteudo: sugestao.conteudoSugerido })
    }

    return sugestoesNotaStore.revisar(sugestao.id, status, autorizacao.usuario.id)
  },
}
