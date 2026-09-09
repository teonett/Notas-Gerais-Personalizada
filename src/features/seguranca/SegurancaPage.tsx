import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { KeyRound, Lock, Plus, Trash2 } from 'lucide-react'
import type { ContaLocal } from '../../domain'
import { getMensagemUsuario } from '../../core/errors'
import { listarContas } from '../../core/auth/contas'
import { bloquear, obterSessao, removerConta } from '../../core/auth/sessao'
import { Badge, Button, Card, ConfirmDialog, PageHeader } from '../../components/ui'

export function SegurancaPage() {
  const navegar = useNavigate()
  const sessao = obterSessao()
  const [contas, setContas] = useState<ContaLocal[]>([])
  const [removendo, setRemovendo] = useState<ContaLocal | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function atualizar() {
    setContas(await listarContas())
  }

  useEffect(() => {
    void listarContas().then(setContas)
  }, [])

  async function bloquearDados() {
    setOcupado(true)
    setErro(null)
    try {
      await bloquear()
    } catch (falha: unknown) {
      setErro(getMensagemUsuario(falha))
    } finally {
      setOcupado(false)
    }
  }

  async function remover(conta: ContaLocal) {
    setOcupado(true)
    setErro(null)
    try {
      await removerConta(conta.id)
      setRemovendo(null)
      await atualizar()
      if (sessao?.contaId === conta.id) {
        navegar('/')
      }
    } catch (falha: unknown) {
      setErro(getMensagemUsuario(falha))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Contas e segurança"
        descricao="Cada conta usa uma senha para criptografar os dados neste dispositivo."
        acoes={
          <Link to="/">
            <Button variante="secundario" tamanho="sm">
              <Plus className="size-4" aria-hidden="true" />
              Nova conta
            </Button>
          </Link>
        }
      />

      {erro !== null && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {erro}
        </p>
      )}

      <Card>
        <h2 className="text-sm font-semibold">Contas deste dispositivo</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Criptografia AES-256-GCM com derivação de chave PBKDF2. Sem a senha, os dados da conta
          não podem ser lidos novamente.
        </p>
        <ul className="mt-4 space-y-2">
          {contas.map((conta) => (
            <li
              key={conta.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-slate-400" aria-hidden="true" />
                <span className="text-sm font-medium">{conta.nome}</span>
                {sessao?.contaId === conta.id && (
                  <Badge cor="indigo">Ativa</Badge>
                )}
              </div>
              <Button
                tamanho="sm"
                variante="fantasma"
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                onClick={() => setRemovendo(conta)}
                disabled={ocupado}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remover
              </Button>
            </li>
          ))}
          {contas.length === 0 && (
            <li className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma conta local criada ainda.
            </li>
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Sessão</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {sessao === null
            ? 'O cofre está bloqueado. Digite a senha para acessar os dados.'
            : `Você está desbloqueado como ${sessao.nome}.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void bloquearDados()} disabled={ocupado || sessao === null}>
            <Lock className="size-4" aria-hidden="true" />
            Bloquear agora
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Atenção</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-500 dark:text-slate-400">
          <li>Remover uma conta apaga o banco de dados criptografado local dela.</li>
          <li>A senha não é armazenada em lugar nenhum: não há como recuperá-la.</li>
          <li>Dados migrados do banco anterior ficam criptografados na nova conta.</li>
        </ul>
      </Card>

      <ConfirmDialog
        aberto={removendo !== null}
        titulo="Remover conta"
        mensagem={
          contas.length > 1
            ? `Remover a conta "${removendo?.nome ?? ''}" apaga todos os dados dela deste dispositivo.`
            : `Remover a conta "${removendo?.nome ?? ''}" apaga todos os dados dela deste dispositivo. Não é possível desfazer.`
        }
        confirmarLabel="Remover"
        perigo
        aoConfirmar={() => {
          if (removendo !== null) {
            void remover(removendo)
          }
        }}
        aoCancelar={() => setRemovendo(null)}
      />
    </div>
  )
}