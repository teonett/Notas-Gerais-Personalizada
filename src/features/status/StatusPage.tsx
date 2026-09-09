import { useEffect, useState } from 'react'
import { Database, Wifi, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, PageHeader } from '../../components/ui'
import { APP } from '../../config/app'
import { formatarEstimativa, logger, obterStatusArmazenamento } from '../../core'
import type { StorageStatus } from '../../core'

interface InfoConexao {
  online: boolean
}

interface EstimativaDisco {
  uso: number | undefined
  cota: number | undefined
  persistente: boolean
}

function useConexao(): InfoConexao {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const aoConectar = () => setOnline(true)
    const aoDesconectar = () => setOnline(false)
    window.addEventListener('online', aoConectar)
    window.addEventListener('offline', aoDesconectar)
    return () => {
      window.removeEventListener('online', aoConectar)
      window.removeEventListener('offline', aoDesconectar)
    }
  }, [])

  return { online }
}

function useEstimativaDisco(): EstimativaDisco {
  const [estimativa, setEstimativa] = useState<EstimativaDisco>({
    uso: undefined,
    cota: undefined,
    persistente: false,
  })

  useEffect(() => {
    if (!('storage' in navigator)) {
      return
    }
    let ativo = true
    void navigator.storage
      .estimate()
      .then((resultado) => {
        if (ativo) {
          setEstimativa((atual) => ({
            ...atual,
            uso: resultado.usage ?? undefined,
            cota: resultado.quota ?? undefined,
          }))
        }
      })
      .catch(() => {
        logger.aviso('Falha ao estimar o uso do armazenamento.')
      })
    if (typeof navigator.storage.persisted === 'function') {
      void navigator.storage
        .persisted()
        .then((persistente) => {
          if (ativo) {
            setEstimativa((atual) => ({ ...atual, persistente }))
          }
        })
        .catch(() => undefined)
    }
    return () => {
      ativo = false
    }
  }, [])

  return estimativa
}

export function StatusPage() {
  const { online } = useConexao()
  const [armazenamento, setArmazenamento] = useState<StorageStatus | null>(null)
  const { uso, cota, persistente } = useEstimativaDisco()

  useEffect(() => {
    obterStatusArmazenamento()
      .then(setArmazenamento)
      .catch(() => {
        logger.aviso('Falha ao obter o status do armazenamento local.')
      })
  }, [])

  const percentual =
    uso !== undefined && cota !== undefined && cota > 0
      ? Math.min(100, Math.round((uso / cota) * 100))
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Armazenamento e sincronização"
        descricao="Situação atual do dispositivo e da persistência local."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {online ? (
              <Wifi className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <WifiOff className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            )}
            Conexão
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {online
              ? 'Dispositivo conectado à internet.'
              : 'Dispositivo offline. As alterações ficam salvas localmente e podem ser sincronizadas depois.'}
          </p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            Armazenamento local
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {armazenamento === null
              ? 'Verificando…'
              : armazenamento.suportado
                ? `IndexedDB disponível${armazenamento.somenteLeitura ? ' (somente leitura)' : ''}. Anexos e notas ficam no dispositivo.`
                : 'Armazenamento local não suportado neste navegador.'}
          </p>
        </Card>
      </div>

      {uso !== undefined && (
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            Espaço em uso
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Em uso: {formatarEstimativa(uso)} · Cota: {formatarEstimativa(cota)}.
            {persistente ? ' Armazenamento persistente ativo.' : ''}
          </p>
          {percentual !== null && (
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
              role="meter"
              aria-valuenow={percentual}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full ${percentual > 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                style={{ width: `${percentual}%` }}
              />
            </div>
          )}
        </Card>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {APP.nome} v{APP.versao} — aplicação offline-first: dados salvos localmente. Configure a
        sincronização entre dispositivos na página{' '}
        <Link to="/sincronizar" className="text-indigo-600 underline dark:text-indigo-400">
          Sincronização
        </Link>
        . A sincronização automática em segundo plano e o tratamento de conflitos mais detalhado virão
        em etapas futuras.
      </p>
    </div>
  )
}