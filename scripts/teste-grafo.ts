import { STATUS_NOTA } from '../src/domain/tipos'
import type { Nota } from '../src/domain/nota'
import {
  backlinksDe,
  construirGrafoDeNotas,
  extrairLinksDoTexto,
  normalizarTitulo,
  vizinhancaDe,
} from '../src/core/grafo'
import { pluginLinksInternos } from '../src/core/grafo/markdown-links'

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

function nota(parcial: Partial<Nota> & Pick<Nota, 'id' | 'titulo' | 'conteudo'>): Nota {
  return {
    cadernoId: null,
    criadaEm: new Date().toISOString(),
    formato: 'MARKDOWN',
    status: STATUS_NOTA.ATIVA,
    atualizadaEm: new Date().toISOString(),
    ...parcial,
  }
}

const notas: Nota[] = [
  nota({ id: 'n1', titulo: 'Arquitetura', conteudo: 'Ver [[Fundamentos]] e [[Testes]].' }),
  nota({ id: 'n2', titulo: 'Fundamentos', conteudo: 'Liga para [[Arquitetura]].' }),
  nota({ id: 'n3', titulo: 'Testes', conteudo: 'Sem links.' }),
  nota({ id: 'n4', titulo: 'Perdida', conteudo: 'Aponta para [[Inexistente]] e para si mesma [[Perdida]]' }),
  nota({
    id: 'n5',
    titulo: 'Arquitetura',
    conteudo: 'Duplicado de título; deve ser ignorado na resolução.',
  }),
  nota({ id: 'n6', titulo: 'Arquivada', conteudo: '[[Arquitetura]]', status: STATUS_NOTA.ARQUIVADA }),
]

const grafo = construirGrafoDeNotas(notas)

passo('extrai wikilinks do texto', JSON.stringify(extrairLinksDoTexto('a [[X]] b [[Y]] [[Z]]')) === '["X","Y","Z"]')
passo('normaliza título', normalizarTitulo('  Clean   Code  ') === 'clean code')
passo('exclui notas não ativas do grafo', grafo.notasAtivas.length === 5)
passo('exclui link para si mesma e destino inexistente', grafo.relacoes.every((r) => r.destinoId !== 'n4'))
passo('resolve primeiro título duplicado', grafo.resolverPorTitulo('Arquitetura') === 'n1')
passo('cria relação n1 -> n2', grafo.relacoes.some((r) => r.origemId === 'n1' && r.destinoId === 'n2'))
passo('cria relação n1 -> n3', grafo.relacoes.some((r) => r.origemId === 'n1' && r.destinoId === 'n3'))
passo('cria relação n2 -> n1', grafo.relacoes.some((r) => r.origemId === 'n2' && r.destinoId === 'n1'))
passo('não duplica relações idênticas', grafo.relacoes.length === 3)
passo('vizinhanca de n1 inclui n2, n3 e a própria', vizinhancaDe('n1', grafo).size === 3)
passo('backlinks de n1 incluem n2', backlinksDe('n1', grafo).some((r) => r.origemId === 'n2'))
passo('backlinks de n3 contêm n1', backlinksDe('n3', grafo).some((r) => r.origemId === 'n1'))

const arvore: { type: string; children: Array<Record<string, unknown>> } = {
  type: 'root',
  children: [
    {
      type: 'paragraph',
      children: [{ type: 'text', value: 'Veja [[Fundamentos]] para detalhes e [[Perdida]] agora.' }],
    },
  ],
}
const transformar = pluginLinksInternos((titulo) => (titulo === 'Fundamentos' ? 'n2' : null))()
transformar(arvore as never)
const nos = arvore.children[0].children as Array<{
  type: string
  value?: string
  url?: string
  children?: Array<{ type: string; value?: string }>
}>
const link = nos.find((no) => no.type === 'link')
passo(
  'plugin cria link interno navegável',
  link !== undefined && link.url === '/notas/n2' && link.children?.[0]?.value === 'Fundamentos',
)
passo('plugin preserva texto ao redor', typeof nos[0].value === 'string' && nos[0].value === 'Veja ')
passo('wikilink sem destino permanece literal', nos.some((no) => no.type === 'text' && no.value === '[[Perdida]]'))

console.log(`\nGRAFO OK | ${passos} passos`)