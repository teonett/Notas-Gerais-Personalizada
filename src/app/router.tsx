import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../layout'
import { BuscaPage } from '../features/busca/BuscaPage'
import { CadernosPage } from '../features/cadernos/CadernosPage'
import { CentralAnexosPage } from '../features/anexos/CentralAnexosPage'
import { ConfiguracoesPage } from '../features/configuracoes/ConfiguracoesPage'
import { NotFoundPage } from '../features/erros/NotFoundPage'
import { GrafoNotaPage, GrafoPage } from '../features/grafo'
import { ImportacaoExportacaoPage } from '../features/dados/ImportacaoExportacaoPage'
import { LixeiraPage } from '../features/lixeira/LixeiraPage'
import { DashboardPage } from '../features/painel/DashboardPage'
import { EditorPage, NotasArquivadasPage, NotasPage } from '../features/notas'
import { StatusPage } from '../features/status/StatusPage'
import { SyncPage } from '../features/sync/SyncPage'
import { TagsPage } from '../features/tags/TagsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'notas', element: <NotasPage /> },
      { path: 'notas/:id', element: <EditorPage /> },
      { path: 'notas/arquivadas', element: <NotasArquivadasPage /> },
      { path: 'lixeira', element: <LixeiraPage /> },
      { path: 'cadernos', element: <CadernosPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'busca', element: <BuscaPage /> },
      { path: 'central-de-anexos', element: <CentralAnexosPage /> },
      { path: 'grafo', element: <GrafoPage /> },
      { path: 'grafo/:id', element: <GrafoNotaPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
      { path: 'importar-exportar', element: <ImportacaoExportacaoPage /> },
      { path: 'sincronizar', element: <SyncPage /> },
      { path: 'status', element: <StatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])