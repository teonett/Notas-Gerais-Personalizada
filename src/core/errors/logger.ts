import { ERROR_CODES } from './errorCodes'

const PREFIXO = '[ThothNet]'

const REDUZIR_PARA_NAO_SENSIVEL = true

export const logger = {
  erro(codigo: string, mensagem: string, detalhes?: unknown): void {
    if (REDUZIR_PARA_NAO_SENSIVEL && detalhes instanceof Error && 'stack' in detalhes) {
      console.error(`${PREFIXO} ${codigo} — ${mensagem}`, detalhes.stack)
      return
    }
    console.error(`${PREFIXO} ${codigo} — ${mensagem}`, detalhes ?? '')
  },

  aviso(mensagem: string): void {
    console.warn(`${PREFIXO} ${mensagem}`)
  },

  ok(mensagem: string): void {
    console.info(`${PREFIXO} ${mensagem}`)
  },
}

export function registrarErroNaoEsperado(erro: unknown): void {
  const codigo = ERROR_CODES.NAVEGACAO.FALHA_INESPERADA
  const mensagem = erro instanceof Error ? erro.message : 'Falha inesperada'
  logger.erro(codigo, mensagem)
}