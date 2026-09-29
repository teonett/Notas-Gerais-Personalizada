import type { ContextoPoliticaNota, MembroGrupo, Nota, PermissaoNota, Usuario } from '../../domain'
import { obterUsuarioPadraoAtual } from '../storage/idb'
import { membrosGruposStore } from '../repositorios/membros-grupos'
import { permissoesNotaStore } from '../repositorios/permissoes-nota'
import { usuariosStore } from '../repositorios/usuarios'
import { AppError, ERROR_CODES } from '../errors'

export interface ContextoOperacaoNota {
  usuarioId?: string
}

export interface ContextoAutorizacaoNota extends ContextoPoliticaNota {
  usuario: Usuario
  nota: Nota
  permissoes: PermissaoNota[]
  membrosGrupos: MembroGrupo[]
}

function erroUsuarioNaoEncontrado(usuarioId: string): AppError {
  return new AppError(
    ERROR_CODES.AUTORIZACAO.USUARIO_NAO_ENCONTRADO,
    `Usuario nao encontrado para a operacao: ${usuarioId}.`,
  )
}

export function erroAcessoNegado(mensagem = 'Voce nao tem permissao para executar esta operacao.'): AppError {
  return new AppError(ERROR_CODES.AUTORIZACAO.ACESSO_NEGADO, mensagem)
}

export async function resolverUsuarioDaOperacao(
  contexto: ContextoOperacaoNota = {},
): Promise<Usuario> {
  const usuarioPadrao = obterUsuarioPadraoAtual()
  const usuarioId = contexto.usuarioId ?? usuarioPadrao.id
  const existente = await usuariosStore.obter(usuarioId)
  if (existente !== undefined) {
    return existente
  }
  if (usuarioId === usuarioPadrao.id) {
    return usuariosStore.garantir({ id: usuarioPadrao.id, nome: usuarioPadrao.nome })
  }
  throw erroUsuarioNaoEncontrado(usuarioId)
}

export async function resolverContextoAutorizacaoNota(
  nota: Nota,
  contexto: ContextoOperacaoNota = {},
): Promise<ContextoAutorizacaoNota> {
  const usuario = await resolverUsuarioDaOperacao(contexto)
  const [permissoes, membrosGrupos] = await Promise.all([
    permissoesNotaStore.listarPorNota(nota.id),
    membrosGruposStore.listarPorUsuario(usuario.id),
  ])
  return {
    usuario,
    nota,
    permissoes,
    membrosGrupos,
  }
}
