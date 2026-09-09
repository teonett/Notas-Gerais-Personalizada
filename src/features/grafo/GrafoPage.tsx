import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Network as GrafoIcone } from 'lucide-react'
import { PageHeader, EmptyState } from '../../components/ui'
import { notasStore, logger } from '../../core'
import type { GrafoDeNotas } from '../../core/grafo'
import { construirGrafoDeNotas } from '../../core/grafo'
import { GrafoInterativo } from './componentes/GrafoInterativo'

export function GrafoPage() {
  const navigate = useNavigate()
  const [grafo, setGrafo] = useState<GrafoDeNotas | null>(null)

  useEffect(() => {
    let ativo = true
    notasStore
      .listarTodas()
      .then((todas) => {
        if (ativo) {
          setGrafo(construirGrafoDeNotas(todas))
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

  if (grafo === null) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Grafo de conhecimento" descricao="Visualize as notas e seus relacionamentos." />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700">
          Carregando grafo…
        </div>
      </div>
    )
  }

  if (grafo.notasAtivas.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Grafo de conhecimento" descricao="Visualize as notas e seus relacionamentos." />
        <EmptyState
          icone={GrafoIcone}
          titulo="Nenhuma nota para exibir"
          descricao="Crie notas e conecte-as usando [[Título]] dentro do conteúdo."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Grafo de conhecimento" descricao="Visualize as notas e seus relacionamentos." />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {grafo.notasAtivas.length} notas · {grafo.relacoes.length} conexões · clique em um nó para abrir a nota.
      </p>
      <GrafoInterativo
        notas={grafo.notasAtivas}
        relacoes={grafo.relacoes}
        aoClicarNota={(id) => navigate(`/notas/${id}`)}
      />
    </div>
  )
}