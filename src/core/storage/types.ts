export interface StorageStatus {
  suportado: boolean
  somenteLeitura: boolean
}

export interface StorageError {
  codigo: 'NAO_SUPORTADO' | 'FALHA_ABRIR_BANCO' | 'FALHA_OPERACAO'
  mensagem: string
}