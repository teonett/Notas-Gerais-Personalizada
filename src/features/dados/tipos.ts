import type { FormatoNota } from '../../domain'
import type { EscopoExportacaoJson } from '../../core/dados/json'

export type FormatoExportacao = FormatoNota | 'JSON'
export type EscopoExportacao = 'ATIVAS' | 'ARQUIVADAS' | 'TODAS'
export type TipoMensagem = 'sucesso' | 'aviso' | 'erro'

export interface MensagemOperacao {
  tipo: TipoMensagem
  texto: string
}

export interface OpcoesExportacaoNotas {
  formatoExportacao: FormatoExportacao
  escopoExportacao: EscopoExportacao
  escopoJson: EscopoExportacaoJson
}
