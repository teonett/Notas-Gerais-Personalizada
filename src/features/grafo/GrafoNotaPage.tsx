import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Route as RotaIcone } from 'lucide-react'
import { PageHeader, EmptyState, Button, Badge } from '../../components/ui'
import { notasStore, tagsStore, logger } from '../../core'
import type { GrafoDeNotas } from '../../core/grafo'
import { backlinksDe, construirGrafoDeNotas, TIPOS_RELACAO, vizinhancaDe } from '../../core/grafo'
import { AlternadorLayout } from './componentes/AlternadorLayout'
import type { ModoLayout } from './componentes/AlternadorLayout'
import { GrafoInterativo } from './componentes/GrafoInterativo'

export function GrafoNotaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grafo, setGrafo] = useState<GrafoDeNotas | null>(null)
  const [layout, setLayout] = useState<ModoLayout>('cola')

  useEffect(() => {
    let ativo = true
    Promise.all([notasStore.listarTodas(), tagsStore.listarTodas()])
      .then(([todas, tags]) => {
        if (ativo) {
          setGrafo(construirGrafoDeNotas(todas, tags))
        }
      })
      .catch(() => {
        if (ativo) {
          setGrafo(null)
        }
        logger.aviso('Falha ao carregar notas para o grafo.')
      })
    return () => {
      ativo = false
    }
  }, [])

  const nota = useMemo(() => {
    if (grafo === null || id === undefined) {
      return undefined
    }
    return grafo.obterPorId(id)
  }, [grafo, id])

  const contexto = useMemo(() => {
    if (grafo === null || id === undefined) {
      return { nos: [], arestas: [] }
    }
    const vizinhanca = vizinhancaDe(id, grafo)
    const nos = [...vizinhanca].map((notaId) => grafo.obterPorId(notaId)).filter((n) => n !== undefined)
    const arestas = grafo.relacoes.filter(
      (relacao) => vizinhanca.has(relacao.origemId) && vizinhanca.has(relacao.destinoId),
    )
    return { nos, arestas }
  }, [grafo, id])

  if (grafo === null) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Mapa de links" descricao="Grafo contextual de uma nota específica." />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700">
          Carregando grafo…
        </div>
      </div>
    )
  }

  if (nota === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Mapa de links" descricao="Grafo contextual de uma nota específica." />
        <EmptyState
          icone={RotaIcone}
          titulo="Nota não encontrada"
          descricao="A nota pode ter sido movida para a lixeira ou arquivada."
        />
      </div>
    )
  }

  const backlinks = backlinksDe(nota.id, grafo)
  const conexoesPorTipo = TIPOS_RELACAO.map((tipo) => ({
    tipo,
    quantidade: contexto.arestas.filter((relacao) => relacao.tipo === tipo).length,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={nota.titulo}
        descricao="Grafo contextual: ligações desta nota e backlinks."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge cor="esmeralda">{`${contexto.nos.length} nós`}</Badge>
        <Badge cor="indigo">{`${backlinks.length} backlinks`}</Badge>
        {conexoesPorTipo.some(({ quantidade }) => quantidade > 0) &&
          conexoesPorTipo.map(
            ({ tipo, quantidade }) =>
              quantidade > 0 && (
                <Badge key={tipo} cor={tipo === 'wikilink' ? 'indigo' : tipo === 'tag' ? 'esmeralda' : 'ambar'}>
                  {`${quantidade} ${tipo}`}
                </Badge>
              ),
          )}
        <span className="ml-auto">
          <AlternadorLayout valor={layout} aoAlterar={setLayout} />
        </span>
        <Button variante="secundario" onClick={() => navigate(`/notas/${nota.id}`)}>
          Abrir nota
        </Button>
      </div>
      <GrafoInterativo
        notas={contexto.nos}
        relacoes={contexto.arestas}
        destaqueId={nota.id}
        layout={layout}
        aoClicarNota={(notaId) => navigate(notaId === nota.id ? `/notas/${notaId}` : `/grafo/${notaId}`)}
      />
      {backlinks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Backlinks</h2>
          <ul className="space-y-1">
            {backlinks.map((backlink) => {
              const origem = grafo.obterPorId(backlink.origemId)
              if (origem === undefined) {
                return null
              }
              return (
                <li key={backlink.origemId}>
                  <Link
                    to={`/grafo/${origem.id}`}
                    className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {origem.titulo}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}