import type { LucideIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

interface EmptyStateProps {
  icone: LucideIcon | ComponentType<{ className?: string }>
  titulo: string
  descricao?: string
  acao?: ReactNode
}

export function EmptyState({ icone: Icone, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <Icone className="size-6 text-slate-400" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {descricao !== undefined && (
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
        )}
      </div>
      {acao !== undefined && acao}
    </div>
  )
}