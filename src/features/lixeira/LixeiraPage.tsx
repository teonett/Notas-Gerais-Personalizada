import { useMemo, useState } from 'react'
import { Eraser, Trash2 } from 'lucide-react'
import { Button, ConfirmDialog, EmptyState, PageHeader } from '../../components/ui'
import { anexosStore, notasProtegidasStore } from '../../core'
import { dataRelativa } from '../../core'
import { STATUS_NOTA } from '../../domain'
import { NotaCard } from '../notas/components/NotaCard'
import { ehDonoNaUi, useContextoNotaAtual, useNotas } from '../notas/hooks'
import { useTags } from '../tags/hooks'

export function LixeiraPage() {
  const contextoNota = useContextoNotaAtual()
  const { itens: notas, recarregar } = useNotas({
    status: STATUS_NOTA.LIXEIRA,
    ordenacao: 'alteradaEm',
  })
  const { itens: tags } = useTags()
  const [idExclusao, setIdExclusao] = useState<string | null>(null)
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false)

  const tagsPorId = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, tag.nome])),
    [tags],
  )
  const notasDoUsuario = useMemo(
    () => notas.filter((nota) => ehDonoNaUi(nota, contextoNota)),
    [contextoNota, notas],
  )

  const executar = async (acao: () => Promise<unknown>) => {
    await acao()
    recarregar()
  }

  const excluirDefinitivamente = async (id: string): Promise<void> => {
    await anexosStore.removerPorNota(id)
    await notasProtegidasStore.removerComoUsuario([id], contextoNota)
  }

  const esvaziarLixeira = async (): Promise<void> => {
    for (const nota of notasDoUsuario) {
      await anexosStore.removerPorNota(nota.id)
    }
    await notasProtegidasStore.removerComoUsuario(notasDoUsuario.map((nota) => nota.id), contextoNota)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Lixeira"
        descricao="Notas excluídas que ainda podem ser restauradas."
        acoes={
          notasDoUsuario.length > 0 ? (
            <Button variante="perigo" onClick={() => setConfirmarLimpeza(true)}>
              <Eraser className="size-4" aria-hidden="true" />
              Esvaziar lixeira
            </Button>
          ) : undefined
        }
      />

      {notas.length === 0 ? (
        <EmptyState
          icone={Trash2}
          titulo="A lixeira está vazia"
          descricao="Notas movidas para a lixeira aparecem aqui e podem ser restauradas."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {notas.length} nota{notas.length === 1 ? '' : 's'} — exclusão definitiva não pode ser
            desfeita.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notas.map((nota) => (
              <div key={nota.id} className="relative">
                <p
                  className="mb-1 px-1 text-xs text-slate-400 dark:text-slate-500"
                  title={nota.excluidaEm ?? undefined}
                >
                  Excluída {dataRelativa(nota.excluidaEm ?? nota.alteradaEm)}
                </p>
                <NotaCard
                  nota={nota}
                  tagsPorId={tagsPorId}
                  aoAlternarFavorita={
                    ehDonoNaUi(nota, contextoNota)
                      ? (id) =>
                          void executar(() =>
                            notasProtegidasStore.atualizarComoUsuario(
                              id,
                              { favorita: !nota.favorita },
                              contextoNota,
                            ),
                          )
                      : undefined
                  }
                  aoRestaurar={
                    ehDonoNaUi(nota, contextoNota)
                      ? (id) =>
                          void executar(() =>
                            notasProtegidasStore.mudarStatusComoUsuario(
                              id,
                              STATUS_NOTA.ATIVA,
                              contextoNota,
                            ),
                          )
                      : undefined
                  }
                  aoExcluirDefinitivamente={
                    ehDonoNaUi(nota, contextoNota) ? (id) => setIdExclusao(id) : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        aberto={idExclusao !== null}
        titulo="Excluir nota definitivamente"
        mensagem="Esta ação não pode ser desfeita. A nota será removida permanentemente do ThothNet."
        confirmarLabel="Excluir definitivamente"
        perigo
        aoCancelar={() => setIdExclusao(null)}
        aoConfirmar={() => {
          if (idExclusao !== null) {
            void executar(() => excluirDefinitivamente(idExclusao))
          }
          setIdExclusao(null)
        }}
      />

      <ConfirmDialog
        aberto={confirmarLimpeza}
        titulo="Esvaziar a lixeira"
        mensagem="Todas as notas da lixeira serão excluídas definitivamente. Esta ação não pode ser desfeita."
        confirmarLabel="Esvaziar"
        perigo
        aoCancelar={() => setConfirmarLimpeza(false)}
        aoConfirmar={() => {
          void executar(() => esvaziarLixeira())
          setConfirmarLimpeza(false)
        }}
      />
    </div>
  )
}
