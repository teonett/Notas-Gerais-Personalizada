import { lerMeta, gravarMeta } from "../storage/idb";

export const NUVEM = {
  metaChaveTop: "thothnet:nuvemTop",
  metaChaveStopwords: "thothnet:nuvemStopwords",
  topPadrao: 88,
  topMinimo: 25,
  topMaximo: 10000,
} as const;

export interface ConfiguracaoNuvem {
  top: number;
  stopwords: string[];
}

function normalizarInteiro(valor: number): number {
  if (!Number.isInteger(valor)) {
    return NUVEM.topPadrao;
  }
  return Math.min(NUVEM.topMaximo, Math.max(NUVEM.topMinimo, valor));
}

export function normalizarTop(valor: string | number): number {
  const numero = typeof valor === "string" ? Number.parseInt(valor, 10) : valor;
  return normalizarInteiro(numero);
}

export function normalizarStopword(palavra: string): string {
  return palavra
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function limparStopwords(lista: unknown[]): string[] {
  const palavras = lista.filter(
    (item): item is string => typeof item === "string",
  );
  return [
    ...new Set(
      palavras.map(normalizarStopword).filter((palavra) => palavra !== ""),
    ),
  ];
}

export async function lerConfiguracaoNuvem(): Promise<ConfiguracaoNuvem> {
  const [brutoTop, brutoStopwords] = await Promise.all([
    lerMeta(NUVEM.metaChaveTop),
    lerMeta(NUVEM.metaChaveStopwords),
  ]);
  let stopwords: string[] = [];
  if (brutoStopwords !== undefined) {
    try {
      const lista = JSON.parse(brutoStopwords) as unknown;
      if (Array.isArray(lista)) {
        stopwords = limparStopwords(lista);
      }
    } catch {
      stopwords = [];
    }
  }
  const top =
    brutoTop === undefined ? NUVEM.topPadrao : Number.parseInt(brutoTop, 10);
  return { top: normalizarInteiro(top), stopwords };
}

export async function salvarConfiguracaoNuvem(
  config: ConfiguracaoNuvem,
): Promise<void> {
  const top = normalizarInteiro(config.top);
  const stopwords = limparStopwords(config.stopwords);
  await Promise.all([
    gravarMeta(NUVEM.metaChaveTop, String(top)),
    gravarMeta(NUVEM.metaChaveStopwords, JSON.stringify(stopwords)),
  ]);
}
