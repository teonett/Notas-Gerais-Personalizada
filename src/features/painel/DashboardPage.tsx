import { LayoutDashboard, Lock, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeader } from '../../components/ui'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Painel inicial"
        descricao="Visão geral das suas notas e atividades."
        acoes={
          <Link to="/notas/nova">
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nova nota
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            Acesso local
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Seus dados ficam apenas no seu dispositivo. A autenticação e a sincronização fazem
            parte das próximas fases.
          </p>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <LayoutDashboard className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            Primeiros passos
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Crie sua primeira nota, organize em cadernos e visualise os relacionamentos no grafo.
          </p>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <h2 className="text-sm font-semibold">Estágio atual</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Fundação da aplicação. As demais telas serão habilitadas nas próximas etapas.
          </p>
        </Card>
      </div>
    </div>
  )
}
