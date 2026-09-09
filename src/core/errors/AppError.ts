import type { ErrorCode } from './errorCodes'

export class AppError extends Error {
  readonly codigo: ErrorCode
  readonly causa?: unknown

  constructor(codigo: ErrorCode, mensagem: string, opcoes?: { causa?: unknown }) {
    super(mensagem)
    this.name = 'AppError'
    this.codigo = codigo
    this.causa = opcoes?.causa
  }
}