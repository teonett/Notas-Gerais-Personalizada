import { STATUS_NOTA } from '../src/domain/tipos'
import type { Nota } from '../src/domain/nota'
import type { Tag } from '../src/domain/tag'
import {
  backlinksDe,
  construirGrafoDeNotas,
  extrairLinksDoTexto,
  listarFrequenciasDeTermos,
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
    tagIds: [],
    favorita: false,
    fixada: false,
    alteradaEm: new Date().toISOString(),
    excluidaEm: null,
    ...parcial,
  }
}

const notas: Nota[] = [
  nota({ id: 'n1', titulo: 'Arquitetura', conteudo: 'Ver [[Fundamentos]] e [[Testes]].' }),
  nota({ id: 'n2', titulo: 'Fundamentos', conteudo: 'Liga para [[Arquitetura]].' }),
  nota({ id: 'n3', titulo: 'Testes', conteudo: 'Sem links.', tagIds: ['t-arq'] }),
  nota({ id: 'n4', titulo: 'Perdida', conteudo: 'Aponta para [[Inexistente]] e para si mesma [[Perdida]]' }),
  nota({ id: 'n5', titulo: 'Arquitetura', conteudo: 'Duplicado de título; deve ser ignorado na resolução.', tagIds: ['t-arq'] }),
  nota({ id: 'n6', titulo: 'Arquivada', conteudo: '[[Arquitetura]]', status: STATUS_NOTA.ARQUIVADA }),
]

const tags: Tag[] = [
  { id: 't-arq', nome: 'Arquitetura', criadaEm: new Date().toISOString() },
  { id: 't-outra', nome: 'Outra', criadaEm: new Date().toISOString() },
]

const grafo = construirGrafoDeNotas(notas, tags)
const frequencias = listarFrequenciasDeTermos(notas)

passo('extrai wikilinks do texto', JSON.stringify(extrairLinksDoTexto('a [[X]] b [[Y]] [[Z]]')) === '["X","Y","Z"]')
passo('normaliza título', normalizarTitulo('  Clean   Code  ') === 'clean code')
passo('exclui notas não ativas do grafo', grafo.notasAtivas.length === 5)
passo('exclui link para si mesma e destino inexistente', grafo.relacoes.every((r) => r.destinoId !== 'n4'))
passo('resolve primeiro título duplicado', grafo.resolverPorTitulo('Arquitetura') === 'n1')

passo('cria relação wikilink n1 -> n2', grafo.porTipo.wikilink.some((r) => r.origemId === 'n1' && r.destinoId === 'n2'))
passo('cria relação wikilink n1 -> n3', grafo.porTipo.wikilink.some((r) => r.origemId === 'n1' && r.destinoId === 'n3'))
passo('cria relação wikilink n2 -> n1', grafo.porTipo.wikilink.some((r) => r.origemId === 'n2' && r.destinoId === 'n1'))
passo('não duplica wikilinks idênticos', grafo.porTipo.wikilink.length === 3)

const relacaoDeTag = grafo.porTipo.tag.find((r) => r.origemId === 'n3' && r.destinoId === 'n5')
passo('cria relação de tag entre notas com tag em comum', relacaoDeTag !== undefined)
passo('rótulo da relação de tag traz o nome da tag', relacaoDeTag?.rotulo === 'Arquitetura')

passo('cria relação de termo n1 <-> n2', grafo.porTipo.termo.some((r) => r.origemId === 'n1' && r.destinoId === 'n2'))
passo('cria relação de termo n1 <-> n3', grafo.porTipo.termo.some((r) => r.origemId === 'n1' && r.destinoId === 'n3'))
passo('rótulo da relação de termo traz o termo', grafo.porTipo.termo.some((r) => r.rotulo === 'fundamentos' || r.rotulo === 'testes'))

const primeira = frequencias[0]
const ultima = frequencias[frequencias.length - 1]
passo(
  'frequências ordenadas por peso',
  primeira !== undefined && ultima !== undefined && primeira.peso >= ultima.peso,
)
passo('não inclui stopwords', frequencias.every(({ termo }) => termo !== 'para' && termo !== 'como'))
passo('exclui termo presente em muitas notas (arquitetura)', frequencias.every(({ termo }) => termo !== 'arquitetura'))

const contagemPorTipo = `wikilink=${grafo.porTipo.wikilink.length},tag=${grafo.porTipo.tag.length},termo=${grafo.porTipo.termo.length}`
passo('contagem por tipo é consistente', contagemPorTipo === 'wikilink=3,tag=1,termo=2')
passo('backlinks consideram apenas wikilinks', backlinksDe('n1', grafo).length === 1)

passo('vizinhanca de n1 mescla todos os tipos (n1, n2, n3)', vizinhancaDe('n1', grafo).size === 3)
passo('vizinhanca de n3 inclui vizinho por tag (n5)', vizinhancaDe('n3', grafo).has('n5'))

passo('não cria relação de tag para tag sem par', grafo.porTipo.tag.every((r) => r.rotulo !== 'Outra'))

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