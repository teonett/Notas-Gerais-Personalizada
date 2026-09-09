import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { getMensagemUsuario } from './format'
import { registrarErroNaoEsperado } from './logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  erro: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { erro: null }

  static getDerivedStateFromError(erro: Error): ErrorBoundaryState {
    return { erro }
  }

  override componentDidCatch(erro: Error, _info: ErrorInfo): void {
    registrarErroNaoEsperado(erro)
  }

  private reiniciar = (): void => {
    this.setState({ erro: null })
  }

  override render(): ReactNode {
    if (this.state.erro === null) {
      return this.props.children
    }

    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-indigo-600/15 text-4xl">
          {'\u{1F50E}'}
        </div>
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="max-w-md text-sm text-slate-500">
          {getMensagemUsuario(this.state.erro)}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Recarregar aplicação
          </button>
          <button
            type="button"
            onClick={this.reiniciar}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Voltar
          </button>
        </div>
      </main>
    )
  }
}