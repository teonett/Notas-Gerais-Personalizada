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
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}