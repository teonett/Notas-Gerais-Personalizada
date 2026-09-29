import type { BackupFielExportado } from './backup-fiel'
import { NOME_MANIFESTO_BACKUP_FIEL } from './backup-fiel'

export const NOME_PASTA_BACKUP_FIEL = 'thothnet-backup-fiel'

type ManipuladorArquivo = {
  createWritable(): Promise<ManipuladorEscrita>
}

type ManipuladorEscrita = {
  close(): Promise<void>
  write(dados: Blob | string): Promise<void>
}

type ManipuladorDiretorio = {
  getDirectoryHandle(nome: string, opcoes?: { create?: boolean }): Promise<ManipuladorDiretorio>
  getFileHandle(nome: string, opcoes?: { create?: boolean }): Promise<ManipuladorArquivo>
}

type JanelaComSeletorDiretorio = Window & {
  showDirectoryPicker?: () => Promise<ManipuladorDiretorio>
}

async function gravarArquivo(
  diretorio: ManipuladorDiretorio,
  nome: string,
  dados: Blob | string,
): Promise<void> {
  const arquivo = await diretorio.getFileHandle(nome, { create: true })
  const escrita = await arquivo.createWritable()
  await escrita.write(dados)
  await escrita.close()
}

export function exportacaoParaPastaEhSuportada(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function exportarBackupFielParaPasta(backup: BackupFielExportado): Promise<void> {
  const seletor = (window as JanelaComSeletorDiretorio).showDirectoryPicker
  if (seletor === undefined) {
    throw new Error('Exportacao para pasta nao suportada neste navegador.')
  }

  const raiz = await seletor()
  const pasta = await raiz.getDirectoryHandle(NOME_PASTA_BACKUP_FIEL, { create: true })
  await gravarArquivo(
    pasta,
    NOME_MANIFESTO_BACKUP_FIEL,
    JSON.stringify(backup.manifesto, null, 2),
  )

  for (const anexo of backup.anexos) {
    await gravarArquivo(pasta, anexo.nome, anexo.dados)
  }
}
