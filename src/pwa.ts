import { logger } from './core/errors'

export function registrarPwa(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      void import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegisteredSW: (scriptUrl: string) => {
            logger.ok(`Service Worker registrado: ${scriptUrl}`)
          },
          onRegisterError: () => {
            logger.aviso('Falha ao registrar o Service Worker.')
          },
        })
      })
    })
  }
}