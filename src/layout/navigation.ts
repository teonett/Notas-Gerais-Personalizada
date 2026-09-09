import {
  Archive,
  Boxes,
  BookOpen,
  Cloud,
  Database,
  FileDown,
  FolderOpen,
  Home,
  Network,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Settings,
  ShieldCheck,
  StickyNote,
  Tag,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ItemNavegacao {
  rotulo: string
  caminho: string
  icone: LucideIcon
}

export interface GrupoNavegacao {
  titulo: string
  itens: ItemNavegacao[]
}

export const ROTAS = {
  painel: '/',
  notas: '/notas',
  editor: '/notas/:id',
  notasArquivadas: '/notas/arquivadas',
  lixeira: '/lixeira',
  cadernos: '/cadernos',
  tags: '/tags',
  busca: '/busca',
  centralAnexos: '/central-de-anexos',
  grafo: '/grafo',
  grafoNota: '/grafo/:id',
  nuvem: '/nuvem',
  configuracoes: '/configuracoes',
  seguranca: '/seguranca',
  importarExportar: '/importar-exportar',
  status: '/status',
  sincronizacao: '/sincronizar',
} as const

export const NAVEGACAO_PRINCIPAL: ItemNavegacao[] = [
  { rotulo: 'Painel', caminho: ROTAS.painel, icone: Home },
  { rotulo: 'Notas', caminho: ROTAS.notas, icone: StickyNote },
  { rotulo: 'Cadernos', caminho: ROTAS.cadernos, icone: FolderOpen },
  { rotulo: 'Busca', caminho: ROTAS.busca, icone: Search },
  { rotulo: 'Configurações', caminho: ROTAS.configuracoes, icone: Settings },
]

export const GRUPOS_NAVEGACAO: GrupoNavegacao[] = [
  {
    titulo: 'Notas',
    itens: [
      { rotulo: 'Notas', caminho: ROTAS.notas, icone: StickyNote },
      { rotulo: 'Cadernos', caminho: ROTAS.cadernos, icone: FolderOpen },
      { rotulo: 'Tags', caminho: ROTAS.tags, icone: Tag },
      { rotulo: 'Arquivadas', caminho: ROTAS.notasArquivadas, icone: Archive },
      { rotulo: 'Lixeira', caminho: ROTAS.lixeira, icone: Trash2 },
    ],
  },
  {
    titulo: 'Visualização',
    itens: [
      { rotulo: 'Grafo global', caminho: ROTAS.grafo, icone: Network },
      { rotulo: 'Nuvem de palavras', caminho: ROTAS.nuvem, icone: Cloud },
      { rotulo: 'Mapa de links', caminho: ROTAS.grafoNota, icone: RouteIcon },
    ],
  },
  {
    titulo: 'Dados',
    itens: [
      { rotulo: 'Central de anexos', caminho: ROTAS.centralAnexos, icone: Boxes },
      { rotulo: 'Sincronização', caminho: ROTAS.sincronizacao, icone: RefreshCw },
      { rotulo: 'Armazenamento e sincronização', caminho: ROTAS.status, icone: Database },
      { rotulo: 'Importar e exportar', caminho: ROTAS.importarExportar, icone: FileDown },
    ],
  },
  {
    titulo: 'Sistema',
    itens: [
      { rotulo: 'Configurações', caminho: ROTAS.configuracoes, icone: Settings },
      { rotulo: 'Contas e segurança', caminho: ROTAS.seguranca, icone: ShieldCheck },
      { rotulo: 'Sobre o ThothNet', caminho: ROTAS.painel, icone: BookOpen },
    ],
  },
]