import { useEffect, useMemo, useRef } from 'react'
import cytoscape from 'cytoscape'
import type { EdgeSingular } from 'cytoscape'
import cola from 'cytoscape-cola'
import { useTema } from '../../../theme'
import type { Nota } from '../../../domain/nota'
import type { Relacao } from '../../../core/grafo'
import type { ModoLayout } from './AlternadorLayout'

export interface GrafoInterativoProps {
  notas: Nota[]
  relacoes: Relacao[]
  aoClicarNota: (id: string) => void
  alturaClasse?: string
  destaqueId?: string
  layout?: ModoLayout
}

interface NoDados {
  id: string
  rotulo: string
}

cytoscape.use(cola)

export function GrafoInterativo({
  notas,
  relacoes,
  aoClicarNota,
  alturaClasse = 'h-[58svh]',
  destaqueId,
  layout = 'cola',
}: GrafoInterativoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const aoclicarRef = useRef(aoClicarNota)
  const { tema } = useTema()
  const escuro = tema === 'escuro'

  useEffect(() => {
    aoclicarRef.current = aoClicarNota
  }, [aoClicarNota])

  const nos = useMemo<NoDados[]>(
    () => notas.map((nota) => ({ id: nota.id, rotulo: nota.titulo })),
    [notas],
  )
  const arestas = useMemo(() => {
    const vistas = new Set<string>()
    const unicas: Relacao[] = []
    for (const relacao of relacoes) {
      const idAresta = `aresta-${relacao.tipo}-${relacao.origemId}-${relacao.destinoId}`
      if (vistas.has(idAresta)) {
        continue
      }
      vistas.add(idAresta)
      unicas.push(relacao)
    }
    return unicas
  }, [relacoes])

  useEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }

    const elementos = [
      ...nos.map((no) => ({
        data: { id: no.id, rotulo: no.rotulo },
        classes: no.id === destaqueId ? 'destaque' : undefined,
      })),
      ...arestas.map((aresta) => ({
        data: {
          id: `aresta-${aresta.tipo}-${aresta.origemId}-${aresta.destinoId}`,
          source: aresta.origemId,
          target: aresta.destinoId,
          rotulo: aresta.rotulo ?? '',
          peso: aresta.peso,
        },
        classes: aresta.tipo,
      })),
    ]

    const opcoesDeLayout =
      layout === 'circulo'
        ? {
            name: 'concentric',
            animate: true,
            padding: 40,
            minNodeSpacing: 28,
          }
        : {
            name: 'cola',
            animate: true,
            padding: 30,
            nodeSpacing: 26,
            edgeLength: 90,
            randomize: true,
          }

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
          selector: 'node.destaque',
          style: {
            'border-width': 4,
            'border-color': escuro ? '#c7d2fe' : '#1e1b4b',
          },
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'font-size': 6,
            color: escuro ? '#a1a1aa' : '#71717a',
            'text-rotation': 'autorotate',
            'text-background-color': escuro ? '#18181b' : '#ffffff',
            'text-background-opacity': 0.6,
            'text-background-padding': 1,
            label: 'data(rotulo)',
            width: (linha: EdgeSingular): number => 1 + Math.min((linha.data('peso') as number) ?? 1, 3) * 0.7,
          },
        },
        {
          selector: 'edge.wikilink',
          style: {
            'line-color': escuro ? '#818cf8' : '#4f46e5',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': escuro ? '#818cf8' : '#4f46e5',
            'arrow-scale': 0.7,
          },
        },
        {
          selector: 'edge.tag',
          style: {
            'line-color': escuro ? '#34d399' : '#059669',
          },
        },
        {
          selector: 'edge.termo',
          style: {
            'line-color': escuro ? '#fbbf24' : '#d97706',
          },
        },
      ] as never,
      layout: opcoesDeLayout as never,
    })

    cy.on('tap', 'node', (evento) => {
      aoclicarRef.current(evento.target.id())
    })

    cy.fit(undefined, 40)

    return () => {
      cy.destroy()
    }
  }, [nos, arestas, escuro, destaqueId, layout])

  return (
    <div
      ref={containerRef}
      data-testid="grafo"
      className={`w-full ${alturaClasse} overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950`}
    />
  )
}