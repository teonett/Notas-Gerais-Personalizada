import { useEffect, useState } from 'react'
import { CloudUpload, KeyRound, RefreshCw, Save, Trash2 } from 'lucide-react'
import { Card, Button, Input, PageHeader } from '../../components/ui'
import { dataRelativa, getMensagemUsuario } from '../../core'
import type { ConfiguracaoSync } from '../../sync'
import {
  lerConfiguracaoSync,
  limparUrlSync,
  removerConfiguracaoSync,
  salvarConfiguracaoSync,
  sincronizar,
  validarConfiguracao,
} from '../../sync'
import { useEstadoSync } from './hooks'

type MensagemSync = { tipo: 'ok' | 'erro'; texto: string }

export function SyncPage() {
  const { estado, recarregar } = useEstadoSync()
  const [url, setUrl] = useState('')
  const [segredo, setSegredo] = useState('')
  const [erroFormulario, setErroFormulario] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [mensagem, setMensagem] = useState<MensagemSync | null>(null)

  useEffect(() => {
    let ativo = true
    void lerConfiguracaoSync().then((config) => {
      if (ativo) {
        setUrl(config?.urlBase ?? '')
      }
    })
    return () => {
      ativo = false
    }
  }, [])

  const salvar = async () => {
    const config: ConfiguracaoSync = { urlBase: url, segredo }
    const erro = validarConfiguracao(config)
    setErroFormulario(erro ?? '')
    if (erro !== null) {
      return
    }
    setSalvando(true)
    try {
      await salvarConfiguracaoSync({ urlBase: limparUrlSync(url), segredo })
      setMensagem({ tipo: 'ok', texto: 'Configuração salva.' })
    } catch {
      setErroFormulario('Não foi possível salvar a configuração.')
    } finally {
      setSalvando(false)
      recarregar()
    }
  }

  const desconfigurar = async () => {
    await removerConfiguracaoSync()
    setUrl('')
    setSegredo('')
    setMensagem(null)
    recarregar()
  }

  const sincronizarAgora = async () => {
    setSincronizando(true)
    setMensagem(null)
    try {
      const resultado = await sincronizar()
      setMensagem({
        tipo: 'ok',
        texto: `${resultado.enviadas} enviadas, ${resultado.recebidas} recebidas, ${resultado.blobsBaixados} anexos baixados.`,
      })
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: getMensagemUsuario(erro) })
    } finally {
      setSincronizando(false)
      recarregar()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Sincronização"
        descricao="Sincronize suas notas entre dispositivos com um segredo compartilhado."
      />

      <Card>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CloudUpload className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          Servidor e segredo
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            rotulo="URL do servidor (ex.: https://sync.seudominio.com)"
            placeholder="https://…"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            erro={erroFormulario !== '' ? erroFormulario : undefined}
          />
          <Input
            rotulo="Segredo compartilhado"
            placeholder="Digite o segredo"
            type="password"
            value={segredo}
            onChange={(e) => setSegredo(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void salvar()} disabled={salvando}>
              <Save className="size-4" aria-hidden="true" />
              {salvando ? 'Salvando…' : 'Salvar configuração'}
            </Button>
            {estado.configurada && (
              <Button variante="secundario" onClick={() => void desconfigurar()}>
                <Trash2 className="size-4" aria-hidden="true" />
                Desconfigurar
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <KeyRound className="mr-1 inline size-3.5" aria-hidden="true" />
            O segredo identifica seus dispositivos. Use o mesmo valor em todos eles.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <RefreshCw className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          Status
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Configuração</dt>
            <dd>{estado.configurada ? 'configurada' : 'não configurada'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Última sincronização</dt>
            <dd>
              {estado.ultimaSincronizacao === null
                ? 'nunca'
                : dataRelativa(estado.ultimaSincronizacao)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Mudanças pendentes</dt>
            <dd>{estado.pendentes}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">Anexos a baixar</dt>
            <dd>{estado.blobsPendentes}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Button
            onClick={() => void sincronizarAgora()}
            disabled={!estado.configurada || sincronizando}
          >
            <RefreshCw className={`size-4 ${sincronizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
          </Button>
        </div>
        {mensagem !== null && (
          <p
            role="status"
            className={`mt-4 text-sm ${
              mensagem.tipo === 'ok'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {mensagem.texto}
          </p>
        )}
      </Card>
    </div>
  )
}