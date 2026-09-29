import { IDBFactory } from 'fake-indexeddb'
import { criarContaLocal, desbloquear, bloquear } from '../src/core/auth/sessao'
import { governancaStore, usuariosStore } from '../src/core'
import { garantirPrimeiroAdministrador } from '../src/core/governanca'
import { excluirBancoPeloNome } from '../src/core/storage/idb'
import { AUT } from '../src/core/auth/constantes'
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

function temPapelAdmin(papeis: string[]): boolean {
  return papeis.includes(PAPEL_USUARIO.ADMIN)
}

function temPapelUsuario(papeis: string[]): boolean {
  return papeis.includes(PAPEL_USUARIO.USUARIO)
}

async function main() {
  await excluirBancoPeloNome(AUT.nomeBancoContas)

  const ana = await criarContaLocal('ana', 'senha-forte-123')
  const usuarioAna = await usuariosStore.obter(ana.id)
  passo(
    'primeira conta vira usuario administrador',
    usuarioAna !== undefined &&
      temPapelAdmin(usuarioAna.papeis) &&
      temPapelUsuario(usuarioAna.papeis),
  )

  passo('primeiro admin acessa governanca', await governancaStore.podeAcessar({ usuarioId: ana.id }))

  const comum = await usuariosStore.criar({ nome: 'Comum' })
  const tentativaPromocao = await garantirPrimeiroAdministrador({ usuarioId: comum.id })
  const comumRelido = await usuariosStore.obter(comum.id)
  passo('bootstrap e idempotente quando ja existe admin', tentativaPromocao === undefined)
  passo(
    'usuario comum nao e promovido se ja existe admin',
    comumRelido !== undefined && !temPapelAdmin(comumRelido.papeis),
  )

  await bloquear()
  await desbloquear('ana', 'senha-forte-123')
  const anaRelida = await usuariosStore.obter(ana.id)
  passo(
    'reabrir sessao preserva admin existente',
    anaRelida !== undefined && temPapelAdmin(anaRelida.papeis),
  )

  await bloquear()
  const bia = await criarContaLocal('bia', 'outra-senha-456')
  const usuarioBia = await usuariosStore.obter(bia.id)
  passo(
    'novo cofre isolado tambem recebe seu primeiro admin',
    usuarioBia !== undefined &&
      temPapelAdmin(usuarioBia.papeis) &&
      temPapelUsuario(usuarioBia.papeis),
  )

  console.log(`\nBOOTSTRAP ADMIN OK | ${passos} passos`)
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
