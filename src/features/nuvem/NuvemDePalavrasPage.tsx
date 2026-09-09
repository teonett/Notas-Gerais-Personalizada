import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud } from 'lucide-react'
import { EmptyState, PageHeader } from '../../components/ui'
import { notasStore, logger } from '../../core'
import type { FrequenciaDeTermo } from '../../core/grafo'
import { listarFrequenciasDeTermos } from '../../core/grafo'
import { STATUS_NOTA } from '../../domain'
import { useTema } from '../../theme'

const MAX_TERMOS_NA_NUVEM = 80

const PALETA_CLARA = [
  '#4338ca',
  '#6d28d9',
  '#7c3aed',
  '#a21caf',
  '#be185d',
  '#b91c1c',
  '#b45309',
  '#a16207',
  '#047857',
  '#065f46',
  '#0e7490',
  '#1d4ed8',
]

const PALETA_ESCURA = [
  '#818cf8',
  '#a78bfa',
  '#c084fc',
  '#e879f9',
  '#f472b6',
  '#fb7185',
  '#fbbf24',
  '#fcd34d',
  '#34d399',
  '#6ee7b7',
  '#22d3ee',
  '#60a5fa',
]

function indiceDaCor(termo: string): number {
  let hash = 0
  for (let i = 0; i < termo.length; i += 1) {
    hash = (hash * 31 + termo.charCodeAt(i)) % 9973
  }
  return hash % PALETA_CLARA.length
}

interface DadosDaNuvem {
  frequencias: FrequenciaDeTermo[]
  totalDeNotas: number
}

export function NuvemDePalavrasPage() {
  const navigate = useNavigate()
  const { tema } = useTema()
  const escuro = tema === 'escuro'
  const [dados, setDados] = useState<DadosDaNuvem | null>(null)

  useEffect(() => {
    let ativo = true
    notasStore
      .listarTodas()
      .then((todas) => {
        const ativas = todas.filter((nota) => nota.status === STATUS_NOTA.ATIVA)
        if (ativo) {
          setDados({ frequencias: listarFrequenciasDeTermos(todas), totalDeNotas: ativas.length })
        }
      })
      .catch(() => {
        if (ativo) {
          setDados({ frequencias: [], totalDeNotas: 0 })
        }
        logger.aviso('Falha ao carregar notas para a nuvem de palavras.')
      })
    return () => {
      ativo = false
    }
  }, [])

  const maisFrequentes = useMemo(() => (dados?.frequencias ?? []).slice(0, MAX_TERMOS_NA_NUVEM), [dados])
  const maiorPeso = maisFrequentes[0]?.peso ?? 1
  const paleta = escuro ? PALETA_ESCURA : PALETA_CLARA

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Nuvem de palavras"
        descricao="Os termos mais recorrentes no título e conteúdo das suas notas."
      />

      {dados === null ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700">
          Carregando nuvem…
        </div>
      ) : dados.totalDeNotas === 0 ? (
        <EmptyState
          icone={Cloud}
          titulo="Nenhuma nota para analisar"
          descricao="Crie notas para que a nuvem de palavras possa identificar os termos mais importantes."
        />
      ) : maisFrequentes.length === 0 ? (
        <EmptyState
          icone={Cloud}
          titulo="Nenhum termo em comum"
          descricao="Não há palavras compartilhadas entre as notas ativas. Adicione conteúdo para destacar termos."
        />
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dados.frequencias.length} termos extraídos de {dados.totalDeNotas} notas · clique em uma
            palavra para pesquisar as notas relacionadas.
          </p>
          <div
            className="flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 p-8 dark:border-slate-800"
            data-testid="nuvem"
          >
            {maisFrequentes.map(({ termo, peso, quantidadeDeNotas }) => (
              <button
                key={termo}
                type="button"
                title={`${peso} ocorrências em ${quantidadeDeNotas} notas`}
                onClick={() => navigate(`/busca?termo=${encodeURIComponent(termo)}`)}
                className="cursor-pointer font-semibold leading-tight transition-transform hover:-translate-y-0.5 hover:opacity-90"
                style={{ fontSize: 14 + (peso / maiorPeso) * 34, color: paleta[indiceDaCor(termo)] }}
              >
                {termo}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Termos comuns demais (presentes em grande parte das notas) e palavras de ligação são
            ignorados.
          </p>
        </>
      )}
    </div>
  )
}