import { NavLink } from 'react-router-dom'
import { NAVEGACAO_PRINCIPAL } from './navigation'

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
      aria-label="Navegação inferior"
    >
      <ul className="flex items-stretch justify-around">
        {NAVEGACAO_PRINCIPAL.map((item) => (
          <li key={item.rotulo} className="flex-1">
            <NavLink
              to={item.caminho}
              end={item.caminho === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                ].join(' ')
              }
            >
              <item.icone className="size-5" aria-hidden="true" />
              {item.rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}