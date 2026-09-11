import { FORMATO_NOTA } from '../src/domain/tipos'
import {
  dividirNotasDoArquivo,
  montarTextoDeNotas,
  tituloDoArquivo,
} from '../src/core/dados/intercambio'
import type { NotaEmArquivo } from '../src/core/dados/intercambio'

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