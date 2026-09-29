import type { MembroGrupo } from '../src/domain/grupo'
import type { Nota } from '../src/domain/nota'
import type { PermissaoNota } from '../src/domain/permissao-nota'
import {
  duplicarNotaParaUsuario,
  ehAdmin,
  ehDono,
  PAPEL_USUARIO,
  podeDuplicar,
  podeEditarDireto,
  podeExcluir,
  podeSugerir,
  podeTransferir,
  podeVisualizar,
  STATUS_NOTA,
  TIPO_ALVO_PERMISSAO,
  VISIBILIDADE_NOTA,
} from '../src/domain'
import type { Usuario } from '../src/domain/usuario'

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

function usuario(id: string, papeis = [PAPEL_USUARIO.USUARIO]): Usuario {
  return {
    id,
    nome: id,
    papeis,
    ativo: true,
    criadaEm: '2026-09-13T00:00:00.000Z',
  }
}

function nota(parcial: Partial<Nota> = {}): Nota {
  return {
    id: 'nota-1',
    ownerId: 'ana',
    titulo: 'Plano',
    conteudo: 'conteudo base',
    formato: 'MARKDOWN',
    status: STATUS_NOTA.ATIVA,
    visibilidade: VISIBILIDADE_NOTA.PRIVADA,
    favorita: true,
    fixada: true,
    cadernoId: 'cad-1',
    tagIds: ['tag-1'],
    criadaEm: '2026-09-13T00:00:00.000Z',
    alteradaEm: '2026-09-13T00:00:00.000Z',
    excluidaEm: null,
    ...parcial,
  }
}

const ana = usuario('ana')
const bia = usuario('bia')
const admin = usuario('root', [PAPEL_USUARIO.ADMIN])
const adminUsuario = usuario('gestor', [PAPEL_USUARIO.ADMIN, PAPEL_USUARIO.USUARIO])

const privada = nota()
const publica = nota({ visibilidade: VISIBILIDADE_NOTA.PUBLICA })

passo('dono da nota e reconhecido', ehDono(privada, ana))
passo('outro usuario nao e dono', !ehDono(privada, bia))
passo('admin e reconhecido pelo papel', ehAdmin(admin))
passo('usuario com dois papeis tambem e admin para governanca', ehAdmin(adminUsuario))

passo('usuario anonimo nao visualiza nota', !podeVisualizar({ usuario: null, nota: publica }))
passo('dono visualiza nota privada', podeVisualizar({ usuario: ana, nota: privada }))
passo('admin visualiza todas as notas', podeVisualizar({ usuario: admin, nota: privada }))
passo('usuario autenticado visualiza nota publica', podeVisualizar({ usuario: bia, nota: publica }))
passo('usuario sem permissao nao visualiza nota privada', !podeVisualizar({ usuario: bia, nota: privada }))

passo('somente dono edita diretamente', podeEditarDireto({ usuario: ana, nota: privada }))
passo('admin nao edita conteudo de outro dono', !podeEditarDireto({ usuario: admin, nota: privada }))
passo('usuario autorizado nao exclui original alheia', !podeExcluir({ usuario: bia, nota: publica }))

const permissaoUsuario: PermissaoNota = {
  id: 'perm-1',
  notaId: privada.id,
  alvoTipo: TIPO_ALVO_PERMISSAO.USUARIO,
  alvoId: bia.id,
  podeSugerir: true,
  criadaEm: '2026-09-13T00:00:00.000Z',
}

passo(
  'permissao individual permite visualizar nota privada',
  podeVisualizar({ usuario: bia, nota: privada, permissoes: [permissaoUsuario] }),
)
passo(
  'permissao individual permite sugerir conteudo',
  podeSugerir({ usuario: bia, nota: privada, permissoes: [permissaoUsuario] }),
)
passo(
  'dono nao cria sugestao para a propria nota',
  !podeSugerir({ usuario: ana, nota: privada, permissoes: [permissaoUsuario] }),
)

const membrosGrupos: MembroGrupo[] = [
  {
    id: 'membro-1',
    grupoId: 'grupo-produto',
    usuarioId: bia.id,
    adicionadaEm: '2026-09-13T00:00:00.000Z',
  },
]
const permissaoGrupo: PermissaoNota = {
  id: 'perm-2',
  notaId: privada.id,
  alvoTipo: TIPO_ALVO_PERMISSAO.GRUPO,
  alvoId: 'grupo-produto',
  podeSugerir: true,
  criadaEm: '2026-09-13T00:00:00.000Z',
}

passo(
  'permissao por grupo permite visualizar nota privada',
  podeVisualizar({
    usuario: bia,
    nota: privada,
    permissoes: [permissaoGrupo],
    membrosGrupos,
  }),
)
passo(
  'somente autorizados podem sugerir',
  !podeSugerir({ usuario: usuario('caio'), nota: privada, permissoes: [permissaoGrupo], membrosGrupos }),
)

passo('quem visualiza pode duplicar', podeDuplicar({ usuario: bia, nota: publica }))
passo('admin pode transferir titularidade', podeTransferir({ usuario: admin, nota: privada }))
passo('usuario comum nao transfere titularidade', !podeTransferir({ usuario: ana, nota: privada }))

const copia = duplicarNotaParaUsuario({
  nota: privada,
  novoId: 'nota-2',
  novoOwnerId: bia.id,
  criadaEm: '2026-09-13T12:00:00.000Z',
})

passo('duplicacao cria novo registro', copia.id === 'nota-2' && copia.id !== privada.id)
passo('duplicacao muda dono para usuario atual', copia.ownerId === bia.id)
passo('duplicacao usa sufixo copia', copia.titulo === 'Plano - copia')
passo('duplicacao preserva conteudo formato caderno e tags', copia.conteudo === privada.conteudo && copia.formato === privada.formato && copia.cadernoId === privada.cadernoId && copia.tagIds[0] === privada.tagIds[0])
passo('duplicacao reseta estado operacional', copia.status === STATUS_NOTA.ATIVA && !copia.favorita && !copia.fixada && copia.excluidaEm === null)
passo('duplicacao nao altera a nota original', privada.ownerId === ana.id && privada.favorita && privada.fixada)

console.log(`\nDOMINIO MULTIUSUARIO OK | ${passos} passos`)
