import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../layout'
import { ExigirSessao } from '../features/auth/ExigirSessao'
import { NotFoundPage } from '../features/erros/NotFoundPage'
import {
  BuscaPage,
  CadernosPage,
  CentralAnexosPage,
  ConfiguracoesPage,
  DashboardPage,
  EditorPage,
  GrafoNotaPage,
  GrafoPage,
  ImportacaoExportacaoPage,
  LixeiraPage,
  NotasArquivadasPage,
  NotasPage,
  NuvemDePalavrasPage,
  SegurancaPage,
  StatusPage,
  SyncPage,
  TagsPage,
} from './lazy-paginas'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ExigirSessao>
        <AppShell />
      </ExigirSessao>
    ),
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
      { path: 'nuvem', element: <NuvemDePalavrasPage /> },
      { path: 'central-de-anexos', element: <CentralAnexosPage /> },
      { path: 'grafo', element: <GrafoPage /> },
      { path: 'grafo/:id', element: <GrafoNotaPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
      { path: 'seguranca', element: <SegurancaPage /> },
      { path: 'importar-exportar', element: <ImportacaoExportacaoPage /> },
      { path: 'sincronizar', element: <SyncPage /> },
      { path: 'status', element: <StatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])