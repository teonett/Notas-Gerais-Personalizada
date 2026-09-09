import { useEffect, useState, type ReactNode } from 'react'
import { assinarSessao, estaDesbloqueada } from '../../core/auth/sessao'
import { LoginPage } from './LoginPage'

export function ExigirSessao({ children }: { children: ReactNode }) {
  const [desbloqueada, setDesbloqueada] = useState(estaDesbloqueada())

  useEffect(() => assinarSessao(() => setDesbloqueada(estaDesbloqueada())), [])

  if (!desbloqueada) {
    return <LoginPage />
  }
  return <>{children}</>
}