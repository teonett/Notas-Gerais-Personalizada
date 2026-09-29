import { ehAdmin, PAPEL_USUARIO } from '../domain'
import type { Grupo, MembroGrupo, PapelUsuario, Usuario } from '../domain'
import { erroAcessoNegado, resolverUsuarioDaOperacao } from './autorizacao/notas'
import type { ContextoOperacaoNota } from './autorizacao/notas'
import { gruposStore } from './repositorios/grupos'
import { membrosGruposStore } from './repositorios/membros-grupos'
import { usuariosStore } from './repositorios/usuarios'

export interface ResumoGovernanca {
  usuarios: Usuario[]
  grupos: Grupo[]
  membros: MembroGrupo[]
}

export interface NovoUsuarioGovernanca {
  nome: string
  papeis: PapelUsuario[]
}

export interface NovoGrupoGovernanca {
  nome: string
}

export async function garantirPrimeiroAdministrador(
  contexto: ContextoOperacaoNota = {},
): Promise<Usuario | undefined> {
  const usuarioAtual = await resolverUsuarioDaOperacao(contexto)
  const usuarios = await usuariosStore.listarTodas()
  const existeAdministrador = usuarios.some(ehAdmin)
  if (existeAdministrador) {
    return undefined
  }

  return usuariosStore.atualizar(usuarioAtual.id, {
    papeis: papeisValidos([
      ...usuarioAtual.papeis,
      PAPEL_USUARIO.USUARIO,
      PAPEL_USUARIO.ADMIN,
    ]),
  })
}

async function exigirAdmin(contexto: ContextoOperacaoNota = {}): Promise<Usuario> {
  const usuario = await resolverUsuarioDaOperacao(contexto)
  if (!ehAdmin(usuario)) {
    throw erroAcessoNegado('Somente administradores podem acessar a governanca.')
  }
  return usuario
}

function papeisValidos(papeis: PapelUsuario[]): PapelUsuario[] {
  const unicos = [...new Set(papeis)]
  return unicos.length === 0 ? [PAPEL_USUARIO.USUARIO] : unicos
}

export const governancaStore = {
  async podeAcessar(contexto: ContextoOperacaoNota = {}): Promise<boolean> {
    try {
      await exigirAdmin(contexto)
      return true
    } catch {
      return false
    }
  },

  async listar(contexto: ContextoOperacaoNota = {}): Promise<ResumoGovernanca> {
    await exigirAdmin(contexto)
    const [usuarios, grupos, membros] = await Promise.all([
      usuariosStore.listar(),
      gruposStore.listar(),
      membrosGruposStore.listarTodas(),
    ])
    return { usuarios, grupos, membros }
  },

  async criarUsuario(
    novo: NovoUsuarioGovernanca,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Usuario> {
    await exigirAdmin(contexto)
    return usuariosStore.criar({
      nome: novo.nome,
      papeis: papeisValidos(novo.papeis),
      ativo: true,
    })
  },

  async atualizarUsuario(
    id: string,
    mudancas: Partial<Pick<Usuario, 'ativo' | 'papeis'>>,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Usuario | undefined> {
    await exigirAdmin(contexto)
    return usuariosStore.atualizar(id, {
      ...mudancas,
      papeis: mudancas.papeis === undefined ? undefined : papeisValidos(mudancas.papeis),
    })
  },

  async criarGrupo(
    novo: NovoGrupoGovernanca,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Grupo> {
    const admin = await exigirAdmin(contexto)
    return gruposStore.criar({ nome: novo.nome, criadoPor: admin.id })
  },

  async renomearGrupo(
    id: string,
    nome: string,
    contexto: ContextoOperacaoNota = {},
  ): Promise<Grupo | undefined> {
    await exigirAdmin(contexto)
    return gruposStore.renomear(id, nome)
  },

  async removerGrupo(id: string, contexto: ContextoOperacaoNota = {}): Promise<void> {
    await exigirAdmin(contexto)
    const membros = await membrosGruposStore.listarPorGrupo(id)
    for (const membro of membros) {
      await membrosGruposStore.remover(membro.id)
    }
    await gruposStore.remover(id)
  },

  async adicionarMembro(
    grupoId: string,
    usuarioId: string,
    contexto: ContextoOperacaoNota = {},
  ): Promise<MembroGrupo> {
    await exigirAdmin(contexto)
    const membros = await membrosGruposStore.listarPorGrupo(grupoId)
    const existente = membros.find((membro) => membro.usuarioId === usuarioId)
    if (existente !== undefined) {
      return existente
    }
    return membrosGruposStore.adicionar({ grupoId, usuarioId })
  },

  async removerMembro(
    grupoId: string,
    usuarioId: string,
    contexto: ContextoOperacaoNota = {},
  ): Promise<void> {
    await exigirAdmin(contexto)
    const membros = await membrosGruposStore.listarPorGrupo(grupoId)
    for (const membro of membros) {
      if (membro.usuarioId === usuarioId) {
        await membrosGruposStore.remover(membro.id)
      }
    }
  },
}
