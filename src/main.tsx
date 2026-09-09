import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { ErrorBoundary } from './core'
import { TemaProvider } from './theme'
import { registrarPwa } from './pwa'

registrarPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TemaProvider>
        <App />
      </TemaProvider>
    </ErrorBoundary>
  </StrictMode>,
)