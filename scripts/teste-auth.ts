import { IDBFactory } from 'fake-indexeddb'
import { AppError, ERROR_CODES } from '../src/core/errors'
import type { Nota } from '../src/domain'
import { listarContas } from '../src/core/auth/contas'
import {
  bloquear,
  criarContaLocal,
  desbloquear,
  estaDesbloqueada,
  obterChaveDaSessao,
  removerConta,
} from '../src/core/auth/sessao'
import { haDadosNoBancoAtual, migrarDadosLegados } from '../src/core/auth/legado'
import {
  abrirBancoPeloNome,
  gravarMeta,
  lerItem,
  lerMeta,
  nomeDoBancoAtivo,
} from '../src/core/storage/idb'
import { comTransacao, requisicaoParaPromessa } from '../src/core/repositorios/base'
import { BANCO, type StoreName } from '../src/core/storage/config'
import { notasStore } from '../src/core/repositorios/notas'
import { anexosStore } from '../src/core/repositorios/anexos'
import {
  cifrarRegistro,
  decifrarRegistro,
  ehEnvelope,
} from '../src/core/vault/cifrar'
import { AUT } from '../src/core/auth/constantes'

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

async function falhouCom(acao: () => Promise<unknown>, codigo: string): Promise<boolean> {
  try {
    await acao()
    return false
  } catch (falha: unknown) {
    return falha instanceof AppError && falha.codigo === codigo
  }
}

async function registrosBrutosDaLoja(loja: StoreName): Promise<unknown[]> {
  const banco = await abrirBancoPeloNome(nomeDoBancoAtivo())
  return comTransacao(banco, loja, 'readonly', async (transacao) =>
    requisicaoParaPromessa(
      transacao.objectStore(loja).getAll() as IDBRequest<unknown[]>,
    ),
  )
}

async function main() {
  const contasIniciais = await listarContas()
  passo('nenhuma conta local criada ainda', contasIniciais.length === 0)

  const legada = await notasStore.criar({
    titulo: 'Nota antiga',
    conteudo: 'conteudo legado sigiloso',
    formato: 'MARKDOWN',
  })
  passo('dados legados são gravados fora do cofre', (await haDadosNoBancoAtual()) === true)

  const ana = await criarContaLocal('ana', 'senha-forte-123')
  passo('criar conta abre o cofre', estaDesbloqueada())
  passo('conta fica registrada', (await listarContas()).length === 1)
  passo('banco do cofre usa prefixo da conta', nomeDoBancoAtivo() === `${AUT.prefixoBancoCofre}${ana.id}`)
  passo('cofre novo começa vazio', (await notasStore.listarTodas()).length === 0)

  const migracao = await migrarDadosLegados()
  passo('migração copia a nota legada', migracao.contagens.notas === 1)
  const migrada = await notasStore.obter(legada.id)
  passo(
    'nota migrada pode ser lida decifrada',
    migrada?.titulo === 'Nota antiga' && migrada.conteudo === 'conteudo legado sigiloso',
  )
  passo('após migrar, o cofre tem exatamente a nota antiga', (await notasStore.listarTodas()).length === 1)

  const brutosMigrados = await registrosBrutosDaLoja(BANCO.stores.notas)
  const envelopeMigrado = brutosMigrados.find(ehEnvelope)
  passo('dados no cofre ficam cifrados em envelope', envelopeMigrado !== undefined)
  passo(
    'texto puro não vaza no banco',
    envelopeMigrado !== undefined &&
      !JSON.stringify(envelopeMigrado).includes('Nota antiga') &&
      !JSON.stringify(envelopeMigrado).includes('conteudo legado sigiloso'),
  )

  const nova = await notasStore.criar({
    titulo: 'Nota do cofre',
    conteudo: 'segredo da conta ana',
    formato: 'MARKDOWN',
  })
  const novaEmBruto = (await registrosBrutosDaLoja(BANCO.stores.notas)).find((r) =>
    ehEnvelope(r),
  )
  passo('nota criada já nasce cifrada', cameraEnvelopeEContemNova(novaEmBruto, nova))

  await bloquear()
  passo('bloquear fecha a sessão', !estaDesbloqueada())
  passo(
    'ler dado bloqueado lança erro de sessão',
    await falhouCom(() => lerItem('notas', nova.id), ERROR_CODES.AUTH.SESSAO_BLOQUEADA),
  )
  passo(
    'senha errada é rejeitada',
    await falhouCom(() => desbloquear('ana', 'senha-errada-xxx'), ERROR_CODES.AUTH.SENHA_INVALIDA),
  )
  await desbloquear('ana', 'senha-forte-123')
  passo('senha correta reabre o cofre', estaDesbloqueada())
  const relida = await notasStore.obter(nova.id)
  passo('dados continuam íntegros após reabrir', relida?.conteudo === 'segredo da conta ana')

  await notasStore.criar({
    titulo: 'Nota atualizada',
    conteudo: 'primeira versão',
    formato: 'MARKDOWN',
  })
  const atualizada = await notasStore.atualizar(nova.id, { conteudo: 'segunda versão' })
  passo('atualizar nota decifra e grava de novo', atualizada?.conteudo === 'segunda versão')

  const blobTexto = 'ola anexo sigiloso'
  const anexo = await anexosStore.criar({
    notaId: nova.id,
    nome: 'arquivo.txt',
    mime: 'text/plain',
    dados: new Blob([blobTexto], { type: 'text/plain' }),
  })
  const lido = await anexosStore.obter(anexo.id)
  passo(
    'anexo com blob faz roundtrip decifrado',
    lido !== undefined && lido.dados instanceof Blob && (await lido.dados.text()) === blobTexto,
  )
  const brutosAnexos = await registrosBrutosDaLoja(BANCO.stores.anexos)
  passo('anexo também fica cifrado no banco', brutosAnexos.every(ehEnvelope))

  await bloquear()
  await criarContaLocal('bia', 'outra-senha-456')
  passo('segunda conta é isolada (sem notas)', (await notasStore.listarTodas()).length === 0)
  await notasStore.criar({
    titulo: 'Nota da bia',
    conteudo: 'segredo da conta bia',
    formato: 'MARKDOWN',
  })
  await bloquear()
  await desbloquear('ana', 'senha-forte-123')
  const notasDaAna = await notasStore.listarTodas()
  passo(
    'conta ana mantém suas notas isoladas',
    notasDaAna.length === 3 && notasDaAna.every((n) => n.conteudo !== 'segredo da conta bia'),
  )
  await bloquear()
  await desbloquear('bia', 'outra-senha-456')
  const notasDaBia = await notasStore.listarTodas()
  passo('conta bia vê apenas as próprias notas', notasDaBia.length === 1 && notasDaBia[0]?.conteudo === 'segredo da conta bia')

  await gravarMeta('thothnet:sincronizacaoUrl', 'https://exemplo.app')
  passo('meta fica cifrada', ehEnvelope((await registrosBrutosDaLoja(BANCO.stores.meta))[0]))
  passo('meta volta decifrada', (await lerMeta('thothnet:sincronizacaoUrl')) === 'https://exemplo.app')

  const chave = obterChaveDaSessao()
  passo('sessão expõe a chave para o transporte', chave !== null)
  if (chave !== null) {
    const protegido = await cifrarRegistro(chave, { texto: 'payload do servidor' })
    const restaurado = await decifrarRegistro<{ texto: string }>(chave, protegido)
    passo('envelope de transporte faz roundtrip', restaurado.texto === 'payload do servidor')
  }

  await bloquear()
  await desbloquear('ana', 'senha-forte-123')
  passo('voltar para ana continua funcional', (await notasStore.listarTodas()).length === 3)

  passo(
    'senha curta é recusada',
    await falhouCom(() => criarContaLocal('ze', 'abc'), ERROR_CODES.AUTH.SENHA_FRACA),
  )
  passo(
    'conta duplicada é recusada',
    await falhouCom(() => criarContaLocal('ana', 'outra-senha-789'), ERROR_CODES.AUTH.CONTA_JA_EXISTE),
  )
  passo('ao todo há duas contas', (await listarContas()).length === 2)

  await bloquear()
  const anasRestantes = (await listarContas()).filter((c) => c.nomeNorm === 'ana')
  passo('conta ana existe para remoção', anasRestantes.length === 1)
  const anaParaRemover = anasRestantes[0]
  await removerConta(anaParaRemover!.id)
  passo('conta removida sai da lista', (await listarContas()).length === 1)
  await desbloquear('bia', 'outra-senha-456')
  passo('conta bia sobrevive à remoção da ana', estaDesbloqueada())

  console.log(`\n${passos} passos de auth passaram.`)
}

function cameraEnvelopeEContemNova(valor: unknown, nota: Nota): boolean {
  return (
    ehEnvelope(valor) &&
    JSON.stringify(valor).includes('Nota do cofre') === false &&
    JSON.stringify(valor).includes(nota.id) === false
  )
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})