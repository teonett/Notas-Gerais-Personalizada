import { useMemo, useState } from 'react'
import { ArrowDownAZ, Clock, Plus, Search, StickyNote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, Input, PageHeader } from '../../components/ui'
import { LIMITS } from '../../config/limits'
import { notasProtegidasStore } from '../../core'
import { ehDonoNaUi, useContextoNotaAtual, useNotas } from './hooks'
import { NotaCard } from './components/NotaCard'
import { useTags } from '../tags/hooks'
import { STATUS_NOTA } from '../../domain'

type Ordenacao = 'alteradaEm' | 'titulo'

export function NotasPage() {
  const [termo, setTermo] = useState('')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('alteradaEm')
  const contextoNota = useContextoNotaAtual()
  const { itens: notas, recarregar } = useNotas({
    status: STATUS_NOTA.ATIVA,
    ordenacao,
    termo: termo.length >= LIMITS.buscaMinCaracteres ? termo : undefined,
  })
  const { itens: tags } = useTags()

  const tagsPorId = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, tag.nome])),
    [tags],
  )

  const fixadas = notas.filter((n) => n.fixada)
  const demais = notas.filter((n) => !n.fixada)

  const executar = async (acao: () => Promise<unknown>) => {
    await acao()
    recarregar()
  }

  const renderizarNota = (nota: (typeof notas)[number]) => {
    const podeAlterar = ehDonoNaUi(nota, contextoNota)
    return (
      <NotaCard
        key={nota.id}
        nota={nota}
        tagsPorId={tagsPorId}
        aoAlternarFavorita={
          podeAlterar
            ? (id) => void executar(() => notasProtegidasStore.atualizarComoUsuario(id, { favorita: !nota.favorita }, contextoNota))
            : undefined
        }
        aoArquivar={
          podeAlterar
            ? (id) => void executar(() => notasProtegidasStore.mudarStatusComoUsuario(id, STATUS_NOTA.ARQUIVADA, contextoNota))
            : undefined
        }
        aoMoverLixeira={
          podeAlterar
            ? (id) => void executar(() => notasProtegidasStore.mudarStatusComoUsuario(id, STATUS_NOTA.LIXEIRA, contextoNota))
            : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Notas"
        descricao="Gerencie suas anotações, favoritas e fixadas."
        acoes={
          <Link to="/notas/nova">
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nova nota
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            rotulo="Buscar nas notas"
            placeholder="Título, conteúdo ou tag…"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            aria-label="Buscar nas notas"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
            Ordenar por
          </span>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setOrdenacao('alteradaEm')}
              aria-pressed={ordenacao === 'alteradaEm'}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                ordenacao === 'alteradaEm'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="size-4" aria-hidden="true" />
              Recentes
            </button>
            <button
              type="button"
              onClick={() => setOrdenacao('titulo')}
              aria-pressed={ordenacao === 'titulo'}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                ordenacao === 'titulo'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowDownAZ className="size-4" aria-hidden="true" />
              Título
            </button>
          </div>
        </div>
      </div>

      {notas.length === 0 ? (
        <EmptyState
          icone={StickyNote}
          titulo="Nenhuma nota encontrada"
          descricao={
            termo !== ''
              ? 'Nenhum resultado para a busca atual. Tente outros termos.'
              : 'Crie sua primeira nota e comece a organizar suas ideias.'
          }
          acao={
            <Link to="/notas/nova">
              <Button>
                <Plus className="size-4" aria-hidden="true" />
                Criar primeira nota
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {fixadas.length > 0 && (
            <section aria-label="Notas fixadas">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Fixadas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fixadas.map(renderizarNota)}
              </div>
            </section>
          )}
          <section aria-label="Todas as notas">
            {fixadas.length > 0 && (
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Todas
              </h2>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {demais.map(renderizarNota)}
            </div>
          </section>
        </div>
      )}

      {termo !== '' && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Search className="size-4" aria-hidden="true" />
          Buscando por “{termo}” — {notas.length} resultado{notas.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
