import { useEffect, useState } from 'react'
import { useTema } from '../../theme'

interface DiagramaMermaidProps {
  codigo: string
}

function gerarIdDiagrama(): string {
  const prefixo = 'mermaid-diagrama'
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefixo}-${crypto.randomUUID()}`
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function DiagramaMermaid({ codigo }: DiagramaMermaidProps) {
  const { tema } = useTema()
  const [svg, setSvg] = useState<string | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true

    async function renderizar(): Promise<void> {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: tema === 'escuro' ? 'dark' : 'default',
        })
        const { svg: svgRenderizado } = await mermaid.render(gerarIdDiagrama(), codigo)
        if (ativo) {
          setSvg(svgRenderizado)
        }
      } catch {
        if (ativo) {
          setErro(true)
        }
      }
    }

    renderizar()
    return () => {
      ativo = false
    }
  }, [codigo, tema])

  if (erro) {
    return (
      <div className="mt-2">
        <div className="mb-1 text-sm font-medium text-amber-300">
          Não foi possível renderizar o diagrama.
        </div>
        <pre className="rounded border border-dashed border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-300">
          <code>```mermaid{`\n${codigo}`}```</code>
        </pre>
      </div>
    )
  }

  if (svg === null) {
    return (
      <div className="mt-2 animate-pulse rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        Renderizando diagrama…
      </div>
    )
  }

  return (
    <div
      className="diagrama-mermaid mt-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}