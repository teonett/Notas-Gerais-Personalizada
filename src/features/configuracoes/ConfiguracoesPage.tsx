import { Settings } from 'lucide-react'
import { Card, PageHeader } from '../../components/ui'
import { APP } from '../../config/app'

export function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader titulo="Configurações" descricao="Ajustes gerais da aplicação." />
      <Card>
        <h2 className="text-sm font-semibold">Sobre a aplicação</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Nome</dt>
            <dd>{APP.nome}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Versão</dt>
            <dd>{APP.versao}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Idioma</dt>
            <dd>{APP.idioma}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          <Settings className="mr-1 inline size-3.5" aria-hidden="true" />
          Mais opções de configuração nas próximas etapas.
        </p>
      </Card>
    </div>
  )
}