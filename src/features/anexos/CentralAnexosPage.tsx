import { useMemo, useState } from 'react'
import { Boxes, Download, ExternalLink, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConfirmDialog, EmptyState, PageHeader } from '../../components/ui'
import { anexosStore, baixarAnexo, dataRelativa, formatarTamanho } from '../../core'
import type { Anexo } from '../../domain'
import { useAnexos } from './hooks'
import { MiniaturaAnexo, RotuloArquivo } from './components'
import { useNotas } from '../notas/hooks'

interface VinculoNotaProps {
  anexo: Anexo
  tituloNota?: string
}

function VinculoNota({ anexo, tituloNota }: VinculoNotaProps) {
  if (anexo.notaId === null) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">Sem nota vinculada</span>
  }
  return (
    <Link
      to={`/notas/${anexo.notaId}`}
      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
    >
      <ExternalLink className="size-3" aria-hidden="true" />
      {tituloNota ?? 'Abrir nota'}
    </Link>
  )
}

export function CentralAnexosPage() {
  const { itens: anexos, recarregar } = useAnexos()
  const { itens: notas } = useNotas()
  const [confirmarRemover, setConfirmarRemover] = useState<Anexo | null>(null)

  const tituloPorNota = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const nota of notas) {
      if (nota.titulo.trim() !== '') {
        mapa.set(nota.id, nota.titulo)
      }
    }
    return mapa
  }, [notas])

  const totalBytes = anexos.reduce((soma, anexo) => soma + anexo.tamanho, 0)
  const imagens = anexos.filter((anexo) => anexo.mime.startsWith('image/'))
  const demais = anexos.filter((anexo) => !anexo.mime.startsWith('image/'))

  const remover = async (anexo: Anexo): Promise<void> => {
    await anexosStore.remover(anexo.id)
    setConfirmarRemover(null)
    recarregar()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Central de anexos"
        descricao="Imagens e arquivos usados nas suas notas."
      />

      {anexos.length === 0 ? (
        <EmptyState
          icone={Boxes}
          titulo="Nenhum anexo"
          descricao="Use “Inserir imagem” ou “Anexar arquivo” no editor para guardar arquivos nas notas."
        />
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {anexos.length} anexo{anexos.length === 1 ? '' : 's'} ·{' '}
            {formatarTamanho(totalBytes)} de armazenamento local
          </p>

          {imagens.length > 0 && (
            <section aria-label="Imagens">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Imagens
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imagens.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                      <MiniaturaAnexo anexo={anexo} />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium" title={anexo.nome}>
                        {anexo.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {formatarTamanho(anexo.tamanho)} · {dataRelativa(anexo.criadaEm)}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <VinculoNota anexo={anexo} tituloNota={tituloPorNota.get(anexo.notaId ?? '')} />
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => baixarAnexo(anexo)}
                            aria-label={`Baixar ${anexo.nome}`}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          >
                            <Download className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmarRemover(anexo)}
                            aria-label={`Excluir ${anexo.nome}`}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {demais.length > 0 && (
            <section aria-label="Arquivos">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Arquivos
              </h2>
              <ul className="space-y-2">
                {demais.map((anexo) => (
                  <li
                    key={anexo.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0 flex-1">
                      <RotuloArquivo anexo={anexo} />
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {formatarTamanho(anexo.tamanho)} · {dataRelativa(anexo.criadaEm)}
                      </p>
                    </div>
                    <VinculoNota anexo={anexo} tituloNota={tituloPorNota.get(anexo.notaId ?? '')} />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => baixarAnexo(anexo)}
                        aria-label={`Baixar ${anexo.nome}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                      >
                        <Download className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmarRemover(anexo)}
                        aria-label={`Excluir ${anexo.nome}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        aberto={confirmarRemover !== null}
        titulo="Excluir anexo"
        mensagem={`O anexo “${confirmarRemover?.nome ?? ''}” será excluído definitivamente. Referências no texto das notas ficarão quebradas.`}
        confirmarLabel="Excluir"
        perigo
        aoConfirmar={() => {
          if (confirmarRemover !== null) {
            void remover(confirmarRemover)
          }
        }}
        aoCancelar={() => setConfirmarRemover(null)}
      />
    </div>
  )
}