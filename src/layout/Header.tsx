import { Moon, Sun } from 'lucide-react'
import { useTema } from '../theme'
import { Logo } from './Logo'

export function Header() {
  const { tema, alternarTema } = useTema()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <Logo />
        <span className="text-base font-semibold">ThothNet</span>
      </div>
      <div className="hidden md:block" aria-hidden="true" />

      <button
        type="button"
        onClick={alternarTema}
        aria-label={tema === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        {tema === 'escuro' ? (
          <Sun className="size-5" aria-hidden="true" />
        ) : (
          <Moon className="size-5" aria-hidden="true" />
        )}
      </button>
    </header>
  )
}