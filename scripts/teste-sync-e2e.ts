import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as dormir } from 'node:timers/promises'
import { IDBFactory } from 'fake-indexeddb'
import { notasStore } from '../src/core/repositorios/notas'
import { fecharBancoDeDados } from '../src/core/storage/idb'
import { sincronizar } from '../src/sync/transportar'
import { salvarConfiguracaoSync } from '../src/sync/config'

const PORTA = 8787
const URL_BASE = `http://127.0.0.1:${PORTA}`
const SEGREDO = 'segredo-de-teste-local'
const RAIZ = path.resolve(import.meta.dirname, '..')
const PASTA_WORKER = path.join(RAIZ, 'cloud', 'workers', 'thoth-sync')
const PERSISTENCIA = path.join(os.tmpdir(), 'thothnet-e2e-persist')
const VARS_DESENVOLVIMENTO = path.join(PASTA_WORKER, '.dev.vars')
const WranglerJs: string = createRequire(path.join(PASTA_WORKER, 'package.json')).resolve('wrangler')

let passos = 0

function passo(nome: string, condicao: boolean): void {
  passos += 1
  if (!condicao) {
    throw new Error(`FALHOU (passo ${passos}): ${nome}`)
  }
  console.log(`OK | passo ${passos} | ${nome}`)
}

function ativarNovoDispositivo(): void {
  const g = globalThis as typeof globalThis & {
    window?: unknown
    indexedDB?: unknown
    IDBKeyRange?: unknown
  }
  g.window = globalThis
  g.indexedDB = new IDBFactory()
}

async function iniciarServidor(): Promise<ReturnType<typeof spawn>> {
  await rm(PERSISTENCIA, { recursive: true, force: true })
  await mkdir(PERSISTENCIA, { recursive: true })
  await writeFile(VARS_DESENVOLVIMENTO, `SEGREDO=${SEGREDO}\n`, 'utf8')
  return spawn(
    process.execPath,
    [WranglerJs, 'dev', '--local', '--persist-to', PERSISTENCIA, '--port', String(PORTA), '--ip', '127.0.0.1'],
    {
      cwd: PASTA_WORKER,
      stdio: 'ignore',
    },
  )
}

async function aguardarServidor(): Promise<void> {
  for (let i = 0; i < 45; i += 1) {
    try {
      const resposta = await fetch(`${URL_BASE}/`)
      if (resposta.status === 401) {
        return
      }
    } catch {
      // servidor ainda subindo
    }
    await dormir(1500)
  }
  throw new Error('Servidor do worker não respondeu a tempo.')
}

async function encerrarServidor(filho: ReturnType<typeof spawn>): Promise<void> {
  if (filho.pid !== undefined) {
    spawn('taskkill', ['/pid', String(filho.pid), '/T', '/F'], { stdio: 'ignore' })
  }
  await rm(VARS_DESENVOLVIMENTO, { force: true })
  await dormir(1500)
}

async function principal(): Promise<void> {
  const servidor = await iniciarServidor()
  try {
    await aguardarServidor()

    // Dispositivo A: cria nota e sincroniza
    ativarNovoDispositivo()
    await salvarConfiguracaoSync({ urlBase: URL_BASE, segredo: SEGREDO })
    const notaA = await notasStore.criar({
      titulo: 'Nota do dispositivo A',
      conteudo: '# Origem',
      formato: 'MARKDOWN',
      cadernoId: null,
      tagIds: [],
    })
    const r1 = await sincronizar()
    passo('A envia a nota criada (push)', r1.enviadas >= 1)
    const notasAposPush = await notasStore.listarTodas()
    passo(
      'A não duplica a própria nota após o pull do ciclo',
      notasAposPush.length === 1 && notasAposPush[0]?.id === notaA.id && notasAposPush[0]?.conteudo === '# Origem',
    )
    await fecharBancoDeDados()

    // Dispositivo B: puxa a nota de A
    ativarNovoDispositivo()
    await salvarConfiguracaoSync({ urlBase: URL_BASE, segredo: SEGREDO })
    const r2 = await sincronizar()
    const notasB = await notasStore.listarTodas()
    const aEmB = notasB.find((n) => n.id === notaA.id)
    passo('B recebe a nota criada por A (pull)', r2.recebidas >= 1 && aEmB !== undefined)
    passo('Conteúdo da nota autêntico em B', aEmB?.conteudo === '# Origem')

    // Dispositivo B: cria outra nota e sincroniza
    const notaB = await notasStore.criar({
      titulo: 'Nota do dispositivo B',
      conteudo: '## Resposta',
      formato: 'MARKDOWN',
      cadernoId: null,
      tagIds: [],
    })
    const r3 = await sincronizar()
    passo('B envia a nota que criou', r3.enviadas >= 1)
    await fecharBancoDeDados()

    // Dispositivo A: recebe a nota de B
    ativarNovoDispositivo()
    await salvarConfiguracaoSync({ urlBase: URL_BASE, segredo: SEGREDO })
    const r4 = await sincronizar()
    const notasA = await notasStore.listarTodas()
    passo('A recebe a nota criada por B', r4.recebidas >= 1 && notasA.some((n) => n.id === notaB.id))
    await fecharBancoDeDados()

    // Dispositivo A: remove a nota definitivamente e sincroniza
    ativarNovoDispositivo()
    await salvarConfiguracaoSync({ urlBase: URL_BASE, segredo: SEGREDO })
    await notasStore.remover([notaA.id])
    const r5 = await sincronizar()
    passo('A propaga a exclusão (tombstone)', r5.enviadas >= 1)
    await fecharBancoDeDados()

    // Dispositivo B: aplica o tombstone
    ativarNovoDispositivo()
    await salvarConfiguracaoSync({ urlBase: URL_BASE, segredo: SEGREDO })
    const r6 = await sincronizar()
    const notasB2 = await notasStore.listarTodas()
    passo('B remove a nota excluída por A', r6.recebidas >= 1 && !notasB2.some((n) => n.id === notaA.id))
    passo('B mantém a própria nota', notasB2.some((n) => n.id === notaB.id))

    console.log(`Todos os passos passaram (${passos}).`)
  } finally {
    await encerrarServidor(servidor)
  }
}

principal().catch((erro: unknown) => {
  console.error(erro)
  process.exitCode = 1
})
