import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  aberto: boolean
  titulo: string
  descricao?: string
  aoFechar: () => void
  children: ReactNode
}

export function Modal({ aberto, titulo, descricao, aoFechar, children }: ModalProps) {
  const botaoFecharRef = useRef<HTMLButtonElement>(null)
  const dialogoRef = useRef<HTMLDivElement>(null)
  const aoFecharRef = useRef(aoFechar)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  }, [aoFechar])

  useEffect(() => {
    if (!aberto) return

    const rafId = window.requestAnimationFrame(() => {
      botaoFecharRef.current?.focus()
    })

    const aoTeclado = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        aoFecharRef.current()
      }
    }

    document.addEventListener('keydown', aoTeclado)
    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener('keydown', aoTeclado)
    }
  }, [aberto])

  if (!aberto) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          aoFechar()
        }
      }}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby={descricao !== undefined ? 'modal-descricao' : undefined}
        className="max-h-[90svh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl focus:outline-none dark:bg-slate-900 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-titulo" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {titulo}
            </h2>
            {descricao !== undefined && (
              <p id="modal-descricao" className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {descricao}
              </p>
            )}
          </div>
          <button
            ref={botaoFecharRef}
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
