import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-svh">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 md:pb-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
                Carregando…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}