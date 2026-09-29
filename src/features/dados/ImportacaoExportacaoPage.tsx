import { useCallback, useRef, useState } from 'react'
import { FileDown, FileUp } from 'lucide-react'
import { Button, Card, ConfirmDialog, PageHeader } from '../../components/ui'
import { FORMATO_NOTA } from '../../domain'
import { NOME_MANIFESTO_BACKUP_FIEL } from '../../core/dados/backup-fiel'
import type { EscopoExportacaoJson } from '../../core/dados/json'
import {
  exportarBackupFielAplicacao,
  exportarNotasAplicacao,
  importarArquivos,
} from './operacoes'
import type { EscopoExportacao, FormatoExportacao, MensagemOperacao, TipoMensagem } from './tipos'

const CLASSES_MENSAGEM: Record<TipoMensagem, string> = {
  sucesso: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
  aviso: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
  erro: 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300',
}

const SELECT_CLASSE =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

function arquivosContemBackupFiel(arquivos: File[]): boolean {
  return arquivos.some((arquivo) => {
    const caminho = (arquivo as File & { webkitRelativePath?: string }).webkitRelativePath
    return arquivo.name === NOME_MANIFESTO_BACKUP_FIEL || caminho?.endsWith(NOME_MANIFESTO_BACKUP_FIEL) === true
  })
}

function limparInputs(...inputs: Array<React.RefObject<HTMLInputElement | null>>): void {
  for (const input of inputs) {
    if (input.current !== null) {
      input.current.value = ''
    }
  }
}

export function ImportacaoExportacaoPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputBackupFielRef = useRef<HTMLInputElement>(null)
  const inputPastaBackupFielRef = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)
  const [mensagem, setMensagem] = useState<MensagemOperacao | null>(null)
  const [exportando, setExportando] = useState(false)
  const [exportandoFiel, setExportandoFiel] = useState(false)
  const [restaurarSync, setRestaurarSync] = useState(false)
  const [arquivosPendentes, setArquivosPendentes] = useState<File[] | null>(null)
  const [formatoExportacao, setFormatoExportacao] = useState<FormatoExportacao>('MARKDOWN')
  const [escopoExportacao, setEscopoExportacao] = useState<EscopoExportacao>('TODAS')
  const [escopoJson, setEscopoJson] = useState<EscopoExportacaoJson>('TUDO')

  const limparSelecao = useCallback(() => {
    limparInputs(inputRef, inputBackupFielRef, inputPastaBackupFielRef)
  }, [])

  const executarImportacao = useCallback(async (arquivos: File[]) => {
    if (arquivos.length === 0) return
    setImportando(true)
    setMensagem(null)
    try {
      const resultado = await importarArquivos(arquivos, restaurarSync)
      if (resultado !== null) {
        setMensagem(resultado)
      }
    } finally {
      setImportando(false)
      setArquivosPendentes(null)
      limparSelecao()
    }
  }, [limparSelecao, restaurarSync])

  const importar = useCallback((arquivos: FileList | null) => {
    if (arquivos === null || arquivos.length === 0) {
      return
    }
    const selecionados = Array.from(arquivos)
    if (arquivosContemBackupFiel(selecionados)) {
      setArquivosPendentes(selecionados)
      return
    }
    void executarImportacao(selecionados)
  }, [executarImportacao])

  const cancelarImportacaoSensivel = useCallback(() => {
    setArquivosPendentes(null)
    limparSelecao()
  }, [limparSelecao])

  const confirmarImportacaoSensivel = useCallback(() => {
    if (arquivosPendentes !== null) {
      void executarImportacao(arquivosPendentes)
    }
  }, [arquivosPendentes, executarImportacao])

  const exportarFiel = useCallback(async () => {
    setExportandoFiel(true)
    setMensagem(null)
    try {
      setMensagem(await exportarBackupFielAplicacao())
    } catch {
      setMensagem({
        tipo: 'erro',
        texto: 'Nao foi possivel exportar o backup fiel. Verifique o armazenamento local e tente novamente.',
      })
    } finally {
      setExportandoFiel(false)
    }
  }, [])

  const exportar = useCallback(async () => {
    setExportando(true)
    setMensagem(null)
    try {
      setMensagem(await exportarNotasAplicacao({ formatoExportacao, escopoExportacao, escopoJson }))
    } catch {
      setMensagem({
        tipo: 'erro',
        texto: 'Nao foi possivel exportar os dados. Verifique o armazenamento local e tente novamente.',
      })
    } finally {
      setExportando(false)
    }
  }, [formatoExportacao, escopoExportacao, escopoJson])

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
              <code className="text-slate-700 dark:text-slate-300">.md</code>,{' '}
              <code className="text-slate-700 dark:text-slate-300">.html</code> e
              <code className="text-slate-700 dark:text-slate-300"> .json</code> viram notas.
              Arquivos exportados pelo proprio app com varias notas sao separados em notas
              individuais; arquivos <code className="text-slate-700 dark:text-slate-300">.json</code>{' '}
              restauram cadernos, tags e notas como novos registros. Voce pode selecionar varios
              arquivos de uma vez.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                aria-label="Selecionar arquivos para importar"
                accept=".txt,.md,.markdown,.html,.htm,.json"
                multiple
                onChange={(e) => void importar(e.target.files)}
                className="max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-indigo-700 dark:text-slate-300"
              />
              {importando && <span className="text-sm text-slate-500">Importando...</span>}
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold">Importar backup fiel</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Selecione o manifesto{' '}
                <code className="text-slate-700 dark:text-slate-300">
                  {NOME_MANIFESTO_BACKUP_FIEL}
                </code>{' '}
                junto dos arquivos de anexo baixados. Registros com IDs existentes serao
                ignorados.
              </p>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={restaurarSync}
                  onChange={(e) => setRestaurarSync(e.target.checked)}
                  className="size-4 accent-indigo-600"
                />
                Restaurar revisoes de sincronizacao
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Arquivos do backup
                  </span>
                  <input
                    ref={inputBackupFielRef}
                    type="file"
                    aria-label="Selecionar arquivos do backup fiel"
                    multiple
                    onChange={(e) => void importar(e.target.files)}
                    className="max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-slate-800 dark:text-slate-300 dark:file:bg-slate-600 dark:hover:file:bg-slate-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Pasta do backup
                  </span>
                  <input
                    ref={inputPastaBackupFielRef}
                    type="file"
                    aria-label="Selecionar pasta do backup fiel"
                    multiple
                    {...{ webkitdirectory: '', directory: '' }}
                    onChange={(e) => void importar(e.target.files)}
                    className="max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-slate-800 dark:text-slate-300 dark:file:bg-slate-600 dark:hover:file:bg-slate-500"
                  />
                </label>
              </div>
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
              Gere um arquivo com as notas do escopo. No formato JSON e possivel exportar
              cadernos, notas ou o backup logico (notas + cadernos + tags), e tudo pode ser
              reimportado como novos registros, sem preservar IDs e datas originais.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Formato</span>
                <select
                  value={formatoExportacao}
                  onChange={(e) => setFormatoExportacao(e.target.value as FormatoExportacao)}
                  className={SELECT_CLASSE}
                >
                  <option value={FORMATO_NOTA.MARKDOWN}>Markdown (.md)</option>
                  <option value={FORMATO_NOTA.TXT}>Texto puro (.txt)</option>
                  <option value={FORMATO_NOTA.HTML}>HTML (.html)</option>
                  <option value="JSON">JSON (.json)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Escopo</span>
                <select
                  value={escopoExportacao}
                  onChange={(e) => setEscopoExportacao(e.target.value as EscopoExportacao)}
                  className={SELECT_CLASSE}
                >
                  <option value="TODAS">Ativas e arquivadas</option>
                  <option value="ATIVAS">Somente ativas</option>
                  <option value="ARQUIVADAS">Somente arquivadas</option>
                </select>
              </label>
              {formatoExportacao === 'JSON' && (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    O que exportar
                  </span>
                  <select
                    value={escopoJson}
                    onChange={(e) => setEscopoJson(e.target.value as EscopoExportacaoJson)}
                    className={SELECT_CLASSE}
                  >
                    <option value="TUDO">Notas + cadernos + tags</option>
                    <option value="CADERNOS">Somente cadernos</option>
                    <option value="NOTAS">Somente notas</option>
                  </select>
                </label>
              )}
              <Button onClick={() => void exportar()} disabled={exportando}>
                <FileDown className="size-4" aria-hidden="true" />
                {exportando ? 'Exportando...' : 'Exportar'}
              </Button>
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
            <h2 className="text-sm font-semibold">Exportar backup fiel</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gera manifesto, registros internos e anexos preservando IDs, datas e metadados.
              Quando o navegador permitir, os arquivos serao gravados juntos em uma pasta.
            </p>
            <div className="mt-4">
              <Button onClick={() => void exportarFiel()} disabled={exportandoFiel}>
                <FileDown className="size-4" aria-hidden="true" />
                {exportandoFiel ? 'Exportando...' : 'Exportar backup fiel'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {mensagem !== null && (
        <p className={`rounded-xl px-4 py-3 text-sm ${CLASSES_MENSAGEM[mensagem.tipo]}`}>
          {mensagem.texto}
        </p>
      )}

      <ConfirmDialog
        aberto={arquivosPendentes !== null}
        titulo="Importar backup fiel?"
        mensagem={
          restaurarSync
            ? 'Esta importacao pode restaurar IDs, datas, metadados internos, anexos e revisoes conhecidas de sincronizacao. Identidade do dispositivo, cursor e filas pendentes nao serao restaurados.'
            : 'Esta importacao pode restaurar IDs, datas, metadados internos e anexos. Arquivos ausentes bloqueiam a restauracao para evitar estado parcial.'
        }
        confirmarLabel="Importar backup"
        perigo={restaurarSync}
        aoConfirmar={confirmarImportacaoSensivel}
        aoCancelar={cancelarImportacaoSensivel}
      />
    </div>
  )
}
