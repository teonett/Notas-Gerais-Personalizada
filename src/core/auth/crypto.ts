import { AUT } from './constantes'
import { base64ParaBytes, bytesParaBase64 } from '../vault/cifrar'

export function gerarSalt(): string {
  return bytesParaBase64(crypto.getRandomValues(new Uint8Array(AUT.bytesSalt)))
}

function bytesDeTexto(texto: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(texto)
}

function opcoesPbkdf2(salt: string): Pbkdf2Params {
  return {
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: base64ParaBytes(salt),
    iterations: AUT.iteracoesPbkdf2,
  }
}

export async function materialDaConta(
  senha: string,
  salt: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const material = await crypto.subtle.importKey(
    'raw',
    bytesDeTexto(senha),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    opcoesPbkdf2(salt),
    material,
    AUT.bytesMaterial * 8,
  )
  return new Uint8Array(bits)
}

export async function chaveDeMaterial(material: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const conteudo = new Uint8Array(AUT.bytesChave)
  conteudo.set(material.subarray(0, AUT.bytesChave))
  return crypto.subtle.importKey(
    'raw',
    conteudo,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function verificadorDeMaterial(material: Uint8Array): string {
  return bytesParaBase64(
    material.subarray(AUT.bytesChave, AUT.bytesChave + AUT.bytesVerificador),
  )
}

export async function derivarChaveEVerificador(
  senha: string,
  salt: string,
): Promise<{ chave: CryptoKey; verificador: string }> {
  const material = await materialDaConta(senha, salt)
  const chave = await chaveDeMaterial(material)
  return { chave, verificador: verificadorDeMaterial(material) }
}

export async function digerirTexto(texto: string): Promise<string> {
  const digerido = await crypto.subtle.digest('SHA-256', bytesDeTexto(texto))
  return bytesParaBase64(new Uint8Array(digerido))
}

export function validarSenha(senha: string): string | null {
  if (senha.length < AUT.minimoSenha) {
    return `A senha precisa ter pelo menos ${AUT.minimoSenha} caracteres.`
  }
  if (senha.length > AUT.maximoSenha) {
    return `A senha pode ter no máximo ${AUT.maximoSenha} caracteres.`
  }
  return null
}

export function compararSegredos(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let diferenca = 0
  for (let i = 0; i < a.length; i += 1) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diferenca === 0
}