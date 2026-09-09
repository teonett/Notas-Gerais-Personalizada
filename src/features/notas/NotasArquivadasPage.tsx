import { useMemo } from 'react'
import { Archive } from 'lucide-react'
import { EmptyState, PageHeader } from '../../components/ui'
import { notasStore } from '../../core'
import { STATUS_NOTA } from '../../domain'
import { NotaCard } from './components/NotaCard'
import { useNotas } from './hooks'
import { useTags } from '../tags/hooks'

export function NotasArquivadasPage() {
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
              aoAlternarFavorita={(id) => void executar(() => notasStore.alternarFavorita(id))}
              aoRestaurar={(id) => void executar(() => notasStore.mudarStatus(id, STATUS_NOTA.ATIVA))}
              aoMoverLixeira={(id) => void executar(() => notasStore.mudarStatus(id, STATUS_NOTA.LIXEIRA))}
            />
          ))}
        </div>
      )}
    </div>
  )
}