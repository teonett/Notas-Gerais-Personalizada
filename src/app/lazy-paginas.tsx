import { lazy } from 'react'

export const DashboardPage = lazy(() =>
  import('../features/painel/DashboardPage').then((modulo) => ({ default: modulo.DashboardPage })),
)
export const NotasPage = lazy(() =>
  import('../features/notas/NotasPage').then((modulo) => ({ default: modulo.NotasPage })),
)
export const EditorPage = lazy(() =>
  import('../features/notas/EditorPage').then((modulo) => ({ default: modulo.EditorPage })),
)
export const NotasArquivadasPage = lazy(() =>
  import('../features/notas/NotasArquivadasPage').then((modulo) => ({ default: modulo.NotasArquivadasPage })),
)
export const LixeiraPage = lazy(() =>
  import('../features/lixeira/LixeiraPage').then((modulo) => ({ default: modulo.LixeiraPage })),
)
export const CadernosPage = lazy(() =>
  import('../features/cadernos/CadernosPage').then((modulo) => ({ default: modulo.CadernosPage })),
)
export const TagsPage = lazy(() =>
  import('../features/tags/TagsPage').then((modulo) => ({ default: modulo.TagsPage })),
)
export const BuscaPage = lazy(() =>
  import('../features/busca/BuscaPage').then((modulo) => ({ default: modulo.BuscaPage })),
)
export const CentralAnexosPage = lazy(() =>
  import('../features/anexos/CentralAnexosPage').then((modulo) => ({ default: modulo.CentralAnexosPage })),
)
export const GrafoPage = lazy(() =>
  import('../features/grafo/GrafoPage').then((modulo) => ({ default: modulo.GrafoPage })),
)
export const GrafoNotaPage = lazy(() =>
  import('../features/grafo/GrafoNotaPage').then((modulo) => ({ default: modulo.GrafoNotaPage })),
)
export const ConfiguracoesPage = lazy(() =>
  import('../features/configuracoes/ConfiguracoesPage').then((modulo) => ({ default: modulo.ConfiguracoesPage })),
)
export const ImportacaoExportacaoPage = lazy(() =>
  import('../features/dados/ImportacaoExportacaoPage').then((modulo) => ({ default: modulo.ImportacaoExportacaoPage })),
)
export const SyncPage = lazy(() =>
  import('../features/sync/SyncPage').then((modulo) => ({ default: modulo.SyncPage })),
)
export const StatusPage = lazy(() =>
  import('../features/status/StatusPage').then((modulo) => ({ default: modulo.StatusPage })),
)