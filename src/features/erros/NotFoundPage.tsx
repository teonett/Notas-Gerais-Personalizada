import { AlertTriangle, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, PageHeader } from '../../components/ui'

export function NotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader titulo="Página não encontrada" />
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertTriangle className="size-12 text-amber-500" aria-hidden="true" />
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          O endereço acessado não existe ou foi movido.
        </p>
        <Link to="/">
          <Button>
            <Home className="size-4" aria-hidden="true" />
            Voltar ao painel
          </Button>
        </Link>
      </div>
    </div>
  )
}