import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  aberto: boolean
  titulo: string
  mensagem: string
  confirmarLabel: string
  perigo?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  confirmarLabel,
  perigo = false,
  aoConfirmar,
  aoCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal aberto={aberto} titulo={titulo} aoFechar={aoCancelar}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              perigo
                ? 'bg-red-100 dark:bg-red-500/15'
                : 'bg-amber-100 dark:bg-amber-500/15'
            }`}
          >
            <AlertTriangle
              className={`size-5 ${perigo ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}
              aria-hidden="true"
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{mensagem}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Button>
          <Button variante={perigo ? 'perigo' : 'primario'} onClick={aoConfirmar}>
            {confirmarLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}