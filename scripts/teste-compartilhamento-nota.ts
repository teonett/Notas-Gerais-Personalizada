import { IDBFactory } from 'fake-indexeddb'
import {
  TIPO_ALVO_PERMISSAO,
  VISIBILIDADE_NOTA,
} from '../src/domain'
import { BANCO } from '../src/core/storage/config'
import { excluirBancoPeloNome, prepararPersistencia } from '../src/core/storage/idb'
import {
  gruposStore,
  membrosGruposStore,
  notasProtegidasStore,
  notasStore,
  permissoesNotaStore,
  usuariosStore,
} from '../src/core/repositorios'

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

async function main() {
  await excluirBancoPeloNome(BANCO.nome)
  await prepararPersistencia()

  const dona = await usuariosStore.criar({ nome: 'Dona' })
  const leitora = await usuariosStore.criar({ nome: 'Leitora' })
  const pessoaGrupo = await usuariosStore.criar({ nome: 'Pessoa do grupo' })
  const grupo = await gruposStore.criar({ nome: 'Time', criadoPor: dona.id })
  await membrosGruposStore.adicionar({ grupoId: grupo.id, usuarioId: pessoaGrupo.id })

  const nota = await notasStore.criar(
    {
      titulo: 'Compartilhavel',
      conteudo: 'conteudo privado',
      formato: 'MARKDOWN',
    },
    { usuarioId: dona.id },
  )

  passo(
    'nota nasce privada',
    nota.visibilidade === VISIBILIDADE_NOTA.PRIVADA,
  )

  const publica = await notasProtegidasStore.atualizarComoUsuario(
    nota.id,
    { visibilidade: VISIBILIDADE_NOTA.PUBLICA },
    { usuarioId: dona.id },
  )
  passo('dono altera visibilidade para publica', publica?.visibilidade === VISIBILIDADE_NOTA.PUBLICA)
  passo(
    'usuario autenticado visualiza nota publica',
    (await notasProtegidasStore.obterComoUsuario(nota.id, { usuarioId: leitora.id }))?.id === nota.id,
  )

  const privada = await notasProtegidasStore.atualizarComoUsuario(
    nota.id,
    { visibilidade: VISIBILIDADE_NOTA.PRIVADA },
    { usuarioId: dona.id },
  )
  passo('dono volta nota para privada', privada?.visibilidade === VISIBILIDADE_NOTA.PRIVADA)

  const permissaoUsuario = await permissoesNotaStore.conceder({
    notaId: nota.id,
    alvoTipo: TIPO_ALVO_PERMISSAO.USUARIO,
    alvoId: leitora.id,
    podeSugerir: true,
  })
  const permissaoUsuarioAtualizada = await permissoesNotaStore.conceder({
    notaId: nota.id,
    alvoTipo: TIPO_ALVO_PERMISSAO.USUARIO,
    alvoId: leitora.id,
    podeSugerir: true,
  })
  passo('concessao individual e idempotente', permissaoUsuarioAtualizada.id === permissaoUsuario.id)
  passo(
    'usuario autorizado visualiza nota privada',
    (await notasProtegidasStore.obterComoUsuario(nota.id, { usuarioId: leitora.id }))?.id === nota.id,
  )

  const sugestaoUsuario = await notasProtegidasStore.criarSugestaoComoUsuario(
    {
      notaId: nota.id,
      conteudoSugerido: 'conteudo sugerido',
    },
    { usuarioId: leitora.id },
  )
  passo('usuario autorizado pode sugerir conteudo', sugestaoUsuario?.autorId === leitora.id)

  const permissaoGrupo = await permissoesNotaStore.conceder({
    notaId: nota.id,
    alvoTipo: TIPO_ALVO_PERMISSAO.GRUPO,
    alvoId: grupo.id,
    podeSugerir: true,
  })
  passo(
    'membro de grupo autorizado visualiza nota privada',
    (await notasProtegidasStore.obterComoUsuario(nota.id, { usuarioId: pessoaGrupo.id }))?.id === nota.id,
  )

  await permissoesNotaStore.removerPorNotaAlvo(
    nota.id,
    TIPO_ALVO_PERMISSAO.USUARIO,
    leitora.id,
  )
  passo(
    'remocao por alvo remove permissao individual',
    !(await permissoesNotaStore.listarPorNota(nota.id)).some((p) => p.id === permissaoUsuario.id),
  )

  await permissoesNotaStore.remover(permissaoGrupo.id)
  passo(
    'remocao direta remove permissao de grupo',
    (await permissoesNotaStore.listarPorNota(nota.id)).length === 0,
  )

  console.log(`\nCOMPARTILHAMENTO DE NOTA OK | ${passos} passos`)
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
