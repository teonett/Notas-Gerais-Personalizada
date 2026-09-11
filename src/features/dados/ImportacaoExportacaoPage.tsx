import { useCallback, useRef, useState } from 'react'
import { FileDown, FileUp } from 'lucide-react'
import { Button, Card, PageHeader } from '../../components/ui'
import { LIMITS } from '../../config/limits'
import { htmlParaMarkdown } from '../../core/markdown'
import type { FormatoNota } from '../../domain'
import { FORMATO_NOTA, STATUS_NOTA } from '../../domain'
import {
  dividirNotasDoArquivo,
  montarTextoDeNotas,
  tituloDoArquivo,
} from '../../core/dados/intercambio'
import { notasStore } from '../../core'

type FormatoExportacao = FormatoNota
type EscopoExportacao = 'ATIVAS' | 'ARQUIVADAS' | 'TODAS'

const EXTENSAO_PARA_FORMATO: Record<string, FormatoNota | 'MARKDOWN'> = {
  txt: FORMATO_NOTA.TXT,
  md: 'MARKDOWN',
  markdown: 'MARKDOWN',
  html: 'MARKDOWN',
  htm: 'MARKDOWN',
}

export function ImportacaoExportacaoPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  const importar = useCallback(async (arquivos: FileList | null) => {
    if (arquivos === null || arquivos.length === 0) return
    setImportando(true)
    setMensagem(null)
    let importadas = 0
    let comErro = 0

    try {
      for (const arquivo of Array.from(arquivos)) {
        try {
          const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? ''
          const tipo = EXTENSAO_PARA_FORMATO[extensao] ?? FORMATO_NOTA.TXT
          const ehHtml = extensao === 'html' || extensao === 'htm'
          const texto = await arquivo.text()
          const dividido = dividirNotasDoArquivo(extensao, texto)
          const plano = dividido ?? [
            {
              titulo: tituloDoArquivo(arquivo.name),
              conteudo: ehHtml ? htmlParaMarkdown(texto) : texto,
            },
          ]
          for (const nota of plano) {
            await notasStore.criar({
              titulo: nota.titulo === '' ? 'Sem título' : nota.titulo.slice(0, LIMITS.tituloNotaMaxCaracteres),
              conteudo: nota.conteudo,
              formato: tipo === 'MARKDOWN' ? FORMATO_NOTA.MARKDOWN : tipo,
            })
            importadas += 1
          }
        } catch {
          comErro += 1
        }
      }
      setMensagem(
        `${importadas} nota${importadas === 1 ? '' : 's'} importada${importadas === 1 ? '' : 's'}${
          comErro > 0 ? `, ${comErro} arquivo${comErro === 1 ? '' : 's'} com erro` : ''
        }.`,
      )
    } finally {
      setImportando(false)
      if (inputRef.current !== null) {
        inputRef.current.value = ''
      }
    }
  }, [])

  const [formatoExportacao, setFormatoExportacao] = useState<FormatoExportacao>('MARKDOWN')
  const [escopoExportacao, setEscopoExportacao] = useState<EscopoExportacao>('TODAS')

  const exportar = useCallback(async () => {
    setExportando(true)
    setMensagem(null)
    try {
      const todas = await notasStore.listarTodas()
      const selecionadas = todas
        .filter((nota) => {
          if (escopoExportacao === 'ATIVAS') return nota.status === STATUS_NOTA.ATIVA
          if (escopoExportacao === 'ARQUIVADAS') return nota.status === STATUS_NOTA.ARQUIVADA
          return nota.status !== STATUS_NOTA.LIXEIRA
        })
        .sort((a, b) => b.alteradaEm.localeCompare(a.alteradaEm))

      if (selecionadas.length === 0) {
        setMensagem('Nenhuma nota no escopo selecionado para exportar.')
        return
      }

      const texto = montarTextoDeNotas(selecionadas, formatoExportacao)

      const extensao = formatoExportacao === 'MARKDOWN' ? 'md' : formatoExportacao.toLowerCase()
      const data = new Date().toISOString().slice(0, 10)
      const blob = new Blob([texto], {
        type:
          formatoExportacao === 'HTML'
            ? 'text/html;charset=utf-8'
            : 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `thothnet-notas-${data}.${extensao}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setMensagem(`${selecionadas.length} nota${selecionadas.length === 1 ? '' : 's'} exportada${selecionadas.length === 1 ? '' : 's'} em ${formatoExportacao}.`)
    } finally {
      setExportando(false)
    }
  }, [formatoExportacao, escopoExportacao])

  const selectClasse =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Importar e exportar"
        descricao="Traga e exporte suas notas em TXT, Markdown e HTML."
      />

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10">
            <FileUp className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Importar arquivos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Arquivos <code className="text-slate-700 dark:text-slate-300">.txt</code>{' '}
              <code className="text-slate-700 dark:text-slate-300">.md</code> e
              <code className="text-slate-700 dark:text-slate-300"> .html</code> viram notas.
              Arquivos exportados pelo próprio app com várias notas são separados em notas
              individuais. Você pode selecionar vários arquivos de uma vez.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md,.markdown,.html,.htm"
                multiple
                onChange={(e) => void importar(e.target.files)}
                className="max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-indigo-700 dark:text-slate-300"
              />
              {importando && <span className="text-sm text-slate-500">Importando…</span>}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10">
            <FileDown className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Exportar notas</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gere um arquivo com todas as notas do escopo. O arquivo também pode ser reimportado:
              cada nota volta separada.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Formato</span>
                <select
                  value={formatoExportacao}
                  onChange={(e) => setFormatoExportacao(e.target.value as FormatoExportacao)}
                  className={selectClasse}
                >
                  <option value={FORMATO_NOTA.MARKDOWN}>Markdown (.md)</option>
                  <option value={FORMATO_NOTA.TXT}>Texto puro (.txt)</option>
                  <option value={FORMATO_NOTA.HTML}>HTML (.html)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Escopo</span>
                <select
                  value={escopoExportacao}
                  onChange={(e) => setEscopoExportacao(e.target.value as EscopoExportacao)}
                  className={selectClasse}
                >
                  <option value="TODAS">Ativas e arquivadas</option>
                  <option value="ATIVAS">Somente ativas</option>
                  <option value="ARQUIVADAS">Somente arquivadas</option>
                </select>
              </label>
              <Button onClick={() => void exportar()} disabled={exportando}>
                <FileDown className="size-4" aria-hidden="true" />
                {exportando ? 'Exportando…' : 'Exportar'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {mensagem !== null && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          {mensagem}
        </p>
      )}
    </div>
  )
}