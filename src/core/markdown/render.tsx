import { useEffect, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { anexosStore, urlDeBlobAnexo } from '../repositorios'
import { logger } from '../errors'
import { idDeUrlDeAnexo } from '../../domain'

interface MarkdownPreviewProps {
  conteudo: string
  resumo?: boolean
}

function ImagemMarkdown({
  src,
  alt,
  node: _node,
  ...rest
}: ComponentPropsWithoutRef<'img'> & { node?: unknown }) {
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

export function MarkdownPreview({ conteudo, resumo = false }: MarkdownPreviewProps) {
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
      <Markdown remarkPlugins={[remarkGfm]} components={resumo ? undefined : { img: ImagemMarkdown }}>
        {conteudo}
      </Markdown>
    </div>
  )
}