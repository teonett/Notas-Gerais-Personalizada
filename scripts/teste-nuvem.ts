import { IDBFactory } from 'fake-indexeddb'
import { normalizarStopword, normalizarTop } from '../src/core/nuvem/config'
import { NUVEM, lerConfiguracaoNuvem, salvarConfiguracaoNuvem } from '../src/core/nuvem/config'
import type { Nota } from '../src/domain'
import { STATUS_NOTA } from '../src/domain'
import { listarFrequenciasDeTermos } from '../src/core/grafo'

const g = globalThis as typeof globalThis & {
  window?: unknown
  indexedDB?: unknown
}
g.window = globalThis
g.indexedDB = new IDBFactory()

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

function nota(id: string, titulo: string, conteudo: string): Nota {
  return {
    id,
    titulo,
    conteudo,
    formato: 'MARKDOWN',
    status: STATUS_NOTA.ATIVA,
    favorita: false,
    fixada: false,
    cadernoId: null,
    tagIds: [],
    criadaEm: new Date().toISOString(),
    alteradaEm: new Date().toISOString(),
    excluidaEm: null,
  }
}

function repetir(marca: string, vezes: number): string {
  return Array.from({ length: vezes }, () => marca).join(' ')
}

async function main() {
  const vazio = await lerConfiguracaoNuvem()
  passo('sem configuração usa os padrões', vazio.top === NUVEM.topPadrao && vazio.stopwords.length === 0)

  const notas: Nota[] = [
    nota('n1', 'Sprint', repetir('sprint', 5)),
    nota('n2', 'Sprint', repetir('sprint', 5)),
    nota('n3', 'Reunião', repetir('reunião', 5)),
    nota('n4', 'Reunião', repetir('reunião', 5)),
    nota('n5', 'Rotina', repetir('rotina', 5)),
  ]

  const semExtras = listarFrequenciasDeTermos(notas)
  passo('sem extras o termo sprint lidera', semExtras[0]?.termo === 'sprint')

  const bloqueioSprint = listarFrequenciasDeTermos(notas, new Set(['sprint']))
  passo('extra exclui o termo do topo', bloqueioSprint[0]?.termo !== 'sprint' && !bloqueioSprint.some((f) => f.termo === 'sprint'))

  const bloqueioSemAcento = listarFrequenciasDeTermos(notas, new Set(['reuniao']))
  passo('extra sem acento bloqueia termo acentuado', !bloqueioSemAcento.some((f) => f.termo === 'reuniao'))

  passo('normalizarTop aplica o padrão para não numérico', normalizarTop(NaN) === NUVEM.topPadrao)
  passo('normalizarTop aplica o padrão para texto inválido', normalizarTop('abc') === NUVEM.topPadrao)
  passo('normalizarTop limita para baixo', normalizarTop(3) === NUVEM.topMinimo)
  passo('normalizarTop limita para cima', normalizarTop(200000) === NUVEM.topMaximo)
  passo('normalizarTop aceita valor válido', normalizarTop(120) === 120)
  passo('normalizarStopword normaliza caixa e acento', normalizarStopword('  ProjEto  ') === 'projeto')

  await salvarConfiguracaoNuvem({ top: 42, stopwords: ['Reunião', 'projeto', 'projeto', ''] })
  const carregada = await lerConfiguracaoNuvem()

  passo('salvar persiste o top', carregada.top === 42)
  passo('salvar normaliza e deduplica stopwords', carregada.stopwords.length === 2 && carregada.stopwords.includes('reuniao') && carregada.stopwords.includes('projeto'))

  await salvarConfiguracaoNuvem({ top: NUVEM.topMaximo + 1, stopwords: [] })
  const limitada = await lerConfiguracaoNuvem()
  passo('salvar limita o top ao máximo', limitada.top === NUVEM.topMaximo)

  const comExtrasPersistidos = listarFrequenciasDeTermos(notas, new Set(carregada.stopwords))
  passo('stopwords persistidas bloqueiam na nuvem', !comExtrasPersistidos.some((f) => f.termo === 'projeto' || f.termo === 'reuniao'))

  console.log(`\n${passos} passos de nuvem passaram.`)
}

void main()