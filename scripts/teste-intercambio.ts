import { IDBFactory } from 'fake-indexeddb'
import { FORMATO_NOTA, STATUS_NOTA } from '../src/domain/tipos'
import {
  dividirNotasDoArquivo,
  montarTextoDeNotas,
  tituloDoArquivo,
} from '../src/core/dados/intercambio'
import type { NotaEmArquivo } from '../src/core/dados/intercambio'
import {
  importarDadosJson,
  montarJson,
  parseJsonIntercambio,
} from '../src/core/dados/json'
import {
  exportarBackupFiel,
  importarBackupFiel,
  NOME_MANIFESTO_BACKUP_FIEL,
} from '../src/core/dados/backup-fiel'
import { CHAVES_SINCRONIZACAO } from '../src/sync/contrato'
import { anexosStore } from '../src/core/repositorios/anexos'
import { cadernosStore } from '../src/core/repositorios/cadernos'
import { notasStore } from '../src/core/repositorios/notas'
import { tagsStore } from '../src/core/repositorios/tags'
import {
  fecharBancoDeDados,
  gravarItem,
  gravarItensEmTransacao,
  lerItem,
  listarEntradas,
} from '../src/core/storage/idb'

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

function notasDoArquivo(extensao: string, texto: string): NotaEmArquivo[] | null {
  return dividirNotasDoArquivo(extensao, texto)
}

function notaEm(titulo: string, conteudo: string, formato: 'MARKDOWN' | 'HTML' = 'MARKDOWN') {
  return { titulo, conteudo, formato }
}

function arquivoBackup(nome: string, conteudo: Blob | string): File {
  return new File([conteudo], nome)
}

const dupla = [
  notaEm('Primeira nota', 'isso é o conteúdo **da primeira**.', FORMATO_NOTA.MARKDOWN),
  notaEm('Segunda nota', 'outro conteúdo com lista:\n\n- item um\n- item dois', FORMATO_NOTA.MARKDOWN),
]

const textoMd = montarTextoDeNotas(dupla, FORMATO_NOTA.MARKDOWN)
const divididoMd = notasDoArquivo('md', textoMd)

passo('export markdown marca cada nota com heading', textoMd.split('\n').filter((l) => l.trim().startsWith('# ')).length === 2)
passo('import markdown separa as duas notas', divididoMd?.length === 2)
passo('import markdown preserva títulos', divididoMd?.[0].titulo === 'Primeira nota' && divididoMd?.[1].titulo === 'Segunda nota')
passo(
  'import markdown preserva conteúdo interno',
  divididoMd?.[1].conteudo.includes('item um') === true && divididoMd?.[1].conteudo.includes('- item dois') === true,
)
passo('import markdown não vaza o separador', divididoMd?.every((n) => !n.conteudo.includes('---')) === true)
passo('import markdown não deixa heading no conteúdo', divididoMd?.[0].conteudo.startsWith('# ') === false)

const textoMdUnica = 'um texto sem separador\n\ncontinua aqui'
passo('markdown sem separador volta como nota única', notasDoArquivo('md', textoMdUnica) === null)

const textoMdIncompleto = '# Com título\n\nconteudo\n\n---\n\nsem heading aqui\n\n---\n\n# Com outro título\n\nconteudo 2'
passo('markdown com separador mas bloco sem heading não divide', notasDoArquivo('md', textoMdIncompleto) === null)

const textoMdComSeparadorInterno =
  '# Primeira\n\nantes\n\n--------------------------------------------\n\ndepois\n\n---\n\n# Segunda\n\ncorpo'
const divididoMdComSeparadorInterno = notasDoArquivo('md', textoMdComSeparadorInterno)
passo('markdown ignora linhas longas de hifen como separador', divididoMdComSeparadorInterno?.length === 2)
passo(
  'markdown preserva linhas longas de hifen no conteudo',
  divididoMdComSeparadorInterno?.[0].conteudo.includes('--------------------------------------------') === true,
)

const comSubtitulo = montarTextoDeNotas(
  [notaEm('Pai', 'antes\n\n## Subseção\n\num detalhe')],
  FORMATO_NOTA.MARKDOWN,
)
const divididoSubtitulo = notasDoArquivo('md', comSubtitulo)
passo('markdown com subseção continua única nota', divididoSubtitulo === null)
passo('markdown com subseção preserva o ## no conteúdo', notasDoArquivo('md', `# Outra\n\nconteudo\n\n---\n\n${comSubtitulo}`)?.[1].conteudo.includes('## Subseção') === true)

const textoTxt = montarTextoDeNotas(dupla, FORMATO_NOTA.TXT)
const divididoTxt = notasDoArquivo('txt', textoTxt)

passo('export txt marca cada nota com delimitador', textoTxt.split('\n').filter((l) => l.trim().startsWith('== ')).length === 2)
passo('import txt separa as duas notas', divididoTxt?.length === 2)
passo('import txt preserva títulos', divididoTxt?.[0].titulo === 'Primeira nota' && divididoTxt?.[1].titulo === 'Segunda nota')
passo('import txt preserva conteúdo', divididoTxt?.[0].conteudo === 'isso é o conteúdo **da primeira**.')
passo('txt sem delimitador volta como nota única', notasDoArquivo('txt', 'só um texto puro sem marcas') === null)

const notasHtml = [
  notaEm('Encapsulado', 'texto com **negrito** e [link](https://exemplo.com).', FORMATO_NOTA.MARKDOWN),
  notaEm('Com entidade', 'um `código` inline.', FORMATO_NOTA.MARKDOWN),
]
const textoHtml = montarTextoDeNotas(notasHtml, FORMATO_NOTA.HTML)
const divididoHtml = notasDoArquivo('html', textoHtml)

passo('export html gera um artigo por nota', textoHtml.split('<article>').length - 1 === 2)
passo('import html separa as duas notas', divididoHtml?.length === 2)
passo('import html preserva títulos', divididoHtml?.[0].titulo === 'Encapsulado' && divididoHtml?.[1].titulo === 'Com entidade')
passo('import html converte o corpo para markdown', divididoHtml?.[0].conteudo.includes('**negrito**') === true && divididoHtml?.[0].conteudo.includes('https://exemplo.com') === true)
passo('html sem artigo volta como nota única', notasDoArquivo('html', '<p>sem artigo aqui</p>') === null)

const comAmpersand = montarTextoDeNotas([notaEm('P & C', 'corpo')], FORMATO_NOTA.HTML)
passo('titulo com & é escapado no html', comAmpersand.includes('>P &amp; C</h1>') === true)
passo('titulo com & volta legível na importação', notasDoArquivo('html', comAmpersand)?.[0].titulo === 'P & C')

passo('tituloDoArquivo remove a extensão', tituloDoArquivo('minha-nota.md') === 'minha-nota')
passo('tituloDoArquivo usa padrão para nome vazio', tituloDoArquivo('.md') === 'Sem título')
passo('tituloDoArquivo limita o tamanho', tituloDoArquivo(`${'a'.repeat(300)}.md`).length === 200)

const notasVazias = montarTextoDeNotas(
  [notaEm('Só título', ''), notaEm('Outra', 'corpo')],
  FORMATO_NOTA.MARKDOWN,
)
const divididoVazias = notasDoArquivo('md', notasVazias)
passo('nota sem conteúdo também separa', divididoVazias?.length === 2 && divididoVazias?.[0].conteudo === '')

console.log(`\n${passos} passos de intercâmbio passaram.`)

// ---------- intercâmbio JSON (cadernos, tags e notas) ----------

const g = globalThis as typeof globalThis & {
  window?: unknown
  indexedDB?: unknown
}
g.window = globalThis
g.indexedDB = new IDBFactory()

async function mainJson(): Promise<void> {
  const casa = await cadernosStore.criar('Casa')
  const filhos = await cadernosStore.criar('Filhos', casa.id)
  const trabalho = await cadernosStore.criar('Trabalho')
  const importante = await tagsStore.criar('importante')
  const urgente = await tagsStore.criar('urgente')

  const notaComAnexo = await notasStore.criar({
    titulo: 'Nota com anexo',
    conteudo: 'tem arquivo vinculado',
    formato: FORMATO_NOTA.MARKDOWN,
    cadernoId: casa.id,
    tagIds: [importante.id],
  })
  const anexoOriginal = await anexosStore.criar({
    notaId: notaComAnexo.id,
    nome: 'comprovante:final?.txt',
    mime: 'text/plain',
    dados: new Blob(['conteudo do anexo'], { type: 'text/plain' }),
  })
  await gravarItem('meta', 'valor local', 'teste:meta')
  await gravarItem('sincronizacao', 'dispositivo-antigo', CHAVES_SINCRONIZACAO.dispositivo)
  await gravarItem(
    'sincronizacao',
    JSON.stringify({ carimbo: 1, dispositivo: 'dispositivo-antigo' }),
    CHAVES_SINCRONIZACAO.cursor,
  )
  await gravarItem(
    'sincronizacao',
    '2026-01-01T00:00:00.000Z',
    CHAVES_SINCRONIZACAO.ultimaSincronizacao,
  )
  await gravarItem(
    'sincronizacao',
    'valor pendente antigo',
    `${CHAVES_SINCRONIZACAO.prefixoPendente}nota:${notaComAnexo.id}`,
  )

  await notasStore.criar({
    titulo: 'Plano da casa',
    conteudo: 'orçar pintura da cozinha',
    formato: FORMATO_NOTA.MARKDOWN,
    cadernoId: filhos.id,
    tagIds: [importante.id],
  })
  await notasStore.criar({
    titulo: 'Reunião de quinta',
    conteudo: 'pauta do projeto',
    formato: FORMATO_NOTA.MARKDOWN,
    cadernoId: trabalho.id,
    tagIds: [urgente.id],
    status: STATUS_NOTA.ARQUIVADA,
    favorita: true,
    fixada: true,
  })

  const entradas = await notasStore.listarTodas()
  const todosOsCadernos = await cadernosStore.listarTodas()
  const todasAsTags = await tagsStore.listarTodas()

  const textoJson = montarJson(todosOsCadernos, todasAsTags, entradas, 'TUDO')
  const dados = parseJsonIntercambio(textoJson)

  passo('json export completo tem os 3 cadernos', dados?.cadernos.length === 3)
  passo('json export completo tem as 2 tags', dados?.tags.length === 2)
  passo('json export completo tem as 3 notas', dados?.notas.length === 3)

  const nota0 = dados?.notas.find((n) => n.titulo === 'Plano da casa')
  passo('json preserva caderno da nota', nota0?.caderno === 'Filhos')
  passo('json preserva tags da nota', nota0?.tags.includes('importante') === true)

  const nota1 = dados?.notas.find((n) => n.titulo === 'Reunião de quinta')
  passo(
    'json preserva caderno por nome',
    nota1?.caderno === 'Trabalho',
  )
  passo(
    'json preserva status, favorita e fixada',
    nota1?.status === 'ARQUIVADA' && nota1?.favorita === true && nota1?.fixada === true,
  )

  const nomesJson = (dados?.cadernos ?? []).map((c) => c.nome)
  passo('pai vem antes do filho no caderno json', nomesJson.indexOf('Casa') < nomesJson.indexOf('Filhos'))
  const filhoJson = dados?.cadernos.find((c) => c.nome === 'Filhos')
  passo('pai é exportado pelo nome', filhoJson?.pai === 'Casa')

  if (dados !== null) {
    const antes = await notasStore.listarTodas()
    const resumo = await importarDadosJson(dados)
    const depois = await notasStore.listarTodas()
    const novas = depois.filter((n) => !antes.some((o) => o.id === n.id))

    passo(
      'import reutiliza cadernos e tags existentes',
      resumo.cadernosCriados === 0 && resumo.tagsCriadas === 0,
    )
    passo('import adiciona as notas do arquivo', resumo.notasCriadas === 3)
    passo(
      'import não duplica cadernos nem tags',
      (await cadernosStore.listarTodas()).length === 3 && (await tagsStore.listarTodas()).length === 2,
    )
    passo(
      'import reaplica caderno e tags nas notas novas',
      novas.length === 3 && novas.every((n) => n.cadernoId !== null && n.tagIds.length === 1),
    )
    const idsCadernos = new Map((await cadernosStore.listarTodas()).map((c) => [c.nome, c.id]))
    passo(
      'import restaura o pai aninhado do caderno',
      filhoJson?.nome === undefined ||
        (await cadernosStore.obter(idsCadernos.get('Filhos') ?? '') )?.paiId ===
          idsCadernos.get('Casa'),
    )
    passo(
      'import restaura status e favorita',
      novas.every(
        (n) =>
          (n.titulo === 'Reunião de quinta' && n.status === 'ARQUIVADA' && n.favorita) ||
          ((n.titulo === 'Plano da casa' || n.titulo === 'Nota com anexo') &&
            n.status === 'ATIVA'),
      ),
    )
  }

  const soCadernos = parseJsonIntercambio(
    montarJson(todosOsCadernos, todasAsTags, entradas, 'CADERNOS'),
  )
  passo(
    'escopo cadernos traz só cadernos',
    soCadernos?.cadernos.length === 3 &&
      (soCadernos?.tags.length ?? -1) === 0 &&
      (soCadernos?.notas.length ?? -1) === 0,
  )

  const soNotas = parseJsonIntercambio(montarJson(todosOsCadernos, todasAsTags, entradas, 'NOTAS'))
  passo(
    'escopo notas traz só notas sem vínculos',
    soNotas?.notas.length === 3 &&
      soNotas?.notas.every((n) => n.caderno === null && n.tags.length === 0),
  )

  passo('json inválido é rejeitado', parseJsonIntercambio('isto não é json') === null)
  passo('json sem versão 1 é rejeitado', parseJsonIntercambio('{"versao":2,"notas":[]}') === null)
  passo(
    'json incompleto usa seções vazias',
    parseJsonIntercambio('{"versao":1}')?.cadernos.length === 0,
  )

  const backup = await exportarBackupFiel()
  const anexoNoManifesto = backup.manifesto.registros.anexos.find((a) => a.id === anexoOriginal.id)

  passo(
    'backup fiel inclui notas com IDs originais',
    backup.manifesto.registros.notas.some((n) => n.id === notaComAnexo.id),
  )
  passo('backup fiel inclui anexo no manifesto', anexoNoManifesto !== undefined)
  passo(
    'backup fiel separa os blobs de anexo',
    anexoNoManifesto !== undefined && backup.anexos.some((a) => a.nome === anexoNoManifesto.arquivo),
  )
  passo(
    'backup fiel sanitiza nome do arquivo de anexo',
    anexoNoManifesto?.arquivo.includes(':') === false &&
      anexoNoManifesto?.arquivo.includes('?') === false,
  )
  passo(
    'backup fiel inclui meta local',
    backup.manifesto.registros.meta.some((m) => m.chave === 'teste:meta'),
  )
  passo(
    'backup fiel inclui sincronizacao',
    backup.manifesto.registros.sincronizacao.some((s) => s.chave === CHAVES_SINCRONIZACAO.dispositivo) &&
      backup.manifesto.registros.sincronizacao.some((s) =>
        s.chave.startsWith(CHAVES_SINCRONIZACAO.prefixoRegistro),
      ),
  )

  await fecharBancoDeDados()
  g.indexedDB = new IDBFactory()

  const manifestoArquivo = arquivoBackup(
    NOME_MANIFESTO_BACKUP_FIEL,
    JSON.stringify(backup.manifesto),
  )
  const anexosArquivos = backup.anexos.map((anexo) => arquivoBackup(anexo.nome, anexo.dados))

  const manifestoComReferenciaQuebrada = JSON.parse(JSON.stringify(backup.manifesto)) as typeof backup.manifesto
  manifestoComReferenciaQuebrada.registros.notas[0].cadernoId = 'caderno-inexistente'
  passo(
    'backup fiel rejeita manifesto com referencia quebrada',
    await importarBackupFiel(
      [arquivoBackup(NOME_MANIFESTO_BACKUP_FIEL, JSON.stringify(manifestoComReferenciaQuebrada))],
      { restaurarSync: true },
    ) === null,
  )

  const manifestoComIdDuplicado = JSON.parse(JSON.stringify(backup.manifesto)) as typeof backup.manifesto
  manifestoComIdDuplicado.registros.notas[1].id = manifestoComIdDuplicado.registros.notas[0].id
  passo(
    'backup fiel rejeita manifesto com ID duplicado',
    await importarBackupFiel(
      [arquivoBackup(NOME_MANIFESTO_BACKUP_FIEL, JSON.stringify(manifestoComIdDuplicado))],
      { restaurarSync: true },
    ) === null,
  )
  passo(
    'backup fiel nao grava manifesto estruturalmente invalido',
    (await notasStore.obter(notaComAnexo.id)) === undefined &&
      (await cadernosStore.obter(casa.id)) === undefined,
  )

  try {
    await gravarItensEmTransacao([
      {
        loja: 'cadernos',
        valor: {
          id: 'tx-caderno',
          nome: 'Transacao',
          paiId: null,
          criadaEm: new Date().toISOString(),
        },
      },
      {
        loja: 'notas',
        valor: {
          titulo: 'sem id para forcar falha',
        },
      },
    ])
  } catch {
    // A falha intencional deve abortar toda a transacao.
  }
  passo(
    'storage transacional reverte lote quando uma gravacao falha',
    (await cadernosStore.obter('tx-caderno')) === undefined,
  )

  const restauracaoIncompleta = await importarBackupFiel([manifestoArquivo], {
    restaurarSync: true,
  })
  passo(
    'backup fiel bloqueia restauracao quando anexo esta ausente',
    (restauracaoIncompleta?.anexosAusentes ?? 0) > 0,
  )
  passo(
    'backup fiel nao grava registros quando anexo esta ausente',
    (await notasStore.obter(notaComAnexo.id)) === undefined &&
      (await cadernosStore.obter(casa.id)) === undefined &&
      (await lerItem<string>('meta', 'teste:meta')) === undefined,
  )

  await fecharBancoDeDados()
  g.indexedDB = new IDBFactory()

  const restauracaoSemSync = await importarBackupFiel([manifestoArquivo, ...anexosArquivos], {
    restaurarSync: false,
  })
  const anexoRestaurado = await anexosStore.obter(anexoOriginal.id)

  passo(
    'backup fiel restaura notas preservando ID',
    (await notasStore.obter(notaComAnexo.id))?.id === notaComAnexo.id,
  )
  passo(
    'backup fiel restaura cadernos preservando ID',
    (await cadernosStore.obter(casa.id))?.id === casa.id,
  )
  passo(
    'backup fiel restaura tags preservando ID',
    (await tagsStore.obter(importante.id))?.id === importante.id,
  )
  passo(
    'backup fiel restaura anexo preservando metadados',
    anexoRestaurado?.nome === anexoOriginal.nome && anexoRestaurado?.notaId === notaComAnexo.id,
  )
  passo('backup fiel restaura bytes do anexo', await anexoRestaurado?.dados.text() === 'conteudo do anexo')
  passo('backup fiel restaura meta', await lerItem<string>('meta', 'teste:meta') === 'valor local')
  passo(
    'backup fiel nao restaura sync sem opcao explicita',
    (await listarEntradas<string>('sincronizacao')).every((s) => s.chave !== 'teste:sync'),
  )
  passo(
    'backup fiel reporta restauracao sem sync',
    restauracaoSemSync?.syncCriadas === 0 && (restauracaoSemSync?.notasCriadas ?? 0) >= 3,
  )

  await fecharBancoDeDados()
  g.indexedDB = new IDBFactory()

  const restauracaoComSync = await importarBackupFiel([manifestoArquivo, ...anexosArquivos], {
    restaurarSync: true,
  })
  passo(
    'backup fiel restaura sync quando solicitado',
    (await lerItem<string>(
      'sincronizacao',
      `${CHAVES_SINCRONIZACAO.prefixoRegistro}nota:${notaComAnexo.id}`,
    )) !== undefined,
  )
  passo(
    'backup fiel nao restaura estado volatil de sync',
    (await lerItem<string>('sincronizacao', CHAVES_SINCRONIZACAO.dispositivo)) === undefined &&
      (await lerItem<string>('sincronizacao', CHAVES_SINCRONIZACAO.cursor)) === undefined &&
      (await lerItem<string>('sincronizacao', CHAVES_SINCRONIZACAO.ultimaSincronizacao)) === undefined &&
      (await listarEntradas<string>('sincronizacao')).every(
        (s) => !s.chave.startsWith(CHAVES_SINCRONIZACAO.prefixoPendente),
      ),
  )
  passo('backup fiel reporta restauracao com sync', (restauracaoComSync?.syncCriadas ?? 0) > 0)

  console.log(`\nTotal: ${passos} passos de intercâmbio (texto e JSON) passaram.`)
}
void mainJson()
