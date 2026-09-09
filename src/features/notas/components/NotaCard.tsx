import {
  Archive,
  ArchiveRestore,
  Pin,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui'
import { dataRelativa } from '../../../core'
import { textoSimples } from '../../../core/markdown'
import { FORMATO_NOTA } from '../../../domain'
import type { Nota } from '../../../domain'
import { STATUS_NOTA } from '../../../domain'

interface NotaCardProps {
  nota: Nota
  tagsPorId?: Record<string, string>
  aoAlternarFavorita: (id: string) => void
  aoArquivar?: (id: string) => void
  aoRestaurar?: (id: string) => void
  aoMoverLixeira?: (id: string) => void
  aoExcluirDefinitivamente?: (id: string) => void
}

const COR_FORMATO: Record<Nota['formato'], 'cinza' | 'indigo' | 'violeta'> = {
  TXT: 'cinza',
  MARKDOWN: 'indigo',
  HTML: 'violeta',
}

export function NotaCard({
  nota,
  tagsPorId = {},
  aoAlternarFavorita,
  aoArquivar,
  aoRestaurar,
  aoMoverLixeira,
  aoExcluirDefinitivamente,
}: NotaCardProps) {
  const snippet = textoSimples(nota.conteudo)

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/notas/${nota.id}`}
          className="min-w-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <h3 className="flex items-center gap-2 truncate text-sm font-semibold">
            {nota.fixada && (
              <Pin className="size-3.5 shrink-0 text-amber-500" aria-label="Nota fixada" />
            )}
            <span className="truncate">{nota.titulo.trim() === '' ? 'Sem título' : nota.titulo}</span>
          </h3>
          {snippet !== '' && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {snippet}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500" title={nota.alteradaEm}>
            Atualizada {dataRelativa(nota.alteradaEm)}
          </p>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => aoAlternarFavorita(nota.id)}
            aria-label={nota.favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`rounded-lg p-1.5 transition-colors ${
              nota.favorita
                ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/15'
                : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`size-4 ${nota.favorita ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
          {aoRestaurar !== undefined && (
            <button
              type="button"
              onClick={() => aoRestaurar(nota.id)}
              aria-label="Restaurar nota"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
            >
              <ArchiveRestore className="size-4" aria-hidden="true" />
            </button>
          )}
          {aoArquivar !== undefined && nota.status === STATUS_NOTA.ATIVA && (
            <button
              type="button"
              onClick={() => aoArquivar(nota.id)}
              aria-label="Arquivar nota"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
            >
              <Archive className="size-4" aria-hidden="true" />
            </button>
          )}
          {aoMoverLixeira !== undefined && (
            <button
              type="button"
              onClick={() => aoMoverLixeira(nota.id)}
              aria-label="Mover para a lixeira"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
          {aoExcluirDefinitivamente !== undefined && (
            <button
              type="button"
              onClick={() => aoExcluirDefinitivamente(nota.id)}
              aria-label="Excluir definitivamente"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
            >
              <XCircle className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {(nota.tagIds.length > 0 || nota.formato !== FORMATO_NOTA.MARKDOWN) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge cor={COR_FORMATO[nota.formato]}>{nota.formato}</Badge>
          {nota.tagIds.slice(0, 4).map((tagId) => (
            <Badge key={tagId} cor="esmeralda" titulo="Tag">
              {tagsPorId[tagId] ?? tagId}
            </Badge>
          ))}
          {nota.tagIds.length > 4 && (
            <Badge cor="cinza">{`+${nota.tagIds.length - 4}`}</Badge>
          )}
        </div>
      )}
    </article>
  )
}