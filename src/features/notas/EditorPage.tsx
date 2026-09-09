import { useEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode, RefObject } from 'react'
import {
  Archive,
  ArrowLeft,
  Check,
  Clock,
  Columns2,
  Copy,
  Download,
  Eye,
  ImagePlus,
  Paperclip,
  PenLine,
  Pin,
  Star,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ConfirmDialog, Input, PageHeader } from '../../components/ui'
import { LIMITES_ARQUIVO, PREFERENCIAS } from '../../config/limits'
import { anexosStore, baixarAnexo, formatarTamanho, logger, MarkdownPreview, notasStore, tagsStore } from '../../core'
import { FORMATO_NOTA, STATUS_NOTA, urlDeAnexo } from '../../domain'
import type { Anexo, Nota } from '../../domain'
import { useCadernos } from '../cadernos/hooks'
import { useTags } from '../tags/hooks'
import { useAnexos } from '../anexos/hooks'
import { MiniaturaAnexo, RotuloArquivo } from '../anexos/components'

type ModoVisualizacao = 'editar' | 'visualizar' | 'dividido'
type EstadoSalvamento = 'ocioso' | 'salvando' | 'salvo' | 'erro'

const ICONES_SALVAMENTO: Record<EstadoSalvamento, LucideIcon | null> = {
  ocioso: null,
  salvando: Clock,
  salvo: Check,
  erro: X,
}

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const idNota = id === 'nova' ? null : id ?? null

  const [nota, setNota] = useState<Nota | null>(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [carregada, setCarregada] = useState(false)
  const [estadoSalvamento, setEstadoSalvamento] = useState<EstadoSalvamento>('ocioso')
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('editar')
  const [confirmarLixeira, setConfirmarLixeira] = useState(false)
  const [novaTag, setNovaTag] = useState('')

  const { itens: cadernos } = useCadernos()
  const { itens: tags, recarregar: recarregarTags } = useTags()
  const { itens: anexos, recarregar: recarregarAnexos } = useAnexos(nota === null ? undefined : nota.id)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputImagemRef = useRef<HTMLInputElement>(null)
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  const [anexando, setAnexando] = useState(false)
  const [erroAnexo, setErroAnexo] = useState<string | null>(null)
  const [confirmarRemoverAnexo, setConfirmarRemoverAnexo] = useState<Anexo | null>(null)

  const limparInputsArquivo = (): void => {
    if (inputImagemRef.current !== null) {
      inputImagemRef.current.value = ''
    }
    if (inputArquivoRef.current !== null) {
      inputArquivoRef.current.value = ''
    }
  }

  const validarArquivo = (arquivo: File): string | null => {
    if (arquivo.size > LIMITES_ARQUIVO.tamanhoMaximoBytes) {
      return 'O arquivo excede o limite de 10 MB.'
    }
    const nome = arquivo.name.toLowerCase()
    const bloqueada = (LIMITES_ARQUIVO.extensoesBloqueadas as readonly string[]).some((extensao) =>
      nome.endsWith(extensao),
    )
    return bloqueada ? 'Extensão não permitida por segurança.' : null
  }

  const inserirNoEditor = (texto: string): void => {
    const campo = textareaRef.current
    if (campo !== null) {
      const inicio = campo.selectionStart
      const fim = campo.selectionEnd
      const novoConteudo = conteudo.slice(0, inicio) + texto + conteudo.slice(fim)
      setConteudo(novoConteudo)
      window.requestAnimationFrame(() => {
        campo.focus()
        campo.setSelectionRange(inicio + texto.length, inicio + texto.length)
      })
    } else {
      setConteudo(conteudo + texto)
    }
  }

  const anexarArquivos = async (arquivos: FileList | null, inserirImagem: boolean): Promise<void> => {
    if (arquivos === null || arquivos.length === 0 || nota === null) {
      limparInputsArquivo()
      return
    }
    setAnexando(true)
    setErroAnexo(null)
    let imagens = ''
    try {
      for (const arquivo of Array.from(arquivos)) {
        const validacao = validarArquivo(arquivo)
        if (validacao !== null) {
          setErroAnexo(validacao)
          continue
        }
        const anexo = await anexosStore.criar({
          notaId: nota.id,
          nome: arquivo.name,
          mime: arquivo.type !== '' ? arquivo.type : 'application/octet-stream',
          dados: arquivo,
        })
        if (inserirImagem && arquivo.type.startsWith('image/')) {
          imagens += `\n![${arquivo.name}](${urlDeAnexo(anexo.id)})`
        }
      }
      if (imagens !== '') {
        inserirNoEditor(`${imagens}\n`)
      }
    } catch {
      setErroAnexo('Falha ao salvar o anexo.')
    } finally {
      setAnexando(false)
      limparInputsArquivo()
      recarregarAnexos()
    }
  }

  const removerAnexo = async (anexo: Anexo): Promise<void> => {
    await anexosStore.remover(anexo.id)
    recarregarAnexos()
  }

  useEffect(() => {
    if (idNota === null) {
      let cancelado = false
      notasStore
        .criar({ titulo: '', conteudo: '', formato: FORMATO_NOTA.MARKDOWN })
        .then((nova) => {
          if (!cancelado) {
            setNota(nova)
            navigate(`/notas/${nova.id}`, { replace: true })
            setCarregada(true)
          }
        })
        .catch(() => {
          logger.aviso('Falha ao criar nota.')
        })
      return () => {
        cancelado = true
      }
    }

    let cancelado = false
    notasStore
      .obter(idNota)
      .then((existente) => {
        if (cancelado || existente === undefined) {
          return
        }
        setNota(existente)
        setTitulo(existente.titulo)
        setConteudo(existente.conteudo)
        setCarregada(true)
      })
      .catch(() => {
        logger.aviso('Falha ao carregar a nota.')
      })
    return () => {
      cancelado = true
    }
  }, [idNota, navigate])

  const primeiroCarregamento = useRef(true)
  useEffect(() => {
    if (primeiroCarregamento.current) {
      primeiroCarregamento.current = false
      return
    }
    if (!carregada || idNota === null || nota === null) {
      return
    }
    if (titulo === nota.titulo && conteudo === nota.conteudo) {
      return
    }

    const timer = window.setTimeout(() => {
      setEstadoSalvamento('salvando')
      notasStore
        .atualizar(nota.id, { titulo, conteudo })
        .then((atualizada) => {
          if (atualizada !== undefined) {
            setNota(atualizada)
            setEstadoSalvamento('salvo')
          }
        })
        .catch(() => {
          setEstadoSalvamento('erro')
        })
    }, PREFERENCIAS.autosaveDebounceMs)
    return () => window.clearTimeout(timer)
  }, [titulo, conteudo, carregada, idNota, nota])

  if (!carregada || nota === null) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Carregando…
      </div>
    )
  }

  const atualizarNota = (mudanca: Partial<Nota>): void => {
    setNota((atual) => (atual === null ? atual : { ...atual, ...mudanca }))
  }

  const executarAcao = async (acao: () => Promise<Nota | undefined>): Promise<void> => {
    const resultado = await acao()
    if (resultado !== undefined) {
      setNota(resultado)
    }
  }

  const mudarCaderno = (cadernoId: string): void => {
    const valor = cadernoId === '' ? null : cadernoId
    atualizarNota({ cadernoId: valor })
    void notasStore.atualizar(nota.id, { cadernoId: valor })
  }

  const alternarTag = (tagId: string): void => {
    const ativa = nota.tagIds.includes(tagId)
    const tagIds = ativa ? nota.tagIds.filter((t) => t !== tagId) : [...nota.tagIds, tagId]
    atualizarNota({ tagIds })
    void notasStore.atualizar(nota.id, { tagIds })
  }

  const criarTag = async (): Promise<void> => {
    const nome = novaTag.trim()
    if (nome === '') {
      return
    }
    const tagsExistentes = tags.some((tag) => tag.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))
    if (tagsExistentes) {
      return
    }
    const tag = await tagsStore.criar(nome)
    await notasStore.atualizar(nota.id, { tagIds: [...nota.tagIds, tag.id] })
    atualizarNota({ tagIds: [...nota.tagIds, tag.id] })
    setNovaTag('')
    recarregarTags()
  }

  const moverLixeira = async (): Promise<void> => {
    const resultado = await notasStore.mudarStatus(nota.id, STATUS_NOTA.LIXEIRA)
    if (resultado !== undefined) {
      navigate('/notas')
    }
  }

  const IconeSalvamento = ICONES_SALVAMENTO[estadoSalvamento]
  const textoSalvamento =
    estadoSalvamento === 'salvando'
      ? 'Salvando…'
      : estadoSalvamento === 'erro'
        ? 'Falha ao salvar'
        : estadoSalvamento === 'salvo'
          ? 'Salvo'
          : ''

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variante="fantasma" tamanho="sm" onClick={() => navigate('/notas')}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar às notas
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          {textoSalvamento !== '' && (
            <span className="flex items-center gap-1.5">
              {IconeSalvamento !== null && (
                <IconeSalvamento className="size-4" aria-hidden="true" />
              )}
              {textoSalvamento}
            </span>
          )}
          <div className="mx-2 hidden h-4 w-px bg-slate-300 dark:bg-slate-700 sm:block" />
          <div className="hidden gap-1 rounded-lg border border-slate-300 p-0.5 dark:border-slate-700 sm:inline-flex">
            <BotaoModoVisualizacao ativo={modoVisualizacao === 'editar'} aoClicar={() => setModoVisualizacao('editar')} rotulo="Editar" icone={PenLine} />
            <BotaoModoVisualizacao ativo={modoVisualizacao === 'dividido'} aoClicar={() => setModoVisualizacao('dividido')} rotulo="Dividido" icone={Columns2} />
            <BotaoModoVisualizacao ativo={modoVisualizacao === 'visualizar'} aoClicar={() => setModoVisualizacao('visualizar')} rotulo="Visualizar" icone={Eye} />
          </div>
          <div className="flex items-center gap-1">
            <BotaoIcone
              ativo={nota.favorita}
              rotulo={nota.favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aoClicar={() => void executarAcao(() => notasStore.alternarFavorita(nota.id))}
            >
              <Star className={`size-4 ${nota.favorita ? 'fill-current' : ''}`} aria-hidden="true" />
            </BotaoIcone>
            <BotaoIcone
              ativo={nota.fixada}
              rotulo={nota.fixada ? 'Desfixar nota' : 'Fixar nota'}
              aoClicar={() => void executarAcao(() => notasStore.alternarFixada(nota.id))}
            >
              <Pin className="size-4" aria-hidden="true" />
            </BotaoIcone>
            <BotaoIcone
              ativo={false}
              rotulo="Duplicar nota"
              aoClicar={() =>
                void notasStore.duplicar(nota.id).then((copia) => {
                  if (copia !== undefined) {
                    navigate(`/notas/${copia.id}`)
                  }
                })
              }
            >
              <Copy className="size-4" aria-hidden="true" />
            </BotaoIcone>
            <BotaoIcone
              ativo={false}
              rotulo="Arquivar nota"
              aoClicar={() =>
                void notasStore.mudarStatus(nota.id, STATUS_NOTA.ARQUIVADA).then(() => navigate('/notas'))
              }
            >
              <Archive className="size-4" aria-hidden="true" />
            </BotaoIcone>
            <BotaoIcone
              ativo={false}
              rotulo="Mover para a lixeira"
              aoClicar={() => setConfirmarLixeira(true)}
              className="hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </BotaoIcone>
          </div>
        </div>
      </div>

      <PageHeader
        titulo="Editor de nota"
        descricao="Edite o conteúdo em Markdown com preview renderizado."
      />

      <Input
        rotulo="Título"
        placeholder="Título da nota"
        value={titulo}
        maxLength={PREFERENCIAS.tituloEditorMaxCaracteres}
        onChange={(e) => setTitulo(e.target.value)}
        aria-label="Título da nota"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Caderno</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
            value={nota.cadernoId ?? ''}
            onChange={(e) => mudarCaderno(e.target.value)}
            aria-label="Caderno da nota"
          >
            <option value="">Sem caderno</option>
            {cadernos.map((caderno) => (
              <option key={caderno.id} value={caderno.id}>
                {caderno.nome}
              </option>
            ))}
          </select>
        </label>

        <details className="relative">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <TagIcon className="size-4" aria-hidden="true" />
            Tags ({nota.tagIds.length})
          </summary>
          <div className="absolute left-0 z-10 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex gap-2">
              <input
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void criarTag()
                  }
                }}
                placeholder="Nova tag…"
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                aria-label="Nome da nova tag"
              />
              <Button tamanho="sm" onClick={() => void criarTag()}>
                Adicionar
              </Button>
            </div>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={nota.tagIds.includes(tag.id)}
                      onChange={() => alternarTag(tag.id)}
                      className="size-4 accent-indigo-600"
                    />
                    {tag.nome}
                  </label>
                </li>
              ))}
              {tags.length === 0 && (
                <li className="px-2 py-1 text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma tag ainda. Crie a primeira acima.
                </li>
              )}
            </ul>
          </div>
        </details>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputImagemRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void anexarArquivos(e.target.files, true)}
        />
        <input
          ref={inputArquivoRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void anexarArquivos(e.target.files, false)}
        />
        <Button
          tamanho="sm"
          variante="secundario"
          onClick={() => inputImagemRef.current?.click()}
          disabled={anexando}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Inserir imagem
        </Button>
        <Button
          tamanho="sm"
          variante="secundario"
          onClick={() => inputArquivoRef.current?.click()}
          disabled={anexando}
        >
          <Paperclip className="size-4" aria-hidden="true" />
          Anexar arquivo
        </Button>
        {anexando && <span className="text-sm text-slate-500 dark:text-slate-400">Salvando anexo…</span>}
      </div>

      {erroAnexo !== null && (
        <p className="text-sm text-red-600 dark:text-red-400">{erroAnexo}</p>
      )}

      {anexos.length > 0 && (
        <section aria-label="Anexos da nota">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Anexos ({anexos.length})
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {anexos.map((anexo) => (
              <li
                key={anexo.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex min-h-12 flex-col justify-center overflow-hidden">
                  {anexo.mime.startsWith('image/') ? (
                    <div className="aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      <MiniaturaAnexo anexo={anexo} />
                    </div>
                  ) : (
                    <RotuloArquivo anexo={anexo} />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatarTamanho(anexo.tamanho)}
                  </span>
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
                      onClick={() => setConfirmarRemoverAnexo(anexo)}
                      aria-label={`Remover ${anexo.nome}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center gap-2 sm:hidden">
        <BotaoModoVisualizacao ativo={modoVisualizacao === 'editar'} aoClicar={() => setModoVisualizacao('editar')} rotulo="Editar" icone={PenLine} />
        <BotaoModoVisualizacao ativo={modoVisualizacao === 'dividido'} aoClicar={() => setModoVisualizacao('dividido')} rotulo="Dividido" icone={Columns2} />
        <BotaoModoVisualizacao ativo={modoVisualizacao === 'visualizar'} aoClicar={() => setModoVisualizacao('visualizar')} rotulo="Visualizar" icone={Eye} />
      </div>

      {modoVisualizacao === 'dividido' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <PainelEditor value={conteudo} onChange={setConteudo} refTexto={textareaRef} />
          <PainelPreview conteudo={conteudo} />
        </div>
      ) : modoVisualizacao === 'visualizar' ? (
        <PainelPreview conteudo={conteudo} />
      ) : (
        <PainelEditor value={conteudo} onChange={setConteudo} refTexto={textareaRef} />
      )}

      <ConfirmDialog
        aberto={confirmarRemoverAnexo !== null}
        titulo="Remover anexo"
        mensagem={`O anexo “${confirmarRemoverAnexo?.nome ?? ''}” será removido da nota. As referências à imagem no texto ficarão quebradas.`}
        confirmarLabel="Remover anexo"
        perigo
        aoConfirmar={() => {
          if (confirmarRemoverAnexo !== null) {
            void removerAnexo(confirmarRemoverAnexo)
          }
          setConfirmarRemoverAnexo(null)
        }}
        aoCancelar={() => setConfirmarRemoverAnexo(null)}
      />

      <ConfirmDialog
        aberto={confirmarLixeira}
        titulo="Mover para a lixeira"
        mensagem={`A nota “${nota.titulo.trim() === '' ? 'Sem título' : nota.titulo}” será movida para a lixeira e poderá ser restaurada depois.`}
        confirmarLabel="Mover para a lixeira"
        perigo
        aoConfirmar={() => void moverLixeira()}
        aoCancelar={() => setConfirmarLixeira(false)}
      />
    </div>
  )
}

interface BotaoIconeProps {
  ativo: boolean
  rotulo: string
  aoClicar: () => void
  className?: string
  children: ReactNode
}

function BotaoIcone({ ativo, rotulo, aoClicar, className = '', children }: BotaoIconeProps) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={rotulo}
      title={rotulo}
      className={`rounded-lg p-2 transition-colors ${
        ativo
          ? 'text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-500/15'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      } ${className}`}
    >
      {children}
    </button>
  )
}

interface BotaoModoVisualizacaoProps {
  ativo: boolean
  rotulo: string
  icone: ComponentType<{ className?: string }>
  aoClicar: () => void
}

function BotaoModoVisualizacao({ ativo, rotulo, icone: Icone, aoClicar }: BotaoModoVisualizacaoProps) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativo}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors ${
        ativo
          ? 'bg-indigo-600 text-white'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <Icone className="size-4" aria-hidden="true" />
      {rotulo}
    </button>
  )
}

interface PainelEditorProps {
  value: string
  onChange: (valor: string) => void
  refTexto: RefObject<HTMLTextAreaElement | null>
}

function PainelEditor({ value, onChange, refTexto }: PainelEditorProps) {
  return (
    <textarea
      ref={refTexto}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escreva em Markdown…"
      aria-label="Conteúdo da nota em Markdown"
      className="min-h-[50svh] w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 font-mono text-sm leading-relaxed shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    />
  )
}

interface PainelPreviewProps {
  conteudo: string
}

function PainelPreview({ conteudo }: PainelPreviewProps) {
  return (
    <div className="min-h-[50svh] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <MarkdownPreview conteudo={conteudo} />
    </div>
  )
}