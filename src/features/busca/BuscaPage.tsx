import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, StickyNote } from 'lucide-react'
import { EmptyState, Input, PageHeader } from '../../components/ui'
import { LIMITS } from '../../config/limits'
import { notasProtegidasStore } from '../../core'
import { STATUS_NOTA } from '../../domain'
import { NotaCard } from '../notas/components/NotaCard'
import { ehDonoNaUi, useContextoNotaAtual, useNotas } from '../notas/hooks'
import { useTags } from '../tags/hooks'

export function BuscaPage() {
  const contextoNota = useContextoNotaAtual()
  const [parametros] = useSearchParams()
  const termoInicial = parametros.get('termo') ?? ''
  const [termo, setTermo] = useState(termoInicial)
  const [termoEfetivo, setTermoEfetivo] = useState(termoInicial)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTermoEfetivo(termo)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [termo])

  const termoDeBusca =
    termoEfetivo.trim().length >= LIMITS.buscaMinCaracteres ? termoEfetivo : undefined

  const { itens: notas, recarregar } = useNotas({
    termo: termoDeBusca,
    ordenacao: 'alteradaEm',
  })
  const { itens: tags } = useTags()

  const tagsPorId = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, tag.nome])),
    [tags],
  )

  const resultados = notas.filter((nota) => nota.status !== STATUS_NOTA.LIXEIRA).slice(0, 100)

  const executar = async (acao: () => Promise<unknown>) => {
    await acao()
    recarregar()
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Pesquisa" descricao="Encontre notas por título, conteúdo e tags." />

      <div className="w-full sm:w-96">
        <Input
          rotulo="Buscar"
          placeholder="Digite para pesquisar…"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-label="Buscar notas"
          autoFocus
        />
        {termo.trim().length > 0 && termo.trim().length < LIMITS.buscaMinCaracteres && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Digite pelo menos {LIMITS.buscaMinCaracteres} caracteres para buscar.
          </p>
        )}
      </div>

      {termoDeBusca !== undefined ? (
        resultados.length === 0 ? (
          <EmptyState
            icone={Search}
            titulo="Nenhum resultado"
            descricao={`Nada encontrado para “${termoEfetivo}”. Tente outros termos ou verifique a grafia.`}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {resultados.length} resultado{resultados.length === 1 ? '' : 's'} para “
              {termoEfetivo}”
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((nota) => (
                <NotaCard
                  key={nota.id}
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
                    nota.status === STATUS_NOTA.LIXEIRA && ehDonoNaUi(nota, contextoNota)
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
                  aoArquivar={
                    nota.status === STATUS_NOTA.ATIVA && ehDonoNaUi(nota, contextoNota)
                      ? (id) =>
                          void executar(() =>
                            notasProtegidasStore.mudarStatusComoUsuario(
                              id,
                              STATUS_NOTA.ARQUIVADA,
                              contextoNota,
                            ),
                          )
                      : undefined
                  }
                  aoMoverLixeira={
                    nota.status !== STATUS_NOTA.LIXEIRA && ehDonoNaUi(nota, contextoNota)
                      ? (id) =>
                          void executar(() =>
                            notasProtegidasStore.mudarStatusComoUsuario(
                              id,
                              STATUS_NOTA.LIXEIRA,
                              contextoNota,
                            ),
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )
      ) : (
        <EmptyState
          icone={StickyNote}
          titulo="Pesquise suas notas"
          descricao="A busca considera título, conteúdo e nomes de tags, com resultados em tempo real."
        />
      )}
    </div>
  )
}
