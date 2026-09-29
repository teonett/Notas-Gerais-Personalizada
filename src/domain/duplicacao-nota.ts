import type { Nota } from './nota'
import { STATUS_NOTA } from './tipos'

export const SUFIXO_TITULO_COPIA = ' - copia'

export interface DadosDuplicacaoNota {
  nota: Nota
  novoId: string
  novoOwnerId: string
  criadaEm: string
}

export function duplicarNotaParaUsuario({
  nota,
  novoId,
  novoOwnerId,
  criadaEm,
}: DadosDuplicacaoNota): Nota {
  return {
    ...nota,
    id: novoId,
    ownerId: novoOwnerId,
    titulo: `${nota.titulo}${SUFIXO_TITULO_COPIA}`,
    status: STATUS_NOTA.ATIVA,
    favorita: false,
    fixada: false,
    criadaEm,
    alteradaEm: criadaEm,
    excluidaEm: null,
  }
}
