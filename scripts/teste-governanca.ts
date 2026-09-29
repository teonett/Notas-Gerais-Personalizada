import { IDBFactory } from 'fake-indexeddb'
import { AppError, ERROR_CODES, governancaStore, usuariosStore } from '../src/core'
import { BANCO } from '../src/core/storage/config'
import { excluirBancoPeloNome, prepararPersistencia } from '../src/core/storage/idb'
import { PAPEL_USUARIO } from '../src/domain'

const g = globalThis as typeof globalThis & {
  window?: unknown
  indexedDB?: unknown
}
g.window = globalThis
g.indexedDB = new IDBFactory()

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

async function falhouComAcessoNegado(acao: () => Promise<unknown>): Promise<boolean> {
  try {
    await acao()
    return false
  } catch (erro: unknown) {
    return erro instanceof AppError && erro.codigo === ERROR_CODES.AUTORIZACAO.ACESSO_NEGADO
  }
}

async function main() {
  await excluirBancoPeloNome(BANCO.nome)
  await prepararPersistencia()

  const comum = await usuariosStore.criar({ nome: 'Comum' })
  const admin = await usuariosStore.criar({
    nome: 'Admin',
    papeis: [PAPEL_USUARIO.ADMIN],
  })

  passo(
    'usuario comum nao acessa governanca',
    await falhouComAcessoNegado(() => governancaStore.listar({ usuarioId: comum.id })),
  )
  passo('admin acessa governanca', await governancaStore.podeAcessar({ usuarioId: admin.id }))

  const novo = await governancaStore.criarUsuario(
    { nome: 'Bia', papeis: [PAPEL_USUARIO.USUARIO] },
    { usuarioId: admin.id },
  )
  passo('admin cria usuario', novo.nome === 'Bia' && novo.papeis.includes(PAPEL_USUARIO.USUARIO))

  const promovido = await governancaStore.atualizarUsuario(
    novo.id,
    { papeis: [PAPEL_USUARIO.USUARIO, PAPEL_USUARIO.ADMIN] },
    { usuarioId: admin.id },
  )
  passo('admin atualiza papeis', promovido?.papeis.includes(PAPEL_USUARIO.ADMIN) === true)

  const inativo = await governancaStore.atualizarUsuario(
    novo.id,
    { ativo: false },
    { usuarioId: admin.id },
  )
  passo('admin desativa usuario', inativo?.ativo === false)

  const grupo = await governancaStore.criarGrupo({ nome: 'Produto' }, { usuarioId: admin.id })
  passo('admin cria grupo', grupo.nome === 'Produto' && grupo.criadoPor === admin.id)

  const renomeado = await governancaStore.renomearGrupo(
    grupo.id,
    'Produto e Design',
    { usuarioId: admin.id },
  )
  passo('admin renomeia grupo', renomeado?.nome === 'Produto e Design')

  const membro = await governancaStore.adicionarMembro(
    grupo.id,
    comum.id,
    { usuarioId: admin.id },
  )
  const membroDuplicado = await governancaStore.adicionarMembro(
    grupo.id,
    comum.id,
    { usuarioId: admin.id },
  )
  passo('adicionar membro e idempotente', membroDuplicado.id === membro.id)

  let resumo = await governancaStore.listar({ usuarioId: admin.id })
  passo('membro aparece no resumo', resumo.membros.some((m) => m.id === membro.id))

  await governancaStore.removerMembro(grupo.id, comum.id, { usuarioId: admin.id })
  resumo = await governancaStore.listar({ usuarioId: admin.id })
  passo('admin remove membro', !resumo.membros.some((m) => m.id === membro.id))

  await governancaStore.adicionarMembro(grupo.id, comum.id, { usuarioId: admin.id })
  await governancaStore.removerGrupo(grupo.id, { usuarioId: admin.id })
  resumo = await governancaStore.listar({ usuarioId: admin.id })
  passo('remover grupo tambem remove membros', !resumo.grupos.some((g) => g.id === grupo.id) && resumo.membros.length === 0)

  console.log(`\nGOVERNANCA OK | ${passos} passos`)
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
