import { LIMITS } from '../../config/limits'
import type { FormatoNota } from '../../domain'
import { FORMATO_NOTA, STATUS_NOTA } from '../../domain'
import {
  exportarBackupFiel,
  importarBackupFiel,
  NOME_MANIFESTO_BACKUP_FIEL,
  type ResumoBackupFiel,
} from '../../core/dados/backup-fiel'
import {
  exportacaoParaPastaEhSuportada,
  exportarBackupFielParaPasta,
} from '../../core/dados/backup-fiel-pasta'
import {
  dividirNotasDoArquivo,
  montarTextoDeNotas,
  tituloDoArquivo,
} from '../../core/dados/intercambio'
import { importarDadosJson, montarJson, parseJsonIntercambio } from '../../core/dados/json'
import { htmlParaMarkdown } from '../../core/markdown'
import { cadernosStore, notasStore, tagsStore } from '../../core'
import type { MensagemOperacao, OpcoesExportacaoNotas } from './tipos'

const EXTENSAO_PARA_FORMATO: Record<string, FormatoNota | 'MARKDOWN'> = {
  txt: FORMATO_NOTA.TXT,
  md: 'MARKDOWN',
  markdown: 'MARKDOWN',
  html: 'MARKDOWN',
  htm: 'MARKDOWN',
}

function nomesComErro(nomes: string[]): string {
  if (nomes.length === 0) {
    return ''
  }
  const visiveis = nomes.slice(0, 3).join(', ')
  const restantes = nomes.length - 3
  return restantes > 0 ? `${visiveis} e mais ${restantes}` : visiveis
}

function baixarArquivo(nome: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function totalRestaurado(resumo: ResumoBackupFiel): number {
  return (
    resumo.notasCriadas +
    resumo.cadernosCriados +
    resumo.tagsCriadas +
    resumo.anexosCriados +
    resumo.metaCriadas +
    resumo.syncCriadas
  )
}

function mensagemBackupFiel(resumo: ResumoBackupFiel): MensagemOperacao {
  const total = totalRestaurado(resumo)
  const avisos: string[] = []

  if (resumo.duplicadosIgnorados > 0) {
    avisos.push(
      `${resumo.duplicadosIgnorados} duplicado${resumo.duplicadosIgnorados === 1 ? '' : 's'} ignorado${resumo.duplicadosIgnorados === 1 ? '' : 's'}`,
    )
  }
  if (resumo.anexosAusentes > 0) {
    avisos.push(
      `${resumo.anexosAusentes} anexo${resumo.anexosAusentes === 1 ? '' : 's'} ausente${resumo.anexosAusentes === 1 ? '' : 's'}`,
    )
  }
  if (total === 0 && resumo.anexosAusentes > 0) {
    return {
      tipo: 'erro',
      texto: `Backup fiel nao importado: ${resumo.anexosAusentes} anexo${resumo.anexosAusentes === 1 ? '' : 's'} ausente${resumo.anexosAusentes === 1 ? '' : 's'}. Selecione a pasta ou todos os arquivos do backup.`,
    }
  }

  return {
    tipo: avisos.length > 0 ? 'aviso' : 'sucesso',
    texto: `Backup fiel importado: ${total} registro${total === 1 ? '' : 's'} restaurado${total === 1 ? '' : 's'}.${avisos.length > 0 ? ` ${avisos.join('; ')}.` : ''}`,
  }
}

async function importarArquivoComum(arquivo: File): Promise<number> {
  const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? ''
  const texto = await arquivo.text()

  if (extensao === 'json') {
    const dados = parseJsonIntercambio(texto)
    if (dados === null) {
      throw new Error('arquivo JSON invalido')
    }
    const resumo = await importarDadosJson(dados)
    return resumo.notasCriadas
  }

  const tipo = EXTENSAO_PARA_FORMATO[extensao] ?? FORMATO_NOTA.TXT
  const ehHtml = extensao === 'html' || extensao === 'htm'
  const dividido = dividirNotasDoArquivo(extensao, texto)
  const plano = dividido ?? [
    {
      titulo: tituloDoArquivo(arquivo.name),
      conteudo: ehHtml ? htmlParaMarkdown(texto) : texto,
    },
  ]

  for (const nota of plano) {
    await notasStore.criar({
      titulo: nota.titulo === '' ? 'Sem titulo' : nota.titulo.slice(0, LIMITS.tituloNotaMaxCaracteres),
      conteudo: nota.conteudo,
      formato: tipo === 'MARKDOWN' ? FORMATO_NOTA.MARKDOWN : tipo,
    })
  }

  return plano.length
}

export async function importarArquivos(
  arquivos: FileList | File[] | null,
  restaurarSync: boolean,
): Promise<MensagemOperacao | null> {
  if (arquivos === null || arquivos.length === 0) {
    return null
  }

  const backupFiel = await importarBackupFiel(arquivos, { restaurarSync })
  if (backupFiel !== null) {
    return mensagemBackupFiel(backupFiel)
  }

  let importadas = 0
  const arquivosComErro: string[] = []

  for (const arquivo of Array.from(arquivos)) {
    try {
      importadas += await importarArquivoComum(arquivo)
    } catch {
      arquivosComErro.push(arquivo.name)
    }
  }

  const comErro = arquivosComErro.length
  const detalheErro = comErro > 0 ? ` Arquivos com erro: ${nomesComErro(arquivosComErro)}.` : ''
  const texto =
    `${importadas} nota${importadas === 1 ? '' : 's'} importada${importadas === 1 ? '' : 's'}${
      comErro > 0 ? `, ${comErro} arquivo${comErro === 1 ? '' : 's'} com erro` : ''
    }.${detalheErro}`

  if (importadas === 0 && comErro > 0) {
    return { tipo: 'erro', texto }
  }
  if (comErro > 0) {
    return { tipo: 'aviso', texto }
  }
  return { tipo: 'sucesso', texto }
}

export async function exportarBackupFielAplicacao(): Promise<MensagemOperacao> {
  const backup = await exportarBackupFiel()
  if (exportacaoParaPastaEhSuportada()) {
    await exportarBackupFielParaPasta(backup)
    return {
      tipo: 'sucesso',
      texto: `Backup fiel exportado na pasta thothnet-backup-fiel: manifesto e ${backup.anexos.length} anexo${backup.anexos.length === 1 ? '' : 's'}.`,
    }
  }

  baixarArquivo(
    NOME_MANIFESTO_BACKUP_FIEL,
    new Blob([JSON.stringify(backup.manifesto, null, 2)], {
      type: 'application/json;charset=utf-8',
    }),
  )
  for (const anexo of backup.anexos) {
    baixarArquivo(anexo.nome, anexo.dados)
  }
  return {
    tipo: 'sucesso',
    texto: `Backup fiel exportado: manifesto e ${backup.anexos.length} anexo${backup.anexos.length === 1 ? '' : 's'} baixado${backup.anexos.length === 1 ? '' : 's'}.`,
  }
}

export async function exportarNotasAplicacao({
  formatoExportacao,
  escopoExportacao,
  escopoJson,
}: OpcoesExportacaoNotas): Promise<MensagemOperacao> {
  const todas = await notasStore.listarTodas()
  const selecionadas = todas
    .filter((nota) => {
      if (escopoExportacao === 'ATIVAS') return nota.status === STATUS_NOTA.ATIVA
      if (escopoExportacao === 'ARQUIVADAS') return nota.status === STATUS_NOTA.ARQUIVADA
      return nota.status !== STATUS_NOTA.LIXEIRA
    })
    .sort((a, b) => b.alteradaEm.localeCompare(a.alteradaEm))

  if (selecionadas.length === 0 && escopoJson !== 'CADERNOS') {
    return { tipo: 'aviso', texto: 'Nenhuma nota no escopo selecionado para exportar.' }
  }

  if (formatoExportacao === 'JSON') {
    const [cadernos, tags] = await Promise.all([
      cadernosStore.listarTodas(),
      tagsStore.listarTodas(),
    ])
    const texto = montarJson(cadernos, tags, selecionadas, escopoJson)
    const data = new Date().toISOString().slice(0, 10)
    baixarArquivo(
      `thothnet-notas-${data}.json`,
      new Blob([texto], { type: 'application/json;charset=utf-8' }),
    )
    return {
      tipo: 'sucesso',
      texto:
        escopoJson === 'CADERNOS'
          ? `${cadernos.length} caderno${cadernos.length === 1 ? '' : 's'} exportado${cadernos.length === 1 ? '' : 's'} em JSON.`
          : `${selecionadas.length} nota${selecionadas.length === 1 ? '' : 's'} e ${cadernos.length} caderno${cadernos.length === 1 ? '' : 's'}${escopoJson === 'TUDO' ? ` e ${tags.length} tag${tags.length === 1 ? '' : 's'}` : ''} exportado${selecionadas.length === 1 ? '' : 's'} em JSON.`,
    }
  }

  const texto = montarTextoDeNotas(selecionadas, formatoExportacao)
  const extensao = formatoExportacao === 'MARKDOWN' ? 'md' : formatoExportacao.toLowerCase()
  const data = new Date().toISOString().slice(0, 10)
  baixarArquivo(
    `thothnet-notas-${data}.${extensao}`,
    new Blob([texto], {
      type:
        formatoExportacao === 'HTML'
          ? 'text/html;charset=utf-8'
          : 'text/plain;charset=utf-8',
    }),
  )
  return {
    tipo: 'sucesso',
    texto: `${selecionadas.length} nota${selecionadas.length === 1 ? '' : 's'} exportada${selecionadas.length === 1 ? '' : 's'} em ${formatoExportacao}.`,
  }
}
