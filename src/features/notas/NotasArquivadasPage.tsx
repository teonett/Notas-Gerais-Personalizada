import { useMemo } from 'react'
import { Archive } from 'lucide-react'
import { EmptyState, PageHeader } from '../../components/ui'
import { notasProtegidasStore } from '../../core'
import { STATUS_NOTA } from '../../domain'
import { NotaCard } from './components/NotaCard'
import { ehDonoNaUi, useContextoNotaAtual, useNotas } from './hooks'
import { useTags } from '../tags/hooks'

export function NotasArquivadasPage() {
  const contextoNota = useContextoNotaAtual()
  const { itens: notas, recarregar } = useNotas({
    status: STATUS_NOTA.ARQUIVADA,
    ordenacao: 'alteradaEm',
  })
  const { itens: tags } = useTags()

  const tagsPorId = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, tag.nome])),
    [tags],
  )

  const executar = async (acao: () => Promise<unknown>) => {
    await acao()
    recarregar()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Notas arquivadas"
        descricao="Notas inativas, fora da listagem principal."
      />

      {notas.length === 0 ? (
        <EmptyState
          icone={Archive}
          titulo="Nenhuma nota arquivada"
          descricao="Arquive uma nota para tirá-la da listagem principal sem excluí-la."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notas.map((nota) => (
            <NotaCard
              key={nota.id}
              nota={nota}
              tagsPorId={tagsPorId}
              aoAlternarFavorita={
                ehDonoNaUi(nota, contextoNota)
                  ? (id) => void executar(() => notasProtegidasStore.atualizarComoUsuario(id, { favorita: !nota.favorita }, contextoNota))
                  : undefined
              }
              aoRestaurar={
                ehDonoNaUi(nota, contextoNota)
                  ? (id) => void executar(() => notasProtegidasStore.mudarStatusComoUsuario(id, STATUS_NOTA.ATIVA, contextoNota))
                  : undefined
              }
              aoMoverLixeira={
                ehDonoNaUi(nota, contextoNota)
                  ? (id) => void executar(() => notasProtegidasStore.mudarStatusComoUsuario(id, STATUS_NOTA.LIXEIRA, contextoNota))
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
