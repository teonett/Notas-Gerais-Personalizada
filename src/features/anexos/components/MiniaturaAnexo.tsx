import { memo } from 'react'
import { FileText } from 'lucide-react'
import type { Anexo } from '../../../domain'
import { formatarTamanho, urlDeBlobAnexo } from '../../../core'

interface MiniaturaAnexoProps {
  anexo: Anexo
}

export const MiniaturaAnexo = memo(function MiniaturaAnexo({ anexo }: MiniaturaAnexoProps) {
  if (!anexo.mime.startsWith('image/')) {
    return null
  }

  return (
    <img
      src={urlDeBlobAnexo(anexo)}
      alt={anexo.nome}
      title={`${anexo.nome} (${formatarTamanho(anexo.tamanho)})`}
      className="h-full w-full object-cover"
    />
  )
})

export function RotuloArquivo({ anexo }: MiniaturaAnexoProps) {
  return (
    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
      <FileText className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate text-sm">{anexo.nome}</span>
    </div>
  )
}