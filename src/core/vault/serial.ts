import { base64ParaBytes, bytesParaBase64 } from './cifrar'

const MARCA_BLOB = 'blobBase64'

interface BlobEmBase64 {
  marca: typeof MARCA_BLOB
  mime: string
  base64: string
}

function ehBlobEmBase64(valor: unknown): valor is BlobEmBase64 {
  return (
    valor !== null &&
    typeof valor === 'object' &&
    (valor as Record<string, unknown>).marca === MARCA_BLOB
  )
}

export async function valorPersistivel(valor: unknown): Promise<unknown> {
  if (valor instanceof Blob) {
    const marcador: BlobEmBase64 = {
      marca: MARCA_BLOB,
      mime: valor.type,
      base64: bytesParaBase64(new Uint8Array(await valor.arrayBuffer())),
    }
    return marcador
  }

  if (Array.isArray(valor)) {
    const convertido: unknown[] = []
    for (const item of valor) {
      convertido.push(await valorPersistivel(item))
    }
    return convertido
  }

  if (valor !== null && typeof valor === 'object' && !(valor instanceof Date)) {
    const registro = valor as Record<string, unknown>
    const convertido: Record<string, unknown> = {}
    for (const [chave, item] of Object.entries(registro)) {
      convertido[chave] = await valorPersistivel(item)
    }
    return convertido
  }

  return valor
}

export function valorDoPersistivel(valor: unknown): unknown {
  if (ehBlobEmBase64(valor)) {
    return new Blob([base64ParaBytes(valor.base64)], { type: valor.mime })
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => valorDoPersistivel(item))
  }

  if (valor !== null && typeof valor === 'object' && !(valor instanceof Blob)) {
    const registro = valor as Record<string, unknown>
    const convertido: Record<string, unknown> = {}
    for (const [chave, item] of Object.entries(registro)) {
      convertido[chave] = valorDoPersistivel(item)
    }
    return convertido
  }

  return valor
}