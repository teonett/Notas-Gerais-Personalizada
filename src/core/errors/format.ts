import { AppError } from './AppError'

export function formatarErro(erro: unknown): string {
  if (erro instanceof AppError) {
    return `[${erro.codigo}] ${erro.message}`
  }
  if (erro instanceof Error) {
    return `${erro.name}: ${erro.message}`
  }
  return 'Erro desconhecido'
}

export function getMensagemUsuario(erro: unknown): string {
  if (erro instanceof AppError) {
    return erro.message
  }
  if (erro instanceof Error) {
    return 'Ocorreu um erro inesperado. Tente novamente.'
  }
  return 'Ocorreu um erro desconhecido.'
}