import { Radar, Waypoints } from 'lucide-react'

export type ModoLayout = 'cola' | 'circulo'

export interface AlternadorLayoutProps {
  valor: ModoLayout
  aoAlterar: (modo: ModoLayout) => void
}

const OPCOES: Array<{ modo: ModoLayout; rotulo: string; icone: typeof Radar }> = [
  { modo: 'cola', rotulo: 'Automático', icone: Waypoints },
  { modo: 'circulo', rotulo: 'Círculos', icone: Radar },
]

export function AlternadorLayout({ valor, aoAlterar }: AlternadorLayoutProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-zinc-950"
      data-testid="alternador-layout"
    >
      {OPCOES.map(({ modo, rotulo, icone: Icone }) => {
        const ativo = valor === modo
        return (
          <button
            key={modo}
            type="button"
            onClick={() => aoAlterar(modo)}
            aria-pressed={ativo}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors ${
              ativo
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icone className="size-4" aria-hidden="true" />
            {rotulo}
          </button>
        )
      })}
    </div>
  )
}