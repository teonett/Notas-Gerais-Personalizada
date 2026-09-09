import { compararRevisoes, TAMANHO_LOTE } from './contrato'
import type { RegistroSync, Revisao, TipoRegistro } from './contrato'

interface Env {
  THOTH_DB: D1Database
  THOTH_ANEXOS: R2Bucket
  SEGREDO: string
}

const CORS_CABECALHOS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-anexo-nome, x-anexo-mime',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
} as const

function okJson(dados: unknown, status = 200): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      ...CORS_CABECALHOS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function erroJson(status: number, mensagem: string, codigo: string): Response {
  return okJson({ erro: { codigo, mensagem } }, status)
}

function autorizado(request: Request, segredo: string): boolean {
  const autorizacao = request.headers.get('Authorization') ?? ''
  const esperado = `Bearer ${segredo}`
  if (autorizacao.length !== esperado.length) {
    return false
  }
  let diferenca = 0
  for (let i = 0; i < autorizacao.length; i += 1) {
    diferenca |= autorizacao.charCodeAt(i) ^ esperado.charCodeAt(i)
  }
  return diferenca === 0
}

interface LinhaRegistro {
  tipo: TipoRegistro
  id: string
  revisao_carimbo: number
  revisao_dispositivo: string
  apagado: number
  dados: string | null
}

function linhaParaRegistro(linha: LinhaRegistro): RegistroSync {
  return {
    tipo: linha.tipo,
    id: linha.id,
    revisao: { carimbo: linha.revisao_carimbo, dispositivo: linha.revisao_dispositivo },
    apagado: linha.apagado === 1,
    dados:
      linha.dados === null ? null : (JSON.parse(linha.dados) as Record<string, unknown>),
  }
}

async function gravarRegistro(env: Env, registro: RegistroSync): Promise<void> {
  const existente = await env.THOTH_DB.prepare(
    'SELECT revisao_carimbo, revisao_dispositivo FROM registros WHERE tipo = ?1 AND id = ?2',
  )
    .bind(registro.tipo, registro.id)
    .first<{ revisao_carimbo: number; revisao_dispositivo: string }>()

  const revisaoExistente: Revisao | null =
    existente === null || existente === undefined
      ? null
      : { carimbo: existente.revisao_carimbo, dispositivo: existente.revisao_dispositivo }

  if (revisaoExistente !== null && compararRevisoes(registro.revisao, revisaoExistente) <= 0) {
    return
  }

  await env.THOTH_DB.prepare(
    `INSERT INTO registros (tipo, id, revisao_carimbo, revisao_dispositivo, apagado, dados, criado_em)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT(tipo, id) DO UPDATE SET
       revisao_carimbo = excluded.revisao_carimbo,
       revisao_dispositivo = excluded.revisao_dispositivo,
       apagado = excluded.apagado,
       dados = excluded.dados,
       criado_em = excluded.criado_em`,
  )
    .bind(
      registro.tipo,
      registro.id,
      registro.revisao.carimbo,
      registro.revisao.dispositivo,
      registro.apagado ? 1 : 0,
      registro.dados === null ? null : JSON.stringify(registro.dados),
      new Date().toISOString(),
    )
    .run()

  if (registro.tipo === 'anexo' && registro.apagado) {
    await env.THOTH_ANEXOS.delete(`anexos/${registro.id}`)
  }
}

let schemaPronto: Promise<void> | null = null

const SQL_CRIAR_SCHEMA = `
CREATE TABLE IF NOT EXISTS registros (
  tipo TEXT NOT NULL,
  id TEXT NOT NULL,
  revisao_carimbo INTEGER NOT NULL,
  revisao_dispositivo TEXT NOT NULL,
  apagado INTEGER NOT NULL DEFAULT 0,
  dados TEXT,
  criado_em TEXT NOT NULL,
  PRIMARY KEY (tipo, id)
);
CREATE INDEX IF NOT EXISTS idx_registros_revisao
  ON registros (revisao_carimbo, revisao_dispositivo);
`

function garantirSchema(env: Env): Promise<void> {
  if (schemaPronto === null) {
    schemaPronto = env.THOTH_DB.prepare(SQL_CRIAR_SCHEMA).run().then(() => undefined)
  }
  return schemaPronto
}

async function tratarPush(request: Request, env: Env): Promise<Response> {
  await garantirSchema(env)
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return erroJson(400, 'Corpo inválido.', 'CORPO_INVALIDO')
  }
  const mudancas = (corpo as { mudancas?: unknown }).mudancas
  if (!Array.isArray(mudancas)) {
    return erroJson(400, 'Lista de mudanças ausente.', 'SOLICITACAO_INVALIDA')
  }

  const aceitas: RegistroSync[] = []
  for (const item of mudancas) {
    const registro = item as RegistroSync
    if (
      typeof registro !== 'object' ||
      registro === null ||
      typeof registro.tipo !== 'string' ||
      typeof registro.id !== 'string' ||
      typeof registro.revisao?.carimbo !== 'number' ||
      typeof registro.revisao?.dispositivo !== 'string'
    ) {
      continue
    }
    await gravarRegistro(env, registro)
    aceitas.push(registro)
  }

  return okJson({ aceitas })
}

async function tratarPull(request: Request, env: Env): Promise<Response> {
  await garantirSchema(env)
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return erroJson(400, 'Corpo inválido.', 'CORPO_INVALIDO')
  }
  const desde = (corpo as { desde?: Revisao | null }).desde

  let linhas: D1Result<LinhaRegistro>
  if (desde === null || desde === undefined) {
    linhas = await env.THOTH_DB.prepare(
      `SELECT tipo, id, revisao_carimbo, revisao_dispositivo, apagado, dados FROM registros
       ORDER BY revisao_carimbo, revisao_dispositivo
       LIMIT ?1`,
    )
      .bind(TAMANHO_LOTE)
      .all<LinhaRegistro>()
  } else if (typeof desde.carimbo === 'number' && typeof desde.dispositivo === 'string') {
    linhas = await env.THOTH_DB.prepare(
      `SELECT tipo, id, revisao_carimbo, revisao_dispositivo, apagado, dados FROM registros
       WHERE revisao_carimbo > ?1 OR (revisao_carimbo = ?1 AND revisao_dispositivo > ?2)
       ORDER BY revisao_carimbo, revisao_dispositivo
       LIMIT ?3`,
    )
      .bind(desde.carimbo, desde.dispositivo, TAMANHO_LOTE)
      .all<LinhaRegistro>()
  } else {
    return erroJson(400, 'Cursor inválido.', 'SOLICITACAO_INVALIDA')
  }

  return okJson({ mudancas: linhas.results.map(linhaParaRegistro) })
}

async function tratarBlob(request: Request, env: Env, id: string): Promise<Response> {
  if (id === '') {
    return erroJson(400, 'Identificador de anexo ausente.', 'SOLICITACAO_INVALIDA')
  }
  const chave = `anexos/${id}`

  if (request.method === 'PUT') {
    const bytes = await request.arrayBuffer()
    const mime = request.headers.get('x-anexo-mime') ?? 'application/octet-stream'
    const nome = request.headers.get('x-anexo-nome') ?? id
    await env.THOTH_ANEXOS.put(chave, bytes, {
      httpMetadata: { contentType: mime },
      customMetadata: { nome, mime },
    })
    return new Response(null, { status: 204, headers: CORS_CABECALHOS })
  }

  if (request.method === 'DELETE') {
    await env.THOTH_ANEXOS.delete(chave)
    return new Response(null, { status: 204, headers: CORS_CABECALHOS })
  }

  if (request.method === 'GET') {
    const objeto = await env.THOTH_ANEXOS.get(chave)
    if (objeto === null) {
      return erroJson(404, 'Anexo não encontrado.', 'ANEXO_AUSENTE')
    }
    const cabecalhos = new Headers(CORS_CABECALHOS)
    objeto.writeHttpMetadata(cabecalhos)
    const mimeArmazenado =
      objeto.httpMetadata?.contentType ??
      (objeto.customMetadata ?? {})['mime'] ??
      'application/octet-stream'
    cabecalhos.set('content-type', mimeArmazenado)
    return new Response(objeto.body, { headers: cabecalhos })
  }

  return erroJson(405, 'Método não permitido.', 'METODO_NAO_PERMITIDO')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_CABECALHOS })
    }

    if (!autorizado(request, env.SEGREDO)) {
      return erroJson(401, 'Não autorizado.', 'FALHA_AUTENTICACAO')
    }

    const url = new URL(request.url)
    const caminho = url.pathname

    if (caminho === '/api/sync/push' && request.method === 'POST') {
      return tratarPush(request, env)
    }
    if (caminho === '/api/sync/pull' && request.method === 'POST') {
      return tratarPull(request, env)
    }
    if (caminho.startsWith('/api/anexos/')) {
      const id = decodeURIComponent(caminho.slice('/api/anexos/'.length))
      return tratarBlob(request, env, id)
    }

    return erroJson(404, 'Rota não encontrada.', 'ROTA_AUSENTE')
  },
}