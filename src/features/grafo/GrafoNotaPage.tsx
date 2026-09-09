import { Route as RouteIcon } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { PagePlaceholder } from '../../components/PagePlaceholder'

export function GrafoNotaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mapa de links"
        descricao="Grafo contextual de uma nota específica."
      />
      <PagePlaceholder
        icone={RouteIcon}
        titulo="Grafo contextual em construção"
        descricao="Links internos, backlinks e relacionamentos manuais serão habilitados na etapa 1.4."
      />
    </div>
  )
}