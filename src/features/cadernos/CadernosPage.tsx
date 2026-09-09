import { useMemo, useState } from 'react'
import { FolderOpen, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader } from '../../components/ui'
import { cadernosStore, notasStore } from '../../core'
import { LIMITS } from '../../config/limits'
import { useCadernos } from './hooks'
import { useNotas } from '../notas/hooks'
import { STATUS_NOTA } from '../../domain'

export function CadernosPage() {
  const { itens: cadernos, recarregar: recarregarCadernos } = useCadernos()
  const { itens: notas } = useNotas({ status: STATUS_NOTA.ATIVA })
  const [modalAberto, setModalAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [idEdicao, setIdEdicao] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [erroNome, setErroNome] = useState<string | null>(null)
  const [idExclusao, setIdExclusao] = useState<string | null>(null)

  const contagemPorCaderno = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const nota of notas) {
      if (nota.cadernoId !== null) {
        mapa.set(nota.cadernoId, (mapa.get(nota.cadernoId) ?? 0) + 1)
      }
    }
    return mapa
  }, [notas])

  const fecharModal = () => {
    setModalAberto(false)
    setModoEdicao(false)
    setIdEdicao(null)
    setNome('')
    setErroNome(null)
  }

  const salvar = async () => {
    const valor = nome.trim()
    if (valor === '') {
      setErroNome('Informe um nome para o caderno.')
      return
    }
    if (modoEdicao && idEdicao !== null) {
      await cadernosStore.renomear(idEdicao, valor)
    } else {
      await cadernosStore.criar(valor)
    }
    fecharModal()
    recarregarCadernos()
  }

  const excluir = async () => {
    if (idExclusao === null) return
    const todas = await notasStore.listarTodas()
    for (const nota of todas) {
      if (nota.cadernoId === idExclusao) {
        await notasStore.atualizar(nota.id, { cadernoId: null })
      }
    }
    await cadernosStore.remover(idExclusao)
    setIdExclusao(null)
    recarregarCadernos()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Cadernos e pastas"
        descricao="Organize suas notas em estruturas hierárquicas."
        acoes={
          <Button
            onClick={() => {
              setModoEdicao(false)
              setModalAberto(true)
            }}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
            Novo caderno
          </Button>
        }
      />

      {cadernos.length === 0 ? (
        <EmptyState
          icone={FolderOpen}
          titulo="Nenhum caderno criado"
          descricao="Crie cadernos para agrupar suas notas por assunto ou projeto."
          acao={
            <Button
              onClick={() => {
                setModoEdicao(false)
                setModalAberto(true)
              }}
            >
              <FolderPlus className="size-4" aria-hidden="true" />
              Criar primeiro caderno
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cadernos.map((caderno) => (
            <div
              key={caderno.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10">
                    <FolderOpen
                      className="size-5 text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{caderno.nome}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {contagemPorCaderno.get(caderno.id) ?? 0} nota
                      {contagemPorCaderno.get(caderno.id) === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Renomear ${caderno.nome}`}
                    onClick={() => {
                      setModoEdicao(true)
                      setIdEdicao(caderno.id)
                      setNome(caderno.nome)
                      setModalAberto(true)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${caderno.nome}`}
                    onClick={() => setIdExclusao(caderno.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        aberto={modalAberto}
        titulo={modoEdicao ? 'Renomear caderno' : 'Novo caderno'}
        descricao="As notas podem ser atribuídas a um caderno na tela de edição."
        aoFechar={fecharModal}
      >
        <div className="flex flex-col gap-4">
          <Input
            rotulo="Nome"
            placeholder="Ex.: Estudos, Trabalho…"
            value={nome}
            maxLength={LIMITS.tituloNotaMaxCaracteres}
            onChange={(e) => {
              setNome(e.target.value)
              setErroNome(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void salvar()
            }}
            erro={erroNome ?? undefined}
          />
          <div className="flex justify-end gap-3">
            <Button variante="secundario" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button onClick={() => void salvar()}>{modoEdicao ? 'Salvar' : 'Criar'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        aberto={idExclusao !== null}
        titulo="Excluir caderno"
        mensagem="As notas deste caderno não serão excluídas — elas apenas deixarão de estar vinculadas."
        confirmarLabel="Excluir caderno"
        perigo
        aoCancelar={() => setIdExclusao(null)}
        aoConfirmar={() => void excluir()}
      />
    </div>
  )
}