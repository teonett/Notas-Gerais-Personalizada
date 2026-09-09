import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  erro?: string
}

export function Input({ rotulo, erro, id: idExterna, className = '', ...rest }: InputProps) {
  const idGerado = useId()
  const id = idExterna ?? idGerado
  const descricaoId = erro !== undefined ? `${id}-erro` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {rotulo !== undefined && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {rotulo}
        </label>
      )}
      <input
        id={id}
        aria-invalid={erro !== undefined}
        aria-describedby={descricaoId}
        className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          erro !== undefined ? 'border-red-500 dark:border-red-500' : ''
        } ${className}`}
        {...rest}
      />
      {erro !== undefined && (
        <p id={descricaoId} className="text-xs text-red-600 dark:text-red-400">
          {erro}
        </p>
      )}
    </div>
  )
}