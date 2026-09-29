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
  LockKeyhole,
  Paperclip,
  PenLine,
  Pin,
  Save,
  Share2,
  Star,
  Tag as TagIcon,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ConfirmDialog, Input, PageHeader } from '../../components/ui'
import { LIMITES_ARQUIVO, PREFERENCIAS } from '../../config/limits'
import {
  anexosStore,
  baixarAnexo,
  formatarTamanho,
  getMensagemUsuario,
  logger,
  gruposStore,
  notasProtegidasStore,
  notasStore,
  permissoesNotaStore,
  resolverContextoAutorizacaoNota,
  tagsStore,
  usuariosStore,
} from '../../core'
import { MarkdownPreview } from '../../core/markdown'
import {
  FORMATO_NOTA,
  podeDuplicar,
  podeEditarDireto,
  podeMoverLixeira,
  podeSugerir,
  STATUS_NOTA,
  TIPO_ALVO_PERMISSAO,
  urlDeAnexo,
  VISIBILIDADE_NOTA,
} from '../../domain'
import type { Anexo, Grupo, Nota, PermissaoNota, Usuario } from '../../domain'
import { ehDonoNaUi, useContextoNotaAtual } from './hooks'
import { useCadernos } from '../cadernos/hooks'
import { useTags } from '../tags/hooks'
import { useAnexos } from '../anexos/hooks'
import { MiniaturaAnexo, RotuloArquivo } from '../anexos/components'

type ModoVisualizacao = 'editar' | 'visualizar' | 'dividido'
type EstadoSalvamento = 'ocioso' | 'salvando' | 'salvo' | 'erro'

interface PermissoesEditorNota {
  editar: boolean
  sugerir: boolean
  duplicar: boolean
  moverLixeira: boolean
}

const PERMISSOES_EDITOR_VAZIAS: PermissoesEditorNota = {
  editar: false,
  sugerir: false,
  duplicar: false,
  moverLixeira: false,
}

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
  const contextoNota = useContextoNotaAtual()

  const [nota, setNota] = useState<Nota | null>(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [carregada, setCarregada] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [estadoSalvamento, setEstadoSalvamento] = useState<EstadoSalvamento>('ocioso')
  const [mensagemAcao, setMensagemAcao] = useState<string | null>(null)
  const [permissoesEditor, setPermissoesEditor] = useState<PermissoesEditorNota>(PERMISSOES_EDITOR_VAZIAS)
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('editar')
  const [confirmarLixeira, setConfirmarLixeira] = useState(false)
  const [novaTag, setNovaTag] = useState('')
  const [usuariosCompartilhamento, setUsuariosCompartilhamento] = useState<Usuario[]>([])
  const [gruposCompartilhamento, setGruposCompartilhamento] = useState<Grupo[]>([])
  const [permissoesCompartilhamento, setPermissoesCompartilhamento] = useState<PermissaoNota[]>([])
  const [usuarioParaCompartilhar, setUsuarioParaCompartilhar] = useState('')
  const [grupoParaCompartilhar, setGrupoParaCompartilhar] = useState('')

  const { itens: cadernos } = useCadernos()
  const { itens: tags, recarregar: recarregarTags } = useTags()
  const { itens: anexos, recarregar: recarregarAnexos } = useAnexos(nota === null ? undefined : nota.id)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerAutosaveRef = useRef<number | undefined>(undefined)
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
    if (arquivos === null || arquivos.length === 0 || nota === null || !permissoesEditor.editar) {
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
    if (!permissoesEditor.editar) {
      setMensagemAcao('Somente o dono da nota pode remover anexos.')
      return
    }
    await anexosStore.remover(anexo.id)
    recarregarAnexos()
  }

  useEffect(() => {
    if (idNota === null) {
      let cancelado = false
      notasStore
        .criar(
          { titulo: '', conteudo: '', formato: FORMATO_NOTA.MARKDOWN },
          { usuarioId: contextoNota.usuarioId },
        )
        .then((nova) => {
          if (!cancelado) {
            setErroCarregamento(null)
            setNota(nova)
            navigate(`/notas/${nova.id}`, { replace: true })
            setCarregada(true)
          }
        })
        .catch(() => {
          logger.aviso('Falha ao criar nota.')
          if (!cancelado) {
            setErroCarregamento('Não foi possível criar a nota. Verifique o armazenamento local e tente novamente.')
            setCarregada(true)
          }
        })
      return () => {
        cancelado = true
      }
    }

    let cancelado = false
    notasProtegidasStore
      .obterComoUsuario(idNota, contextoNota)
      .then((existente) => {
        if (cancelado) {
          return
        }
        if (existente === undefined) {
          setErroCarregamento('Nota não encontrada. Ela pode ter sido removida ou ainda não foi sincronizada.')
          setCarregada(true)
          return
        }
        setErroCarregamento(null)
        setNota(existente)
        setTitulo(existente.titulo)
        setConteudo(existente.conteudo)
        setCarregada(true)
      })
      .catch(() => {
        logger.aviso('Falha ao carregar a nota.')
        if (!cancelado) {
          setErroCarregamento('Não foi possível carregar a nota. Tente novamente.')
          setCarregada(true)
        }
      })
    return () => {
      cancelado = true
    }
  }, [contextoNota, idNota, navigate])

  useEffect(() => {
    if (nota === null) {
      return
    }

    let cancelado = false
    resolverContextoAutorizacaoNota(nota, contextoNota)
      .then((autorizacao) => {
        if (cancelado) {
          return
        }
        setPermissoesEditor({
          editar: podeEditarDireto(autorizacao),
          sugerir: podeSugerir(autorizacao),
          duplicar: podeDuplicar(autorizacao),
          moverLixeira: podeMoverLixeira(autorizacao),
        })
      })
      .catch(() => {
        if (!cancelado) {
          setPermissoesEditor(PERMISSOES_EDITOR_VAZIAS)
        }
      })

    return () => {
      cancelado = true
    }
  }, [contextoNota, nota])

  useEffect(() => {
    if (nota === null) {
      return
    }

    let cancelado = false
    Promise.all([
      usuariosStore.listar(),
      gruposStore.listar(),
      permissoesNotaStore.listarPorNota(nota.id),
    ])
      .then(([usuarios, grupos, permissoes]) => {
        if (cancelado) {
          return
        }
        setUsuariosCompartilhamento(usuarios)
        setGruposCompartilhamento(grupos)
        setPermissoesCompartilhamento(permissoes)
      })
      .catch((falha: unknown) => {
        if (!cancelado) {
          setMensagemAcao(getMensagemUsuario(falha))
        }
      })

    return () => {
      cancelado = true
    }
  }, [nota])

  const primeiroCarregamento = useRef(true)
  useEffect(() => {
    if (primeiroCarregamento.current) {
      primeiroCarregamento.current = false
      return
    }
    if (!carregada || idNota === null || nota === null || !permissoesEditor.editar) {
      return
    }
    if (titulo === nota.titulo && conteudo === nota.conteudo) {
      return
    }

    timerAutosaveRef.current = window.setTimeout(() => {
      setEstadoSalvamento('salvando')
      notasProtegidasStore
        .atualizarComoUsuario(nota.id, { titulo, conteudo }, contextoNota)
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
    return () => {
      if (timerAutosaveRef.current !== undefined) {
        window.clearTimeout(timerAutosaveRef.current)
        timerAutosaveRef.current = undefined
      }
    }
  }, [titulo, conteudo, carregada, contextoNota, idNota, nota, permissoesEditor.editar])

  const salvarAgora = async (): Promise<void> => {
    if (!carregada || idNota === null || nota === null) {
      return
    }
    if (timerAutosaveRef.current !== undefined) {
      window.clearTimeout(timerAutosaveRef.current)
      timerAutosaveRef.current = undefined
    }
    setEstadoSalvamento('salvando')
    setMensagemAcao(null)
    try {
      if (!permissoesEditor.editar && permissoesEditor.sugerir) {
        await notasProtegidasStore.criarSugestaoComoUsuario(
          { notaId: nota.id, conteudoSugerido: conteudo },
          contextoNota,
        )
        setConteudo(nota.conteudo)
        setEstadoSalvamento('salvo')
        setMensagemAcao('Sugestao enviada para revisao do dono da nota.')
        return
      }
      const atualizada = await notasProtegidasStore.atualizarComoUsuario(
        nota.id,
        { titulo, conteudo },
        contextoNota,
      )
      if (atualizada !== undefined) {
        setNota(atualizada)
        setEstadoSalvamento('salvo')
      }
    } catch (falha: unknown) {
      setEstadoSalvamento('erro')
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  if (erroCarregamento !== null) {
    return (
      <div className="flex min-h-[50svh] flex-col items-center justify-center gap-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>{erroCarregamento}</p>
        <Button variante="secundario" onClick={() => navigate('/notas')}>
          Voltar às notas
        </Button>
      </div>
    )
  }

  if (!carregada || idNota === null || nota === null || nota.id !== idNota) {
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
    setMensagemAcao(null)
    try {
      const resultado = await acao()
      if (resultado !== undefined) {
        setNota(resultado)
      }
    } catch (falha: unknown) {
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  const mudarCaderno = (cadernoId: string): void => {
    if (!podeAlterarMetadados) {
      return
    }
    const valor = cadernoId === '' ? null : cadernoId
    atualizarNota({ cadernoId: valor })
    void executarAcao(() => notasProtegidasStore.atualizarComoUsuario(nota.id, { cadernoId: valor }, contextoNota))
  }

  const alternarTag = (tagId: string): void => {
    if (!podeAlterarMetadados) {
      return
    }
    const ativa = nota.tagIds.includes(tagId)
    const tagIds = ativa ? nota.tagIds.filter((t) => t !== tagId) : [...nota.tagIds, tagId]
    atualizarNota({ tagIds })
    void executarAcao(() => notasProtegidasStore.atualizarComoUsuario(nota.id, { tagIds }, contextoNota))
  }

  const criarTag = async (): Promise<void> => {
    if (!podeAlterarMetadados) {
      return
    }
    const nome = novaTag.trim()
    if (nome === '') {
      return
    }
    const tagsExistentes = tags.some((tag) => tag.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))
    if (tagsExistentes) {
      return
    }
    const tag = await tagsStore.criar(nome)
    await notasProtegidasStore.atualizarComoUsuario(
      nota.id,
      { tagIds: [...nota.tagIds, tag.id] },
      contextoNota,
    )
    atualizarNota({ tagIds: [...nota.tagIds, tag.id] })
    setNovaTag('')
    recarregarTags()
  }

  const moverLixeira = async (): Promise<void> => {
    try {
      const resultado = await notasProtegidasStore.mudarStatusComoUsuario(
        nota.id,
        STATUS_NOTA.LIXEIRA,
        contextoNota,
      )
      if (resultado !== undefined) {
        navigate('/notas')
      }
    } catch (falha: unknown) {
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  const recarregarCompartilhamento = async (): Promise<void> => {
    if (nota === null) {
      return
    }
    const [usuarios, grupos, permissoes] = await Promise.all([
      usuariosStore.listar(),
      gruposStore.listar(),
      permissoesNotaStore.listarPorNota(nota.id),
    ])
    setUsuariosCompartilhamento(usuarios)
    setGruposCompartilhamento(grupos)
    setPermissoesCompartilhamento(permissoes)
  }

  const alterarVisibilidade = async (visibilidade: Nota['visibilidade']): Promise<void> => {
    if (nota === null || visibilidade === undefined || !podeAlterarMetadados) {
      return
    }
    setMensagemAcao(null)
    try {
      const atualizada = await notasProtegidasStore.atualizarComoUsuario(
        nota.id,
        { visibilidade },
        contextoNota,
      )
      if (atualizada !== undefined) {
        setNota(atualizada)
        setMensagemAcao(
          visibilidade === VISIBILIDADE_NOTA.PUBLICA
            ? 'Nota visivel para usuarios autenticados.'
            : 'Nota privada para dono e autorizados.',
        )
      }
    } catch (falha: unknown) {
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  const compartilharComUsuario = async (): Promise<void> => {
    if (nota === null || usuarioParaCompartilhar === '' || !podeAlterarMetadados) {
      return
    }
    setMensagemAcao(null)
    try {
      await permissoesNotaStore.conceder({
        notaId: nota.id,
        alvoTipo: TIPO_ALVO_PERMISSAO.USUARIO,
        alvoId: usuarioParaCompartilhar,
        podeSugerir: true,
      })
      setUsuarioParaCompartilhar('')
      await recarregarCompartilhamento()
      setMensagemAcao('Usuario autorizado a visualizar e sugerir conteudo.')
    } catch (falha: unknown) {
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  const compartilharComGrupo = async (): Promise<void> => {
    if (nota === null || grupoParaCompartilhar === '' || !podeAlterarMetadados) {
      return
    }
    setMensagemAcao(null)
    try {
      await permissoesNotaStore.conceder({
        notaId: nota.id,
        alvoTipo: TIPO_ALVO_PERMISSAO.GRUPO,
        alvoId: grupoParaCompartilhar,
        podeSugerir: true,
      })
      setGrupoParaCompartilhar('')
      await recarregarCompartilhamento()
      setMensagemAcao('Grupo autorizado a visualizar e sugerir conteudo.')
    } catch (falha: unknown) {
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  const removerCompartilhamento = async (permissao: PermissaoNota): Promise<void> => {
    if (!podeAlterarMetadados) {
      return
    }
    setMensagemAcao(null)
    try {
      await permissoesNotaStore.remover(permissao.id)
      await recarregarCompartilhamento()
      setMensagemAcao('Compartilhamento removido.')
    } catch (falha: unknown) {
      setMensagemAcao(getMensagemUsuario(falha))
    }
  }

  const podeEditarNota = permissoesEditor.editar
  const podeSugerirNota = permissoesEditor.sugerir
  const podeAlterarConteudo = podeEditarNota || podeSugerirNota
  const podeAlterarMetadados = podeEditarNota && ehDonoNaUi(nota, contextoNota)

  const IconeSalvamento = ICONES_SALVAMENTO[estadoSalvamento]
  const textoSalvamento =
    estadoSalvamento === 'salvando'
      ? 'Salvando…'
      : estadoSalvamento === 'erro'
        ? 'Falha ao salvar. Tente novamente.'
        : estadoSalvamento === 'salvo'
          ? 'Salvo'
          : ''

  const permissoesUsuario = permissoesCompartilhamento.filter(
    (permissao) => permissao.alvoTipo === TIPO_ALVO_PERMISSAO.USUARIO,
  )
  const permissoesGrupo = permissoesCompartilhamento.filter(
    (permissao) => permissao.alvoTipo === TIPO_ALVO_PERMISSAO.GRUPO,
  )
  const usuariosPorId = Object.fromEntries(
    usuariosCompartilhamento.map((usuario) => [usuario.id, usuario]),
  )
  const gruposPorId = Object.fromEntries(
    gruposCompartilhamento.map((grupo) => [grupo.id, grupo]),
  )
  const usuarioIdsCompartilhados = new Set(permissoesUsuario.map((permissao) => permissao.alvoId))
  const grupoIdsCompartilhados = new Set(permissoesGrupo.map((permissao) => permissao.alvoId))
  const usuariosDisponiveis = usuariosCompartilhamento.filter(
    (usuario) =>
      usuario.ativo &&
      usuario.id !== nota.ownerId &&
      !usuarioIdsCompartilhados.has(usuario.id),
  )
  const gruposDisponiveis = gruposCompartilhamento.filter(
    (grupo) => !grupoIdsCompartilhados.has(grupo.id),
  )

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
          <Button
            tamanho="sm"
            onClick={() => void salvarAgora()}
            disabled={estadoSalvamento === 'salvando' || !podeAlterarConteudo}
          >
            <Save className="size-4" aria-hidden="true" />
            {podeEditarNota ? 'Salvar' : 'Enviar sugestao'}
          </Button>
          <div className="mx-2 hidden h-4 w-px bg-slate-300 dark:bg-slate-700 sm:block" />
          <div className="hidden gap-1 rounded-lg border border-slate-300 p-0.5 dark:border-slate-700 sm:inline-flex">
            <BotaoModoVisualizacao ativo={modoVisualizacao === 'editar'} aoClicar={() => setModoVisualizacao('editar')} rotulo="Editar" icone={PenLine} />
            <BotaoModoVisualizacao ativo={modoVisualizacao === 'dividido'} aoClicar={() => setModoVisualizacao('dividido')} rotulo="Dividido" icone={Columns2} />
            <BotaoModoVisualizacao ativo={modoVisualizacao === 'visualizar'} aoClicar={() => setModoVisualizacao('visualizar')} rotulo="Visualizar" icone={Eye} />
          </div>
          <div className="flex items-center gap-1">
            {podeAlterarMetadados && (
              <>
                <BotaoIcone
                  ativo={nota.favorita}
                  rotulo={nota.favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  aoClicar={() =>
                    void executarAcao(() =>
                      notasProtegidasStore.atualizarComoUsuario(
                        nota.id,
                        { favorita: !nota.favorita },
                        contextoNota,
                      ),
                    )
                  }
                >
                  <Star className={`size-4 ${nota.favorita ? 'fill-current' : ''}`} aria-hidden="true" />
                </BotaoIcone>
                <BotaoIcone
                  ativo={nota.fixada}
                  rotulo={nota.fixada ? 'Desfixar nota' : 'Fixar nota'}
                  aoClicar={() =>
                    void executarAcao(() =>
                      notasProtegidasStore.atualizarComoUsuario(
                        nota.id,
                        { fixada: !nota.fixada },
                        contextoNota,
                      ),
                    )
                  }
                >
                  <Pin className="size-4" aria-hidden="true" />
                </BotaoIcone>
              </>
            )}
            {permissoesEditor.duplicar && (
              <BotaoIcone
                ativo={false}
                rotulo="Duplicar nota"
                aoClicar={() =>
                  void notasProtegidasStore
                    .duplicarComoUsuario(nota.id, contextoNota)
                    .then((copia) => {
                      if (copia !== undefined) {
                        navigate(`/notas/${copia.id}`)
                      }
                    })
                    .catch((falha: unknown) => setMensagemAcao(getMensagemUsuario(falha)))
                }
              >
                <Copy className="size-4" aria-hidden="true" />
              </BotaoIcone>
            )}
            {podeAlterarMetadados && (
              <BotaoIcone
                ativo={false}
                rotulo="Arquivar nota"
                aoClicar={() =>
                  void notasProtegidasStore
                    .mudarStatusComoUsuario(nota.id, STATUS_NOTA.ARQUIVADA, contextoNota)
                    .then(() => navigate('/notas'))
                    .catch((falha: unknown) => setMensagemAcao(getMensagemUsuario(falha)))
                }
              >
                <Archive className="size-4" aria-hidden="true" />
              </BotaoIcone>
            )}
            {permissoesEditor.moverLixeira && (
              <BotaoIcone
                ativo={false}
                rotulo="Mover para a lixeira"
                aoClicar={() => setConfirmarLixeira(true)}
                className="hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </BotaoIcone>
            )}
          </div>
        </div>
      </div>

      <PageHeader
        titulo="Editor de nota"
        descricao={
          podeEditarNota
            ? 'Edite o conteudo em Markdown com preview renderizado.'
            : podeSugerirNota
              ? 'Envie sugestoes de conteudo para revisao do dono da nota.'
              : 'Visualize o conteudo da nota.'
        }
      />

      {mensagemAcao !== null && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {mensagemAcao}
        </p>
      )}

      <Input
        rotulo="Título"
        placeholder="Título da nota"
        value={titulo}
        maxLength={PREFERENCIAS.tituloEditorMaxCaracteres}
        onChange={(e) => setTitulo(e.target.value)}
        disabled={!podeEditarNota}
        aria-label="Título da nota"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Caderno</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
            value={nota.cadernoId ?? ''}
            onChange={(e) => mudarCaderno(e.target.value)}
            disabled={!podeAlterarMetadados}
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
                disabled={!podeAlterarMetadados}
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
              <Button tamanho="sm" onClick={() => void criarTag()} disabled={!podeAlterarMetadados}>
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
                      disabled={!podeAlterarMetadados}
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

      {podeAlterarMetadados && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Share2 className="size-4 text-indigo-500" aria-hidden="true" />
              Compartilhamento
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Visibilidade</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                value={nota.visibilidade ?? VISIBILIDADE_NOTA.PRIVADA}
                onChange={(e) => void alterarVisibilidade(e.target.value as Nota['visibilidade'])}
                aria-label="Visibilidade da nota"
              >
                <option value={VISIBILIDADE_NOTA.PRIVADA}>Privada</option>
                <option value={VISIBILIDADE_NOTA.PUBLICA}>Publica para usuarios autenticados</option>
              </select>
            </label>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {nota.visibilidade === VISIBILIDADE_NOTA.PUBLICA ? (
                <Users className="size-3.5" aria-hidden="true" />
              ) : (
                <LockKeyhole className="size-3.5" aria-hidden="true" />
              )}
              {nota.visibilidade === VISIBILIDADE_NOTA.PUBLICA
                ? 'Todos os usuarios autenticados podem visualizar.'
                : 'Somente dono e autorizados podem visualizar.'}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="compartilhar-usuario">
                Usuarios
              </label>
              <div className="flex gap-2">
                <select
                  id="compartilhar-usuario"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  value={usuarioParaCompartilhar}
                  onChange={(e) => setUsuarioParaCompartilhar(e.target.value)}
                >
                  <option value="">Selecionar usuario</option>
                  {usuariosDisponiveis.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </option>
                  ))}
                </select>
                <Button
                  tamanho="sm"
                  variante="secundario"
                  onClick={() => void compartilharComUsuario()}
                  disabled={usuarioParaCompartilhar === ''}
                >
                  Adicionar
                </Button>
              </div>
              <ul className="space-y-1">
                {permissoesUsuario.map((permissao) => (
                  <li
                    key={permissao.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    <span className="truncate">
                      {usuariosPorId[permissao.alvoId]?.nome ?? permissao.alvoId}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removerCompartilhamento(permissao)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remover
                    </button>
                  </li>
                ))}
                {permissoesUsuario.length === 0 && (
                  <li className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhum usuario autorizado diretamente.
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="compartilhar-grupo">
                Grupos
              </label>
              <div className="flex gap-2">
                <select
                  id="compartilhar-grupo"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  value={grupoParaCompartilhar}
                  onChange={(e) => setGrupoParaCompartilhar(e.target.value)}
                >
                  <option value="">Selecionar grupo</option>
                  {gruposDisponiveis.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
                <Button
                  tamanho="sm"
                  variante="secundario"
                  onClick={() => void compartilharComGrupo()}
                  disabled={grupoParaCompartilhar === ''}
                >
                  Adicionar
                </Button>
              </div>
              <ul className="space-y-1">
                {permissoesGrupo.map((permissao) => (
                  <li
                    key={permissao.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    <span className="truncate">
                      {gruposPorId[permissao.alvoId]?.nome ?? permissao.alvoId}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removerCompartilhamento(permissao)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remover
                    </button>
                  </li>
                ))}
                {permissoesGrupo.length === 0 && (
                  <li className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhum grupo autorizado.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

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
          disabled={anexando || !podeAlterarMetadados}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Inserir imagem
        </Button>
        <Button
          tamanho="sm"
          variante="secundario"
          onClick={() => inputArquivoRef.current?.click()}
          disabled={anexando || !podeAlterarMetadados}
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
                    {podeAlterarMetadados && (
                      <button
                        type="button"
                        onClick={() => setConfirmarRemoverAnexo(anexo)}
                        aria-label={`Remover ${anexo.nome}`}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
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
          <PainelEditor
            value={conteudo}
            onChange={setConteudo}
            refTexto={textareaRef}
            somenteLeitura={!podeAlterarConteudo}
          />
          <PainelPreview conteudo={conteudo} />
        </div>
      ) : modoVisualizacao === 'visualizar' ? (
        <PainelPreview conteudo={conteudo} />
      ) : (
        <PainelEditor
          value={conteudo}
          onChange={setConteudo}
          refTexto={textareaRef}
          somenteLeitura={!podeAlterarConteudo}
        />
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
  somenteLeitura?: boolean
}

function PainelEditor({ value, onChange, refTexto, somenteLeitura = false }: PainelEditorProps) {
  return (
    <textarea
      ref={refTexto}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={somenteLeitura}
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
