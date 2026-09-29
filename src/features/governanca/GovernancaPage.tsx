import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, UserPlus, UsersRound } from 'lucide-react'
import { Badge, Button, ConfirmDialog, EmptyState, Input, PageHeader } from '../../components/ui'
import { getMensagemUsuario, governancaStore } from '../../core'
import { PAPEL_USUARIO } from '../../domain'
import type { Grupo, MembroGrupo, PapelUsuario, Usuario } from '../../domain'
import { useContextoNotaAtual } from '../notas/hooks'

interface EstadoGovernanca {
  usuarios: Usuario[]
  grupos: Grupo[]
  membros: MembroGrupo[]
}

const ESTADO_VAZIO: EstadoGovernanca = {
  usuarios: [],
  grupos: [],
  membros: [],
}

export function GovernancaPage() {
  const contexto = useContextoNotaAtual()
  const [estado, setEstado] = useState<EstadoGovernanca>(ESTADO_VAZIO)
  const [acessoNegado, setAcessoNegado] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)
  const [novoUsuario, setNovoUsuario] = useState('')
  const [novoUsuarioAdmin, setNovoUsuarioAdmin] = useState(false)
  const [novoGrupo, setNovoGrupo] = useState('')
  const [grupoParaRemover, setGrupoParaRemover] = useState<Grupo | null>(null)
  const [membroSelecionado, setMembroSelecionado] = useState<Record<string, string>>({})

  const usuariosPorId = useMemo(
    () => Object.fromEntries(estado.usuarios.map((usuario) => [usuario.id, usuario])),
    [estado.usuarios],
  )

  useEffect(() => {
    let ativo = true
    governancaStore
      .listar(contexto)
      .then((resumo) => {
        if (ativo) {
          setEstado(resumo)
          setAcessoNegado(false)
        }
      })
      .catch((falha: unknown) => {
        if (ativo) {
          setAcessoNegado(true)
          setMensagem(getMensagemUsuario(falha))
        }
      })
    return () => {
      ativo = false
    }
  }, [contexto, versao])

  const executar = async (acao: () => Promise<unknown>): Promise<void> => {
    setMensagem(null)
    try {
      await acao()
      setVersao((atual) => atual + 1)
    } catch (falha: unknown) {
      setMensagem(getMensagemUsuario(falha))
    }
  }

  const criarUsuario = async (): Promise<void> => {
    const nome = novoUsuario.trim()
    if (nome === '') {
      setMensagem('Informe o nome do usuario.')
      return
    }
    const papeis: PapelUsuario[] = novoUsuarioAdmin
      ? [PAPEL_USUARIO.USUARIO, PAPEL_USUARIO.ADMIN]
      : [PAPEL_USUARIO.USUARIO]
    await executar(() => governancaStore.criarUsuario({ nome, papeis }, contexto))
    setNovoUsuario('')
    setNovoUsuarioAdmin(false)
  }

  const alternarPapel = async (usuario: Usuario, papel: PapelUsuario): Promise<void> => {
    const papeis = usuario.papeis.includes(papel)
      ? usuario.papeis.filter((p) => p !== papel)
      : [...usuario.papeis, papel]
    await executar(() => governancaStore.atualizarUsuario(usuario.id, { papeis }, contexto))
  }

  const criarGrupo = async (): Promise<void> => {
    const nome = novoGrupo.trim()
    if (nome === '') {
      setMensagem('Informe o nome do grupo.')
      return
    }
    await executar(() => governancaStore.criarGrupo({ nome }, contexto))
    setNovoGrupo('')
  }

  const membrosDoGrupo = (grupoId: string): MembroGrupo[] =>
    estado.membros.filter((membro) => membro.grupoId === grupoId)

  const usuariosForaDoGrupo = (grupoId: string): Usuario[] => {
    const membros = new Set(membrosDoGrupo(grupoId).map((membro) => membro.usuarioId))
    return estado.usuarios.filter((usuario) => usuario.ativo && !membros.has(usuario.id))
  }

  if (acessoNegado) {
    return (
      <EmptyState
        icone={ShieldCheck}
        titulo="Acesso restrito"
        descricao={mensagem ?? 'Somente administradores podem acessar a governanca.'}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Governanca"
        descricao="Gerencie usuarios, papeis e grupos globais do app."
      />

      {mensagem !== null && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {mensagem}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Input
              rotulo="Novo usuario"
              placeholder="Nome do usuario"
              value={novoUsuario}
              onChange={(e) => setNovoUsuario(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 pb-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={novoUsuarioAdmin}
              onChange={(e) => setNovoUsuarioAdmin(e.target.checked)}
              className="size-4 accent-indigo-600"
            />
            Admin
          </label>
          <Button onClick={() => void criarUsuario()}>
            <UserPlus className="size-4" aria-hidden="true" />
            Criar usuario
          </Button>
        </div>

        <div className="grid gap-3">
          {estado.usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{usuario.nome}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge cor={usuario.ativo ? 'esmeralda' : 'cinza'}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {usuario.papeis.map((papel) => (
                    <Badge key={papel} cor={papel === PAPEL_USUARIO.ADMIN ? 'ambar' : 'indigo'}>
                      {papel}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usuario.papeis.includes(PAPEL_USUARIO.USUARIO)}
                    onChange={() => void alternarPapel(usuario, PAPEL_USUARIO.USUARIO)}
                    className="size-4 accent-indigo-600"
                  />
                  Usuario
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usuario.papeis.includes(PAPEL_USUARIO.ADMIN)}
                    onChange={() => void alternarPapel(usuario, PAPEL_USUARIO.ADMIN)}
                    className="size-4 accent-indigo-600"
                  />
                  Admin
                </label>
                <Button
                  tamanho="sm"
                  variante="secundario"
                  onClick={() =>
                    void executar(() =>
                      governancaStore.atualizarUsuario(usuario.id, { ativo: !usuario.ativo }, contexto),
                    )
                  }
                >
                  {usuario.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Input
              rotulo="Novo grupo"
              placeholder="Nome do grupo"
              value={novoGrupo}
              onChange={(e) => setNovoGrupo(e.target.value)}
            />
          </div>
          <Button onClick={() => void criarGrupo()}>
            <UsersRound className="size-4" aria-hidden="true" />
            Criar grupo
          </Button>
        </div>

        <div className="grid gap-3">
          {estado.grupos.map((grupo) => {
            const membros = membrosDoGrupo(grupo.id)
            const disponiveis = usuariosForaDoGrupo(grupo.id)
            return (
              <div
                key={grupo.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">{grupo.nome}</h2>
                  <Button tamanho="sm" variante="perigo" onClick={() => setGrupoParaRemover(grupo)}>
                    Remover grupo
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {membros.map((membro) => (
                    <span
                      key={membro.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1 text-sm dark:bg-slate-800"
                    >
                      {usuariosPorId[membro.usuarioId]?.nome ?? membro.usuarioId}
                      <button
                        type="button"
                        onClick={() =>
                          void executar(() =>
                            governancaStore.removerMembro(grupo.id, membro.usuarioId, contexto),
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Remover
                      </button>
                    </span>
                  ))}
                  {membros.length === 0 && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum membro.
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    value={membroSelecionado[grupo.id] ?? ''}
                    onChange={(e) =>
                      setMembroSelecionado((atual) => ({
                        ...atual,
                        [grupo.id]: e.target.value,
                      }))
                    }
                    aria-label={`Adicionar membro ao grupo ${grupo.nome}`}
                  >
                    <option value="">Selecionar usuario</option>
                    {disponiveis.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                  <Button
                    tamanho="sm"
                    variante="secundario"
                    disabled={(membroSelecionado[grupo.id] ?? '') === ''}
                    onClick={() =>
                      void executar(() =>
                        governancaStore.adicionarMembro(
                          grupo.id,
                          membroSelecionado[grupo.id] ?? '',
                          contexto,
                        ),
                      )
                    }
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            )
          })}
          {estado.grupos.length === 0 && (
            <EmptyState
              icone={UsersRound}
              titulo="Nenhum grupo criado"
              descricao="Crie grupos globais para compartilhar notas com varias pessoas."
            />
          )}
        </div>
      </section>

      <ConfirmDialog
        aberto={grupoParaRemover !== null}
        titulo="Remover grupo"
        mensagem={`O grupo "${grupoParaRemover?.nome ?? ''}" sera removido, junto com seus membros.`}
        confirmarLabel="Remover grupo"
        perigo
        aoCancelar={() => setGrupoParaRemover(null)}
        aoConfirmar={() => {
          if (grupoParaRemover !== null) {
            void executar(() => governancaStore.removerGrupo(grupoParaRemover.id, contexto))
          }
          setGrupoParaRemover(null)
        }}
      />
    </div>
  )
}
