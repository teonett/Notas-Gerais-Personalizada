import { useEffect, useMemo, useState } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import React from 'react'
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import { idDeUrlDeAnexo } from '../../domain'
import { anexosStore, urlDeBlobAnexo } from '../repositorios'
import { logger } from '../errors'
import { useMapaDeLinks } from '../grafo/useMapaDeLinks'
import { pluginLinksInternos } from '../grafo/markdown-links'
import { DiagramaMermaid } from './DiagramaMermaid'

interface MarkdownPreviewProps {
  conteudo: string
  resumo?: boolean
}

interface NoIgnorar {
  node?: unknown
}

function ImagemMarkdown({
  src,
  alt,
  node: _node,
  ...rest
}: ComponentPropsWithoutRef<'img'> & NoIgnorar) {
  const idAnexo = src !== undefined ? idDeUrlDeAnexo(src) : null
  const [url, setUrl] = useState<string | null>(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (idAnexo === null) {
      return
    }
    let ativo = true
    anexosStore
      .obter(idAnexo)
      .then((anexo) => {
        if (!ativo || anexo === undefined) {
          return
        }
        if (!anexo.mime.startsWith('image/')) {
          setFalhou(true)
          return
        }
        setUrl(urlDeBlobAnexo(anexo))
      })
      .catch(() => {
        logger.aviso('Falha ao carregar imagem de anexo.')
      })
    return () => {
      ativo = false
    }
  }, [idAnexo])

  if (idAnexo === null || (falhou && url === null)) {
    return <img src={src} alt={alt ?? ''} {...rest} />
  }

  if (url === null) {
    return null
  }

  return <img src={url} alt={alt ?? ''} {...rest} />
}

function LinkMarkdown({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  if (href?.startsWith('/notas/')) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    )
  }
  return <a href={href} {...rest}>{children}</a>
}

function extrairCodigoMermaid(filhos: ReactNode): string | null {
  if (!React.isValidElement(filhos)) {
    return null
  }
  const props = filhos.props as { className?: string; children?: ReactNode } | undefined
  if (props === undefined || typeof props.className !== 'string') {
    return null
  }
  if (!props.className.includes('language-mermaid')) {
    return null
  }
  return typeof props.children === 'string' ? props.children : ''
}

function BlocoPre({ children, node: _node, ...rest }: ComponentPropsWithoutRef<'pre'> & NoIgnorar) {
  const codigoMermaid = extrairCodigoMermaid(children)
  if (codigoMermaid !== null) {
    return <DiagramaMermaid key={codigoMermaid} codigo={codigoMermaid} />
  }
  return <pre {...rest}>{children}</pre>
}

export function MarkdownPreview({ conteudo, resumo = false }: MarkdownPreviewProps) {
  const grafo = useMapaDeLinks()

  const pluginWikilinks = useMemo(() => {
    const resolver = grafo === null ? null : grafo.resolverPorTitulo
    return pluginLinksInternos(resolver ?? (() => null))
  }, [grafo])

  if (conteudo.trim() === '') {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        Nenhum conteúdo para exibir.
      </p>
    )
  }

  return (
    <div
      data-resumo={resumo ? 'true' : undefined}
      className="prose prose-sm prose-slate max-w-none break-words dark:prose-invert prose-headings:scroll-mt-20 prose-pre:rounded-xl prose-a:text-indigo-600 dark:prose-a:text-indigo-400 [&[data-resumo]]:line-clamp-3 [&[data-resumo]]:text-sm"
    >
      <Markdown
        remarkPlugins={[remarkGfm, pluginWikilinks]}
        components={{
          a: LinkMarkdown,
          pre: BlocoPre,
          ...(resumo ? {} : { img: ImagemMarkdown }),
        }}
      >
        {conteudo}
      </Markdown>
    </div>
  )
}