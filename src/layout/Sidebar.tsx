import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { GRUPOS_NAVEGACAO } from './navigation'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <Logo />
        <span className="text-base font-semibold">ThothNet</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        {GRUPOS_NAVEGACAO.map((grupo) => (
          <div key={grupo.titulo} className="mb-5">
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {grupo.titulo}
            </p>
            <ul className="space-y-0.5">
              {grupo.itens.map((item) => (
                <li key={`${grupo.titulo}-${item.rotulo}`}>
                  <NavLink
                    to={item.caminho}
                    end={item.caminho === '/'}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                      ].join(' ')
                    }
                  >
                    <item.icone className="size-4.5 shrink-0" aria-hidden="true" />
                    {item.rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}