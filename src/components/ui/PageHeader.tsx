import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}

export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{titulo}</h1>
        {descricao !== undefined && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
        )}
      </div>
      {acoes !== undefined && <div className="flex items-center gap-2">{acoes}</div>}
    </header>
  )
}