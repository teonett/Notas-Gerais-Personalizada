import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, Plus, X } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "../../components/ui";
import { notasStore, logger } from "../../core";
import type { FrequenciaDeTermo } from "../../core/grafo";
import { listarFrequenciasDeTermos } from "../../core/grafo";
import {
  NUVEM,
  lerConfiguracaoNuvem,
  normalizarStopword,
  normalizarTop,
  salvarConfiguracaoNuvem,
} from "../../core/nuvem/config";
import type { ConfiguracaoNuvem } from "../../core/nuvem/config";
import type { Nota } from "../../domain";
import { STATUS_NOTA } from "../../domain";
import { useTema } from "../../theme";

const PALETA_CLARA = [
  "#4338ca",
  "#6d28d9",
  "#7c3aed",
  "#a21caf",
  "#be185d",
  "#b91c1c",
  "#b45309",
  "#a16207",
  "#047857",
  "#065f46",
  "#0e7490",
  "#1d4ed8",
];

const PALETA_ESCURA = [
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#fbbf24",
  "#fcd34d",
  "#34d399",
  "#6ee7b7",
  "#22d3ee",
  "#60a5fa",
];

function indiceDaCor(termo: string): number {
  let hash = 0;
  for (let i = 0; i < termo.length; i += 1) {
    hash = (hash * 31 + termo.charCodeAt(i)) % 9973;
  }
  return hash % PALETA_CLARA.length;
}

interface DadosDaNuvem {
  frequencias: FrequenciaDeTermo[];
  totalDeNotas: number;
}

export function NuvemDePalavrasPage() {
  const navigate = useNavigate();
  const { tema } = useTema();
  const escuro = tema === "escuro";
  const [notas, setNotas] = useState<Nota[] | null>(null);
  const [config, setConfig] = useState<ConfiguracaoNuvem>({
    top: NUVEM.topPadrao,
    stopwords: [],
  });
  const [termoNovo, setTermoNovo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([notasStore.listarTodas(), lerConfiguracaoNuvem()])
      .then(([todas, conf]) => {
        if (ativo) {
          setNotas(todas);
          setConfig(conf);
        }
      })
      .catch(() => {
        if (ativo) {
          setNotas([]);
          setErro("Não foi possível carregar as preferências da nuvem.");
        }
        logger.aviso("Falha ao carregar as preferências da nuvem de palavras.");
      });
    return () => {
      ativo = false;
    };
  }, []);

  const bloqueadas = useMemo(
    () => new Set(config.stopwords),
    [config.stopwords],
  );
  const frequencias = useMemo(
    () => (notas === null ? [] : listarFrequenciasDeTermos(notas, bloqueadas)),
    [notas, bloqueadas],
  );
  const totalDeNotas = useMemo(
    () =>
      (notas ?? []).filter((nota) => nota.status === STATUS_NOTA.ATIVA).length,
    [notas],
  );
  const dados: DadosDaNuvem = { frequencias, totalDeNotas };
  const maisFrequentes = useMemo(
    () => frequencias.slice(0, config.top),
    [frequencias, config.top],
  );
  const maiorPeso = maisFrequentes[0]?.peso ?? 1;
  const paleta = escuro ? PALETA_ESCURA : PALETA_CLARA;

  function aplicar(novo: ConfiguracaoNuvem): void {
    setConfig(novo);
    void salvarConfiguracaoNuvem(novo).catch((falha: unknown) => {
      setErro("Não foi possível salvar as preferências da nuvem.");
      logger.aviso(`Falha ao salvar preferências da nuvem: ${String(falha)}`);
    });
  }

  function mudarTop(bruto: string): void {
    aplicar({ ...config, top: normalizarTop(bruto) });
  }

  function adicionarStopword(): void {
    const palavra = normalizarStopword(termoNovo);
    setTermoNovo("");
    if (palavra === "" || config.stopwords.includes(palavra)) {
      return;
    }
    aplicar({ ...config, stopwords: [...config.stopwords, palavra] });
  }

  function removerStopword(palavra: string): void {
    aplicar({
      ...config,
      stopwords: config.stopwords.filter((p) => p !== palavra),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Nuvem de palavras"
        descricao="Os termos mais recorrentes no título e conteúdo das suas notas."
      />

      <Card>
        <h2 className="text-sm font-semibold">Parâmetros</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Ajuste quantas palavras aparecer e quais devem ficar de fora. As
          preferências valem por conta e ficam salvas.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Top termos
            </span>
            <Input
              type="number"
              min={NUVEM.topMinimo}
              max={NUVEM.topMaximo}
              value={config.top}
              onChange={(e) => mudarTop(e.target.value)}
              aria-label="Quantidade de termos em destaque"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Entre {NUVEM.topMinimo} e {NUVEM.topMaximo}. Padrão:{" "}
              {NUVEM.topPadrao}.
            </span>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Palavras a ignorar
            </span>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                adicionarStopword();
              }}
            >
              <Input
                value={termoNovo}
                onChange={(e) => setTermoNovo(e.target.value)}
                placeholder="ex.: projeto"
                aria-label="Nova palavra a ignorar"
              />
              <Button
                tamanho="sm"
                type="submit"
                disabled={normalizarStopword(termoNovo) === ""}
              >
                <Plus className="size-4" aria-hidden="true" />
                Adicionar
              </Button>
            </form>
            {config.stopwords.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {config.stopwords.map((palavra) => (
                  <li key={palavra}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {palavra}
                      <button
                        type="button"
                        onClick={() => removerStopword(palavra)}
                        className="rounded-full text-slate-400 transition-colors hover:text-red-500"
                        aria-label={`Remover palavra ${palavra}`}
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {erro !== null && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {erro}
        </p>
      )}

      {notas === null ? (
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
          descricao="Não há palavras compartilhadas entre as notas ativas. Adicione conteúdo ou revise as palavras a ignorar."
        />
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {maisFrequentes.length} termos em destaque de{" "}
            {dados.frequencias.length} extraídos de {dados.totalDeNotas} notas ·
            clique em uma palavra para pesquisar as notas relacionadas.
          </p>
          <div
            className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 p-8 dark:border-slate-800"
            data-testid="nuvem"
          >
            {maisFrequentes.map(({ termo, peso, quantidadeDeNotas }) => (
              <button
                key={termo}
                type="button"
                title={`${peso} ocorrências em ${quantidadeDeNotas} notas`}
                onClick={() =>
                  navigate(`/busca?termo=${encodeURIComponent(termo)}`)
                }
                className="cursor-pointer font-semibold leading-tight transition-transform hover:-translate-y-0.5 hover:opacity-90"
                style={{
                  fontSize: 14 + (peso / maiorPeso) * 34,
                  color: paleta[indiceDaCor(termo)],
                }}
              >
                {termo}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Termos comuns demais (presentes em grande parte das notas) e
            palavras de ligação da lista padrão — além das que você adicionou —
            são ignorados.
          </p>
        </>
      )}
    </div>
  );
}
