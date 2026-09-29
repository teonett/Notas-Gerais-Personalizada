import { IDBFactory } from 'fake-indexeddb'
import type { Nota } from '../src/domain'
import {
  NOME_USUARIO_PADRAO,
  STATUS_NOTA,
  STATUS_SUGESTAO_NOTA,
  TIPO_ALVO_PERMISSAO,
  USUARIO_PADRAO_ID,
  VISIBILIDADE_NOTA,
} from '../src/domain'
import { criarContaLocal } from '../src/core/auth/sessao'
import { BANCO } from '../src/core/storage/config'
import {
  abrirBancoPeloNome,
  excluirBancoPeloNome,
  fecharBancoDeDados,
  nomeDoBancoAtivo,
  prepararPersistencia,
} from '../src/core/storage/idb'
import { comTransacao, requisicaoParaPromessa } from '../src/core/repositorios/base'
import {
  gruposStore,
  membrosGruposStore,
  notasStore,
  permissoesNotaStore,
  sugestoesNotaStore,
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

async function criarBancoV4ComNotaLegada(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open(BANCO.nome, 4)
    req.onupgradeneeded = () => {
      const banco = req.result
      banco.createObjectStore(BANCO.stores.meta)
      const notas = banco.createObjectStore(BANCO.stores.notas, { keyPath: 'id' })
      notas.createIndex('status', 'status')
      notas.createIndex('alteradaEm', 'alteradaEm')
      notas.createIndex('criadaEm', 'criadaEm')
      notas.createIndex('favorita', 'favorita')
      notas.createIndex('fixada', 'fixada')
      notas.createIndex('cadernoId', 'cadernoId')
      notas.createIndex('tagIds', 'tagIds', { multiEntry: true })
      banco.createObjectStore(BANCO.stores.cadernos, { keyPath: 'id' })
      banco.createObjectStore(BANCO.stores.tags, { keyPath: 'id' })
      banco.createObjectStore(BANCO.stores.anexos, { keyPath: 'id' })
      banco.createObjectStore(BANCO.stores.sincronizacao)
    }
    req.onsuccess = () => {
      req.result.close()
      resolve()
    }
    req.onerror = () => reject(req.error)
  })

  const banco = await abrirBancoPeloNome(BANCO.nome)
  await comTransacao(banco, BANCO.stores.notas, 'readwrite', async (transacao) => {
    transacao.objectStore(BANCO.stores.notas).put({
      id: 'nota-legada',
      titulo: 'Legada',
      conteudo: 'conteudo anterior',
      formato: 'MARKDOWN',
      status: STATUS_NOTA.ATIVA,
      favorita: false,
      fixada: false,
      cadernoId: null,
      tagIds: ['tag-1'],
      criadaEm: '2026-09-12T00:00:00.000Z',
      alteradaEm: '2026-09-12T00:00:00.000Z',
      excluidaEm: null,
    } satisfies Nota)
  })
  await fecharBancoDeDados()
}

async function main() {
  await excluirBancoPeloNome(BANCO.nome)
  await criarBancoV4ComNotaLegada()

  const status = await prepararPersistencia()
  passo('persistencia abre banco migrado', status.suportado && !status.somenteLeitura)

  const bancoMigrado = await abrirBancoPeloNome(BANCO.nome)
  passo('versao do banco sobe para v5', bancoMigrado.version === BANCO.versao)
  passo(
    'stores multiusuario existem',
    bancoMigrado.objectStoreNames.contains(BANCO.stores.usuarios) &&
      bancoMigrado.objectStoreNames.contains(BANCO.stores.grupos) &&
      bancoMigrado.objectStoreNames.contains(BANCO.stores.permissoesNota) &&
      bancoMigrado.objectStoreNames.contains(BANCO.stores.sugestoesNota),
  )

  const migrada = await notasStore.obter('nota-legada')
  passo('nota legada preserva conteudo', migrada?.conteudo === 'conteudo anterior')
  passo('nota legada recebe dono padrao', migrada?.ownerId === USUARIO_PADRAO_ID)
  passo('nota legada nasce privada', migrada?.visibilidade === VISIBILIDADE_NOTA.PRIVADA)

  const usuarioPadrao = await usuariosStore.obter(USUARIO_PADRAO_ID)
  passo('usuario padrao e criado', usuarioPadrao?.nome === NOME_USUARIO_PADRAO)

  const usuario = await usuariosStore.criar({ nome: 'Bia' })
  const grupo = await gruposStore.criar({ nome: 'Produto', criadoPor: USUARIO_PADRAO_ID })
  const membro = await membrosGruposStore.adicionar({ grupoId: grupo.id, usuarioId: usuario.id })
  const permissao = await permissoesNotaStore.criar({
    notaId: 'nota-legada',
    alvoTipo: TIPO_ALVO_PERMISSAO.USUARIO,
    alvoId: usuario.id,
    podeSugerir: true,
  })
  const sugestao = await sugestoesNotaStore.criar({
    notaId: 'nota-legada',
    autorId: usuario.id,
    conteudoBase: 'conteudo anterior',
    conteudoSugerido: 'conteudo sugerido',
  })

  passo('repositorio de usuarios grava registro', (await usuariosStore.obter(usuario.id))?.nome === 'Bia')
  passo('repositorio de grupos grava registro', (await gruposStore.obter(grupo.id))?.nome === 'Produto')
  passo('repositorio de membros grava relacao', (await membrosGruposStore.obter(membro.id))?.grupoId === grupo.id)
  passo('repositorio de permissoes grava por nota', (await permissoesNotaStore.listarPorNota('nota-legada')).some((p) => p.id === permissao.id))
  passo('repositorio de sugestoes cria pendente', sugestao.status === STATUS_SUGESTAO_NOTA.PENDENTE)

  const copia = await notasStore.duplicar('nota-legada', { usuarioId: usuario.id })
  passo('duplicacao persistida muda dono', copia?.ownerId === usuario.id)
  passo('duplicacao persistida usa sufixo copia', copia?.titulo === 'Legada - copia')

  await excluirBancoPeloNome(BANCO.nome)
  const conta = await criarContaLocal('ana', 'senha-forte-123')
  const notaCofre = await notasStore.criar({
    titulo: 'Nota do cofre',
    conteudo: 'segredo',
    formato: 'MARKDOWN',
  })
  const usuarioDoCofre = await usuariosStore.obter(conta.id)
  passo('nota criada no cofre usa conta local como dono', notaCofre.ownerId === conta.id)
  passo('usuario do cofre usa nome da conta local', usuarioDoCofre?.nome === 'ana')
  passo('nome do banco ativo continua sendo cofre', nomeDoBancoAtivo().includes(conta.id))

  const bancoCofre = await abrirBancoPeloNome(nomeDoBancoAtivo())
  const brutos = await comTransacao(bancoCofre, BANCO.stores.usuarios, 'readonly', async (transacao) =>
    requisicaoParaPromessa(transacao.objectStore(BANCO.stores.usuarios).getAll()),
  )
  passo('usuarios no cofre ficam cifrados', JSON.stringify(brutos).includes('ana') === false)

  console.log(`\nPERSISTENCIA MULTIUSUARIO OK | ${passos} passos`)
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
