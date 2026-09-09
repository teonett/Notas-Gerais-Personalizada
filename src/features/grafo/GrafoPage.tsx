import { Network } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { PagePlaceholder } from '../../components/PagePlaceholder'

export function GrafoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Grafo global"
        descricao="Visualize as notas e seus relacionamentos."
      />
      <PagePlaceholder
        icone={Network}
        titulo="Grafo em construção"
        descricao="O knowledge graph e os diagramas Mermaid serão habilitados na etapa 1.4."
      />
    </div>
  )
}