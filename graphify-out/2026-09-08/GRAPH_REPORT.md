# Graph Report - ThothNet  (2026-09-08)

## Corpus Check
- 96 files · ~16,065 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 387 nodes · 886 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b0e8510`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ui/index.ts
- domain/index.ts
- dependencies
- TemaProvider.tsx
- ImportacaoExportacaoPage.tsx
- devDependencies
- compilerOptions
- errors/index.ts
- compilerOptions
- layout/index.ts
- idb.ts
- GrafoNotaPage.tsx
- plugins
- EditorPage.tsx
- React + TypeScript + Vite
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `react` - 26 edges
2. `compilerOptions` - 19 edges
3. `PageHeader()` - 17 edges
4. `useNotas()` - 17 edges
5. `useTags()` - 15 edges
6. `compilerOptions` - 15 edges
7. `Button()` - 11 edges
8. `notasStore` - 11 edges
9. `abrirBancoDeDados()` - 11 edges
10. `Nota` - 10 edges

## Surprising Connections (you probably didn't know these)
- `criarErro()` --calls--> `AppError`  [EXTRACTED]
  src/core/storage/idb.ts → src/core/errors/AppError.ts
- `LixeiraPage()` --calls--> `dataRelativa()`  [EXTRACTED]
  src/features/lixeira/LixeiraPage.tsx → src/core/formato/datas.ts
- `NotaCard()` --calls--> `dataRelativa()`  [EXTRACTED]
  src/features/notas/components/NotaCard.tsx → src/core/formato/datas.ts
- `NotaCard()` --calls--> `textoSimples()`  [EXTRACTED]
  src/features/notas/components/NotaCard.tsx → src/core/markdown/convert.ts
- `construirAnexo()` --calls--> `gerarId()`  [EXTRACTED]
  src/core/repositorios/anexos.ts → src/domain/id.ts

## Import Cycles
- None detected.

## Communities (18 total, 1 thin omitted)

### Community 0 - "ui/index.ts"
Cohesion: 0.09
Nodes (40): react, Badge(), BadgeCor, BadgeProps, Cor, CORES, Button(), ButtonProps (+32 more)

### Community 1 - "domain/index.ts"
Cohesion: 0.11
Nodes (24): ImagemMarkdown(), MarkdownPreview(), MarkdownPreviewProps, anexosStore, construirAnexo(), urlDeBlobAnexo(), urlsDeAnexos, comTransacao() (+16 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (29): lucide-react, marked, dependencies, lucide-react, marked, react, react-dom, react-markdown (+21 more)

### Community 3 - "TemaProvider.tsx"
Cohesion: 0.24
Nodes (10): APP, NAVEGACAO, ConfiguracoesPage(), TemaContexto, TemaContextoValor, temaInicial(), TemaProvider(), temaSistema() (+2 more)

### Community 4 - "ImportacaoExportacaoPage.tsx"
Cohesion: 0.13
Nodes (19): extrairTituloPadrao(), htmlParaMarkdown(), markdownParaHtml(), textoSimples(), turndown, AlteracaoNota, Nota, NovaNota (+11 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (27): oxlint, devDependencies, oxlint, tailwindcss, @tailwindcss/typography, @tailwindcss/vite, @types/node, @types/react (+19 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly (+17 more)

### Community 7 - "errors/index.ts"
Cohesion: 0.14
Nodes (13): App(), router, AppError, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ERROR_CODES, ErrorCode (+5 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 9 - "layout/index.ts"
Cohesion: 0.29
Nodes (10): AppShell(), Header(), Logo(), MobileNav(), GrupoNavegacao, GRUPOS_NAVEGACAO, ItemNavegacao, NAVEGACAO_PRINCIPAL (+2 more)

### Community 10 - "idb.ts"
Cohesion: 0.20
Nodes (18): formatarEstimativa(), BANCO, StoreName, abrirBanco(), abrirBancoDeDados(), criarErro(), criarIndexSeNaoExistir(), gravarMeta() (+10 more)

### Community 11 - "GrafoNotaPage.tsx"
Cohesion: 0.43
Nodes (4): PagePlaceholder(), PagePlaceholderProps, GrafoNotaPage(), GrafoPage()

### Community 12 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 13 - "EditorPage.tsx"
Cohesion: 0.09
Nodes (27): LIMITES_ARQUIVO, PREFERENCIAS, formatarTamanho(), dataRelativa(), formatadorData, formatadorHora, formatarData(), formatarDataHora() (+19 more)

### Community 15 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **118 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ui/index.ts` to `domain/index.ts`, `TemaProvider.tsx`, `ImportacaoExportacaoPage.tsx`, `errors/index.ts`, `idb.ts`, `GrafoNotaPage.tsx`, `plugins`, `EditorPage.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `plugins` connect `plugins` to `ui/index.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `logger` connect `errors/index.ts` to `domain/index.ts`, `idb.ts`, `TemaProvider.tsx`, `EditorPage.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ui/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09472606246799795 - nodes in this community are weakly interconnected._
- **Should `domain/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11295681063122924 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._