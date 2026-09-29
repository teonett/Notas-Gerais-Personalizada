import { htmlParaMarkdown, markdownParaHtml } from '../markdown'
import { FORMATO_NOTA } from '../../domain'
import type { FormatoNota } from '../../domain'
import { LIMITS } from '../../config/limits'

export interface NotaEmArquivo {
  titulo: string
  conteudo: string
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function textoSimplesExportado(nota: { conteudo: string; formato: FormatoNota }): string {
  if (nota.formato === FORMATO_NOTA.HTML) {
    return nota.conteudo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return nota.conteudo
}

export function montarTextoDeNotas(
  notas: Array<{ titulo: string; conteudo: string; formato: FormatoNota }>,
  formatoExportacao: FormatoNota,
): string {
  const linhas: string[] = []
  for (const nota of notas) {
    const titulo = nota.titulo.trim() === '' ? 'Sem título' : nota.titulo.trim()
    if (formatoExportacao === 'MARKDOWN') {
      linhas.push(`# ${titulo}`, '', nota.conteudo.trim(), '', '---', '')
    } else if (formatoExportacao === 'TXT') {
      linhas.push(`== ${titulo} ==`, '', textoSimplesExportado(nota), '', '')
    } else {
      const corpo =
        nota.formato === FORMATO_NOTA.HTML
          ? nota.conteudo
          : markdownParaHtml(nota.conteudo)
      linhas.push(`<article><h1>${escaparHtml(titulo)}</h1>${corpo}</article>`)
    }
  }
  return linhas.join('\n')
}

function notaDeBlocoMarkdown(bloco: string): NotaEmArquivo | null {
  const linhas = bloco.split('\n')
  const indice = linhas.findIndex((linha) => linha.trim() !== '')
  if (indice === -1) return null
  const primeira = linhas[indice].trim()
  const cabecalho = primeira.match(/^#\s+(.+)$/)
  if (cabecalho === null) return null
  return {
    titulo: cabecalho[1].trim(),
    conteudo: linhas.slice(indice + 1).join('\n').trim(),
  }
}

function dividirNotasMarkdown(texto: string): NotaEmArquivo[] | null {
  const blocos = texto
    .split(/^---\s*$/m)
    .map((bloco) => bloco.trim())
    .filter((bloco) => bloco !== '')
  if (blocos.length <= 1) return null
  const notas: NotaEmArquivo[] = []
  for (const bloco of blocos) {
    const nota = notaDeBlocoMarkdown(bloco)
    if (nota === null) return null
    notas.push(nota)
  }
  return notas
}

function dividirNotasTxt(texto: string): NotaEmArquivo[] | null {
  const notas: NotaEmArquivo[] = []
  let tituloAtual: string | null = null
  const corpoAtual: string[] = []
  let viuMarca = false
  for (const linha of texto.split(/\r?\n/)) {
    const marca = linha.trim().match(/^==\s*(.+?)\s*==$/)
    if (marca !== null) {
      viuMarca = true
      if (tituloAtual !== null) {
        notas.push({ titulo: tituloAtual, conteudo: corpoAtual.join('\n').trim() })
        corpoAtual.length = 0
      }
      tituloAtual = marca[1].trim()
      continue
    }
    if (tituloAtual === null) {
      if (linha.trim() !== '') return null
      continue
    }
    corpoAtual.push(linha)
  }
  if (!viuMarca) return null
  if (tituloAtual !== null) {
    notas.push({ titulo: tituloAtual, conteudo: corpoAtual.join('\n').trim() })
  }
  return notas.length > 0 ? notas : null
}

function dividirNotasHtml(texto: string): NotaEmArquivo[] | null {
  const artigos: string[] = []
  const reArtigo = /<article(?:\s[^>]*)?>([\s\S]*?)<\/article>/gi
  let encontrado: RegExpExecArray | null
  while ((encontrado = reArtigo.exec(texto)) !== null) {
    const conteudo = encontrado[1].trim()
    if (conteudo !== '') artigos.push(conteudo)
  }
  if (artigos.length === 0) return null
  const notas: NotaEmArquivo[] = []
  for (const corpo of artigos) {
    const cabecalho = corpo.match(/^<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i)
    if (cabecalho === null) return null
    const titulo = decodificarEntidades(cabecalho[1].replace(/<[^>]+>/g, '').trim())
    const resto = corpo.replace(/^<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/i, '').trim()
    notas.push({ titulo, conteudo: htmlParaMarkdown(resto) })
  }
  return notas
}

export function dividirNotasDoArquivo(extensao: string, texto: string): NotaEmArquivo[] | null {
  if (extensao === 'md' || extensao === 'markdown') return dividirNotasMarkdown(texto)
  if (extensao === 'txt') return dividirNotasTxt(texto)
  if (extensao === 'html' || extensao === 'htm') return dividirNotasHtml(texto)
  return null
}

export function tituloDoArquivo(nomeArquivo: string): string {
  const semExtensao = nomeArquivo.replace(/\.[^.]+$/, '').trim()
  const limitado = semExtensao.slice(0, LIMITS.tituloNotaMaxCaracteres).trim()
  return limitado === '' ? 'Sem título' : limitado
}
