export interface EnvelopeCifrado {
  v: 1
  iv: string
  dados: string
}

const TAMANHO_IV = 12
const PEDACO_BASE64 = 0x8000

export function ehEnvelope(valor: unknown): valor is EnvelopeCifrado {
  if (valor === null || typeof valor !== 'object') {
    return false
  }
  const candidato = valor as Record<string, unknown>
  return (
    candidato.v === 1 &&
    typeof candidato.iv === 'string' &&
    typeof candidato.dados === 'string'
  )
}

export function bytesParaBase64(bytes: Uint8Array): string {
  let resultado = ''
  for (let i = 0; i < bytes.length; i += PEDACO_BASE64) {
    const fatia = bytes.subarray(i, i + PEDACO_BASE64)
    let binaria = ''
    for (let j = 0; j < fatia.length; j += 1) {
      binaria += String.fromCharCode(fatia[j])
    }
    resultado += btoa(binaria)
  }
  return resultado
}

export function base64ParaBytes(texto: string): Uint8Array<ArrayBuffer> {
  const binaria = atob(texto)
  const resultado = new Uint8Array(binaria.length)
  for (let i = 0; i < binaria.length; i += 1) {
    resultado[i] = binaria.charCodeAt(i)
  }
  return resultado
}

export async function cifrarBytes(
  chave: CryptoKey,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<EnvelopeCifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(TAMANHO_IV))
  const cifrado = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    chave,
    bytes,
  )
  return {
    v: 1,
    iv: bytesParaBase64(iv),
    dados: bytesParaBase64(new Uint8Array(cifrado)),
  }
}

export async function decifrarBytes(
  chave: CryptoKey,
  envelope: EnvelopeCifrado,
): Promise<Uint8Array<ArrayBuffer>> {
  const decifrado = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ParaBytes(envelope.iv) },
    chave,
    base64ParaBytes(envelope.dados),
  )
  return new Uint8Array(decifrado)
}

export async function cifrarRegistro(
  chave: CryptoKey,
  valor: unknown,
): Promise<EnvelopeCifrado> {
  return cifrarBytes(chave, new TextEncoder().encode(JSON.stringify(valor)))
}

export async function decifrarRegistro<T>(
  chave: CryptoKey,
  envelope: EnvelopeCifrado,
): Promise<T> {
  const decifrado = await decifrarBytes(chave, envelope)
  return JSON.parse(new TextDecoder().decode(decifrado)) as T
}