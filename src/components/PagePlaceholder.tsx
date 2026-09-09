import type { LucideIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

interface PagePlaceholderProps {
  icone: LucideIcon | ComponentType<{ className?: string }>
  titulo: string
  descricao: string
  children?: ReactNode
}

export function PagePlaceholder({ icone: Icone, titulo, descricao, children }: PagePlaceholderProps) {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-600/10">
        <Icone className="size-8 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{descricao}</p>
      {children}
    </div>
  )
}