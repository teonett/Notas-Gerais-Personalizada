import { IDBFactory } from 'fake-indexeddb'
import {
  PAPEL_USUARIO,
  STATUS_NOTA,
  STATUS_SUGESTAO_NOTA,
  TIPO_ALVO_PERMISSAO,
  VISIBILIDADE_NOTA,
} from '../src/domain'
import { AppError, ERROR_CODES } from '../src/core/errors'
import {
  gruposStore,
  membrosGruposStore,
  notasProtegidasStore,
  notasStore,
  permissoesNotaStore,
  usuariosStore,
} from '../src/core/repositorios'
import { excluirBancoPeloNome, prepararPersistencia } from '../src/core/storage/idb'
import { BANCO } from '../src/core/storage/config'

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

  const ana = await usuariosStore.criar({ nome: 'Ana' })
  const bia = await usuariosStore.criar({ nome: 'Bia' })
  const caio = await usuariosStore.criar({ nome: 'Caio' })
  const admin = await usuariosStore.criar({
    nome: 'Admin',
    papeis: [PAPEL_USUARIO.ADMIN],
  })

  const privada = await notasStore.criar(
    {
      titulo: 'Privada',
      conteudo: 'conteudo inicial',
      formato: 'MARKDOWN',
    },
    { usuarioId: ana.id },
  )
  const publica = await notasStore.criar(
    {
      titulo: 'Publica',
      conteudo: 'conteudo publico',
      formato: 'MARKDOWN',
      visibilidade: VISIBILIDADE_NOTA.PUBLICA,
    },
    { usuarioId: ana.id },
  )

  const editada = await notasProtegidasStore.atualizarComoUsuario(
    privada.id,
    { conteudo: 'conteudo da dona' },
    { usuarioId: ana.id },
  )
  passo('dono edita diretamente', editada?.conteudo === 'conteudo da dona')
  passo(
    'admin nao edita nota alheia',
    await falhouComAcessoNegado(() =>
      notasProtegidasStore.atualizarComoUsuario(privada.id, { conteudo: 'admin' }, { usuarioId: admin.id }),
    ),
  )
  passo(
    'usuario sem permissao nao edita nota alheia',
    await falhouComAcessoNegado(() =>
      notasProtegidasStore.atualizarComoUsuario(privada.id, { conteudo: 'bia' }, { usuarioId: bia.id }),
    ),
  )

  passo(
    'admin visualiza nota privada por governanca',
    (await notasProtegidasStore.obterComoUsuario(privada.id, { usuarioId: admin.id }))?.id === privada.id,
  )
  passo(
    'usuario sem permissao nao visualiza privada',
    await falhouComAcessoNegado(() =>
      notasProtegidasStore.obterComoUsuario(privada.id, { usuarioId: bia.id }),
    ),
  )

  await permissoesNotaStore.criar({
    notaId: privada.id,
    alvoTipo: TIPO_ALVO_PERMISSAO.USUARIO,
    alvoId: bia.id,
    podeSugerir: true,
  })
  passo(
    'permissao individual permite visualizar privada',
    (await notasProtegidasStore.obterComoUsuario(privada.id, { usuarioId: bia.id }))?.id === privada.id,
  )

  const sugestao = await notasProtegidasStore.criarSugestaoComoUsuario(
    {
      notaId: privada.id,
      conteudoSugerido: 'conteudo sugerido',
    },
    { usuarioId: bia.id },
  )
  passo('usuario autorizado cria sugestao', sugestao?.status === STATUS_SUGESTAO_NOTA.PENDENTE)
  passo(
    'nao dono nao revisa sugestao',
    sugestao !== undefined &&
      await falhouComAcessoNegado(() =>
        notasProtegidasStore.revisarSugestaoComoUsuario(
          sugestao.id,
          STATUS_SUGESTAO_NOTA.ACEITA,
          { usuarioId: bia.id },
        ),
      ),
  )

  const aceita = sugestao === undefined
    ? undefined
    : await notasProtegidasStore.revisarSugestaoComoUsuario(
        sugestao.id,
        STATUS_SUGESTAO_NOTA.ACEITA,
        { usuarioId: ana.id },
      )
  passo('dono aceita sugestao', aceita?.status === STATUS_SUGESTAO_NOTA.ACEITA)
  passo(
    'aceite atualiza conteudo da nota',
    (await notasStore.obter(privada.id))?.conteudo === 'conteudo sugerido',
  )

  const grupo = await gruposStore.criar({ nome: 'Produto', criadoPor: admin.id })
  await membrosGruposStore.adicionar({ grupoId: grupo.id, usuarioId: caio.id })
  await permissoesNotaStore.criar({
    notaId: privada.id,
    alvoTipo: TIPO_ALVO_PERMISSAO.GRUPO,
    alvoId: grupo.id,
    podeSugerir: true,
  })
  const sugestaoGrupo = await notasProtegidasStore.criarSugestaoComoUsuario(
    {
      notaId: privada.id,
      conteudoSugerido: 'conteudo via grupo',
    },
    { usuarioId: caio.id },
  )
  passo('permissao por grupo permite sugerir', sugestaoGrupo?.autorId === caio.id)

  await notasProtegidasStore.atualizarComoUsuario(
    privada.id,
    { conteudo: 'conteudo mudou antes da revisao' },
    { usuarioId: ana.id },
  )
  const conflito = sugestaoGrupo === undefined
    ? undefined
    : await notasProtegidasStore.revisarSugestaoComoUsuario(
        sugestaoGrupo.id,
        STATUS_SUGESTAO_NOTA.ACEITA,
        { usuarioId: ana.id },
      )
  passo('sugestao vira conflito se base mudou', conflito?.status === STATUS_SUGESTAO_NOTA.CONFLITO)
  passo(
    'conflito nao sobrescreve conteudo atual',
    (await notasStore.obter(privada.id))?.conteudo === 'conteudo mudou antes da revisao',
  )

  passo(
    'nao dono nao exclui nota publica alheia',
    await falhouComAcessoNegado(() =>
      notasProtegidasStore.removerComoUsuario([publica.id], { usuarioId: bia.id }),
    ),
  )
  const lixeira = await notasProtegidasStore.mudarStatusComoUsuario(
    publica.id,
    STATUS_NOTA.LIXEIRA,
    { usuarioId: ana.id },
  )
  passo('dono move nota para lixeira', lixeira?.status === STATUS_NOTA.LIXEIRA)

  const copia = await notasProtegidasStore.duplicarComoUsuario(privada.id, { usuarioId: bia.id })
  passo('quem visualiza pode duplicar', copia?.ownerId === bia.id && copia.titulo === 'Privada - copia')

  const transferida = await notasProtegidasStore.transferirComoUsuario(
    privada.id,
    bia.id,
    { usuarioId: admin.id },
  )
  passo('admin transfere titularidade', transferida?.ownerId === bia.id)
  passo(
    'admin continua sem editar apos transferencia',
    await falhouComAcessoNegado(() =>
      notasProtegidasStore.atualizarComoUsuario(privada.id, { conteudo: 'admin editou' }, { usuarioId: admin.id }),
    ),
  )
  const editadaPelaNovaDona = await notasProtegidasStore.atualizarComoUsuario(
    privada.id,
    { conteudo: 'conteudo da nova dona' },
    { usuarioId: bia.id },
  )
  passo('novo dono edita apos transferencia', editadaPelaNovaDona?.conteudo === 'conteudo da nova dona')

  console.log(`\nOPERACOES DE NOTA OK | ${passos} passos`)
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
