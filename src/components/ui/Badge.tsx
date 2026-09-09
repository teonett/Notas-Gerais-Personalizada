type Cor = 'cinza' | 'indigo' | 'ambar' | 'esmeralda' | 'vermelho' | 'violeta'

const CORES: Record<Cor, string> = {
  cinza: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  ambar: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  esmeralda: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  vermelho: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  violeta: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
}

interface BadgeProps {
  children: string
  cor?: Cor
  titulo?: string
}

export function Badge({ children, cor = 'cinza', titulo }: BadgeProps) {
  return (
    <span
      title={titulo}
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${CORES[cor]}`}
    >
      <span className="truncate">{children}</span>
    </span>
  )
}

export type BadgeCor = Cor