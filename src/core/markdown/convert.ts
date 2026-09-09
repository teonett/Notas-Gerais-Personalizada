import { marked } from 'marked'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

export function markdownParaHtml(markdown: string): string {
  return marked.parse(markdown, { async: false })
}

export function htmlParaMarkdown(html: string): string {
  return turndown.turndown(html)
}

export function textoSimples(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extrairTituloPadrao(markdown: string, padrao = 'Sem título'): string {
  const primeiraLinha = markdown
    .split('\n')
    .map((linha) => linha.trim())
    .find((linha) => linha.startsWith('#') && linha.length > 1)
  if (primeiraLinha === undefined) {
    return padrao
  }
  const titulo = primeiraLinha.replace(/^#+\s*/, '').trim()
  return titulo === '' ? padrao : titulo
}