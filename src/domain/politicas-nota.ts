import type { MembroGrupo } from './grupo'
import type { Nota } from './nota'
import type { PermissaoNota } from './permissao-nota'
import { PAPEL_USUARIO, TIPO_ALVO_PERMISSAO, VISIBILIDADE_NOTA } from './tipos'
import type { Usuario } from './usuario'

export interface ContextoPoliticaNota {
  usuario: Usuario | null
  nota: Nota
  permissoes?: PermissaoNota[]
  membrosGrupos?: MembroGrupo[]
}

function gruposDoUsuario(usuarioId: string, membrosGrupos: MembroGrupo[] = []): Set<string> {
  return new Set(
    membrosGrupos
      .filter((membro) => membro.usuarioId === usuarioId)
      .map((membro) => membro.grupoId),
  )
}

export function ehDono(nota: Nota, usuario: Usuario | null): boolean {
  return usuario !== null && nota.ownerId !== undefined && nota.ownerId === usuario.id
}

export function ehAdmin(usuario: Usuario | null): boolean {
  return usuario?.papeis.includes(PAPEL_USUARIO.ADMIN) === true
}

export function ehUsuarioPadrao(usuario: Usuario | null): boolean {
  return usuario?.papeis.includes(PAPEL_USUARIO.USUARIO) === true
}

export function notaEhPublica(nota: Nota): boolean {
  return nota.visibilidade === VISIBILIDADE_NOTA.PUBLICA
}

export function possuiPermissaoNaNota(contexto: ContextoPoliticaNota): boolean {
  const { usuario, permissoes = [], membrosGrupos = [], nota } = contexto
  if (usuario === null) {
    return false
  }

  const grupos = gruposDoUsuario(usuario.id, membrosGrupos)
  return permissoes.some((permissao) => {
    if (permissao.notaId !== nota.id) {
      return false
    }
    if (permissao.alvoTipo === TIPO_ALVO_PERMISSAO.USUARIO) {
      return permissao.alvoId === usuario.id
    }
    return grupos.has(permissao.alvoId)
  })
}

export function possuiPermissaoDeSugerir(contexto: ContextoPoliticaNota): boolean {
  const { usuario, permissoes = [], membrosGrupos = [], nota } = contexto
  if (usuario === null) {
    return false
  }

  const grupos = gruposDoUsuario(usuario.id, membrosGrupos)
  return permissoes.some((permissao) => {
    if (permissao.notaId !== nota.id || !permissao.podeSugerir) {
      return false
    }
    if (permissao.alvoTipo === TIPO_ALVO_PERMISSAO.USUARIO) {
      return permissao.alvoId === usuario.id
    }
    return grupos.has(permissao.alvoId)
  })
}

export function podeVisualizar(contexto: ContextoPoliticaNota): boolean {
  const { usuario, nota } = contexto
  if (usuario === null) {
    return false
  }
  return ehDono(nota, usuario) || ehAdmin(usuario) || notaEhPublica(nota) || possuiPermissaoNaNota(contexto)
}

export function podeEditarDireto(contexto: ContextoPoliticaNota): boolean {
  const { usuario, nota } = contexto
  return ehDono(nota, usuario)
}

export function podeExcluir(contexto: ContextoPoliticaNota): boolean {
  return podeEditarDireto(contexto)
}

export function podeMoverLixeira(contexto: ContextoPoliticaNota): boolean {
  return podeExcluir(contexto)
}

export function podeDuplicar(contexto: ContextoPoliticaNota): boolean {
  return podeVisualizar(contexto)
}

export function podeSugerir(contexto: ContextoPoliticaNota): boolean {
  const { usuario, nota } = contexto
  if (usuario === null || ehDono(nota, usuario)) {
    return false
  }
  return possuiPermissaoDeSugerir(contexto)
}

export function podeTransferir(contexto: ContextoPoliticaNota): boolean {
  return ehAdmin(contexto.usuario)
}
