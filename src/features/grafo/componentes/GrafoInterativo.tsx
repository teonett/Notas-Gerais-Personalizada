import { useEffect, useMemo, useRef } from 'react'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
import { useTema } from '../../../theme'
import type { Nota } from '../../../domain/nota'
import type { Relacao } from '../../../core/grafo'

export interface GrafoInterativoProps {
  notas: Nota[]
  relacoes: Relacao[]
  aoClicarNota: (id: string) => void
  alturaClasse?: string
}

interface NoDados {
  id: string
  rotulo: string
}

interface ArestaDados {
  origemId: string
  destinoId: string
}

cytoscape.use(cola)

function deduplicarArestas(relacoes: Relacao[]): ArestaDados[] {
  const vistas = new Set<string>()
  const arestas: ArestaDados[] = []
  for (const relacao of relacoes) {
    const chave =
      relacao.origemId < relacao.destinoId
        ? `${relacao.origemId}|${relacao.destinoId}`
        : `${relacao.destinoId}|${relacao.origemId}`
    if (vistas.has(chave)) {
      continue
    }
    vistas.add(chave)
    arestas.push(relacao)
  }
  return arestas
}

export function GrafoInterativo({
  notas,
  relacoes,
  aoClicarNota,
  alturaClasse = 'h-[58svh]',
}: GrafoInterativoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { tema } = useTema()
  const escuro = tema === 'escuro'

  const nos = useMemo<NoDados[]>(
    () => notas.map((nota) => ({ id: nota.id, rotulo: nota.titulo })),
    [notas],
  )
  const arestas = useMemo(() => deduplicarArestas(relacoes), [relacoes])

  useEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }

    const elementos = [
      ...nos.map((no) => ({
        data: { id: no.id, rotulo: no.rotulo },
      })),
      ...arestas.map((aresta) => ({
        data: {
          id: `aresta-${aresta.origemId}-${aresta.destinoId}`,
          source: aresta.origemId,
          target: aresta.destinoId,
        },
      })),
    ]

    const cy = cytoscape({
      container,
      elements: elementos,
      minZoom: 0.15,
      maxZoom: 2.5,
      wheelSensitivity: 0.25,
      style: [
        {
          selector: 'node',
          style: {
            width: 100,
            height: 44,
            shape: 'round-rectangle',
            'background-color': escuro ? '#6366f1' : '#4338ca',
            'border-color': escuro ? '#a5b4fc' : '#312e81',
            'border-width': 1,
            label: 'data(rotulo)',
            color: '#ffffff',
            'font-size': 11,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'ellipsis',
            'text-max-width': 90,
            'min-zoomed-font-size': 8,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': escuro ? '#52525b' : '#cbd5e1',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': escuro ? '#71717a' : '#94a3b8',
            'arrow-scale': 0.7,
          },
        },
      ] as never,
      layout: {
        name: 'cola',
        animate: true,
        padding: 30,
        nodeSpacing: 26,
        edgeLength: 90,
        randomize: true,
      } as never,
    })

    cy.on('tap', 'node', (evento) => {
      aoClicarNota(evento.target.id())
    })

    cy.fit(undefined, 40)

    return () => {
      cy.destroy()
    }
  }, [nos, arestas, escuro, aoClicarNota])

  return (
    <div
      ref={containerRef}
      data-testid="grafo"
      className={`w-full ${alturaClasse} overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950`}
    />
  )
}