import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'
type Tamanho = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  children: ReactNode
}

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-indigo-600 disabled:hover:bg-indigo-600',
  secundario:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 focus-visible:outline-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  fantasma:
    'text-slate-700 hover:bg-slate-200/70 focus-visible:outline-slate-300 dark:text-slate-200 dark:hover:bg-slate-800',
  perigo:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600 disabled:hover:bg-red-600',
}

const TAMANHOS: Record<Tamanho, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({
  variante = 'primario',
  tamanho = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className,
  ].join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}