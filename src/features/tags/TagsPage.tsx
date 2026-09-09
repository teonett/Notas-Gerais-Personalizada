import { useMemo, useState } from 'react'
import { Hash, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader } from '../../components/ui'
import { notasStore, tagsStore } from '../../core'
import { useTags } from './hooks'
import { useNotas } from '../notas/hooks'

export function TagsPage() {
  const { itens: tags, recarregar: recarregarTags } = useTags()
  const { itens: notas } = useNotas()
  const [modalAberto, setModalAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [idEdicao, setIdEdicao] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [erroNome, setErroNome] = useState<string | null>(null)
  const [idExclusao, setIdExclusao] = useState<string | null>(null)

  const contagemPorTag = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const nota of notas) {
      for (const tagId of nota.tagIds) {
        mapa.set(tagId, (mapa.get(tagId) ?? 0) + 1)
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
      setErroNome('Informe um nome para a tag.')
      return
    }
    const jaExiste = tags.some(
      (tag) =>
        tag.nome.trim().toLowerCase() === valor.toLowerCase() &&
        (modoEdicao === false || tag.id !== idEdicao),
    )
    if (jaExiste) {
      setErroNome('Já existe uma tag com esse nome.')
      return
    }
    if (modoEdicao && idEdicao !== null) {
      await tagsStore.renomear(idEdicao, valor)
    } else {
      await tagsStore.criar(valor)
    }
    fecharModal()
    recarregarTags()
  }

  const excluir = async () => {
    if (idExclusao === null) return
    await notasStore.removerTagDeTodasNotas(idExclusao)
    await tagsStore.remover(idExclusao)
    setIdExclusao(null)
    recarregarTags()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Tags"
        descricao="Classifique e filtre suas notas por etiquetas."
        acoes={
          <Button
            onClick={() => {
              setModoEdicao(false)
              setModalAberto(true)
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova tag
          </Button>
        }
      />

      {tags.length === 0 ? (
        <EmptyState
          icone={Tag}
          titulo="Nenhuma tag criada"
          descricao="Crie tags para classificar suas notas por tema, prioridade ou contexto."
          acao={
            <Button
              onClick={() => {
                setModoEdicao(false)
                setModalAberto(true)
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Criar primeira tag
            </Button>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Hash className="size-4 text-emerald-500" aria-hidden="true" />
              <span className="text-sm font-medium">{tag.nome}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {contagemPorTag.get(tag.id) ?? 0}
              </span>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={`Renomear ${tag.nome}`}
                  onClick={() => {
                    setModoEdicao(true)
                    setIdEdicao(tag.id)
                    setNome(tag.nome)
                    setModalAberto(true)
                  }}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${tag.nome}`}
                  onClick={() => setIdExclusao(tag.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        aberto={modalAberto}
        titulo={modoEdicao ? 'Renomear tag' : 'Nova tag'}
        descricao="Tags ajudam a encontrar e agrupar notas por tema."
        aoFechar={fecharModal}
      >
        <div className="flex flex-col gap-4">
          <Input
            rotulo="Nome"
            placeholder="Ex.: ideias, projetos, leitura…"
            value={nome}
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
        titulo="Excluir tag"
        mensagem="A tag será removida de todas as notas que a utilizam. As notas não são excluídas."
        confirmarLabel="Excluir tag"
        perigo
        aoCancelar={() => setIdExclusao(null)}
        aoConfirmar={() => void excluir()}
      />
    </div>
  )
}