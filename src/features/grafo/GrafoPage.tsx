import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Network as GrafoIcone } from 'lucide-react'
import { PageHeader, EmptyState } from '../../components/ui'
import { notasStore, tagsStore, logger } from '../../core'
import type { GrafoDeNotas, TipoRelacao } from '../../core/grafo'
import { construirGrafoDeNotas, TIPOS_RELACAO, TIPOS_RELACAO_ROTULOS } from '../../core/grafo'
import { AlternadorLayout } from './componentes/AlternadorLayout'
import type { ModoLayout } from './componentes/AlternadorLayout'
import { GrafoInterativo } from './componentes/GrafoInterativo'

const CORES_POR_TIPO: Record<TipoRelacao, string> = {
  wikilink: 'bg-indigo-500',
  tag: 'bg-emerald-500',
  termo: 'bg-amber-500',
}

export function GrafoPage() {
  const navigate = useNavigate()
  const [grafo, setGrafo] = useState<GrafoDeNotas | null>(null)
  const [tiposAtivos, setTiposAtivos] = useState<Set<TipoRelacao>>(
    () => new Set(TIPOS_RELACAO),
  )
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

  const relacoesVisiveis = useMemo(
    () => (grafo === null ? [] : grafo.relacoes.filter((relacao) => tiposAtivos.has(relacao.tipo))),
    [grafo, tiposAtivos],
  )

  function alternarTipo(tipo: TipoRelacao): void {
    setTiposAtivos((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(tipo)) {
        proximo.delete(tipo)
      } else {
        proximo.add(tipo)
      }
      return proximo
    })
  }

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
          descricao="Crie notas e conecte-as usando [[Título]], tags ou palavras-chave em comum."
        />
      </div>
    )
  }

  const totalConexoes = grafo.relacoes.length

  return (
    <div className="space-y-6">
      <PageHeader titulo="Grafo de conhecimento" descricao="Visualize as notas e seus relacionamentos." />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {TIPOS_RELACAO.map((tipo) => {
            const quantidade = grafo.porTipo[tipo].length
            const ativo = tiposAtivos.has(tipo)
            const cor = CORES_POR_TIPO[tipo]
            return (
              <label
                key={tipo}
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => alternarTipo(tipo)}
                  className="size-4 accent-indigo-600"
                />
                <span className={`size-2.5 rounded-full ${cor}`} aria-hidden="true" />
                {TIPOS_RELACAO_ROTULOS[tipo]}
                <span className="text-xs text-slate-400">{quantidade}</span>
              </label>
            )
          })}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {grafo.notasAtivas.length} notas · {totalConexoes} conexões · clique em um nó para abrir a nota.
        </p>
      </div>
      <div className="flex justify-end">
        <AlternadorLayout valor={layout} aoAlterar={setLayout} />
      </div>
      <GrafoInterativo
        notas={grafo.notasAtivas}
        relacoes={relacoesVisiveis}
        layout={layout}
        aoClicarNota={(id) => navigate(`/notas/${id}`)}
      />
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Conexões são inferidas de wikilinks ([[Título]]), tags compartilhadas e palavras-chave em
        comum no título e conteúdo.
      </p>
    </div>
  )
}