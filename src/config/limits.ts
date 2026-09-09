export const LIMITS = {
  tituloNotaMaxCaracteres: 200,
  buscaMinCaracteres: 2,
  descricaoMaxCaracteres: 500,
} as const

export const LIMITES_ARQUIVO = {
  tamanhoMaximoBytes: 10 * 1024 * 1024,
  extensoesBloqueadas: ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.js', '.vbs', '.sh'] as const,
} as const

export const PREFERENCIAS = {
  autosaveDebounceMs: 800,
  limiteNotasListagem: 500,
  tituloEditorMaxCaracteres: 200,
} as const