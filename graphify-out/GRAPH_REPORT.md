# Graph Report - ThothNet  (2026-09-08)

## Corpus Check
- 126 files · ~23,290 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 617 nodes · 1509 edges · 23 communities (21 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67acc6a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- mudancas.ts
- dependencies
- src/index.ts
- render.tsx
- devDependencies
- compilerOptions
- errors/index.ts
- compilerOptions
- layout/index.ts
- lazy-paginas.tsx
- SyncPage.tsx
- plugins
- EditorPage.tsx
- thoth-sync/package.json
- React + TypeScript + Vite
- tsconfig.json
- compilerOptions
- markdown/index.ts
- cytoscape-cola.d.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 35 edges
2. `abrirBancoDeDados()` - 22 edges
3. `compilerOptions` - 19 edges
4. `PageHeader()` - 18 edges
5. `comTransacao()` - 17 edges
6. `Nota` - 17 edges
7. `useNotas()` - 17 edges
8. `notasStore` - 15 edges
9. `useTags()` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `principal()` --calls--> `fecharBancoDeDados()`  [EXTRACTED]
  scripts/teste-sync-e2e.ts → src/core/storage/idb.ts
- `principal()` --calls--> `salvarConfiguracaoSync()`  [EXTRACTED]
  scripts/teste-sync-e2e.ts → src/sync/config.ts
- `principal()` --calls--> `sincronizar()`  [EXTRACTED]
  scripts/teste-sync-e2e.ts → src/sync/transportar.ts
- `criarErro()` --calls--> `AppError`  [EXTRACTED]
  src/core/storage/idb.ts → src/core/errors/AppError.ts
- `erroSincronizacao()` --calls--> `AppError`  [EXTRACTED]
  src/sync/config.ts → src/core/errors/AppError.ts

## Import Cycles
- None detected.

## Communities (23 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (47): react, PagePlaceholderProps, Badge(), BadgeCor, BadgeProps, Cor, CORES, Button() (+39 more)

### Community 1 - "mudancas.ts"
Cohesion: 0.06
Nodes (77): construirAnexo(), urlsDeAnexos, comTransacao(), requisicaoParaPromessa(), AFiltroNota, buscarPorTermo(), normalizarTexto(), NovaNota (+69 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (37): cytoscape, cytoscape-cola, lucide-react, marked, dependencies, cytoscape, cytoscape-cola, lucide-react (+29 more)

### Community 3 - "src/index.ts"
Cohesion: 0.20
Nodes (19): compararRevisoes(), RegistroSync, Revisao, TAMANHO_LOTE, TipoRegistro, TIPOS_REGISTRO, autorizado(), CORS_CABECALHOS (+11 more)

### Community 4 - "render.tsx"
Cohesion: 0.07
Nodes (42): arvore, grafo, link, nos, notas, transformar, PADRAO_LINK_SOURCE, backlinksDe() (+34 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (33): fake-indexeddb, devDependencies, fake-indexeddb, oxlint, tailwindcss, @tailwindcss/typography, @tailwindcss/vite, tsx (+25 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+17 more)

### Community 7 - "errors/index.ts"
Cohesion: 0.14
Nodes (13): App(), router, AppError, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ERROR_CODES, ErrorCode (+5 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 9 - "layout/index.ts"
Cohesion: 0.14
Nodes (21): DiagramaMermaid(), renderizar(), DiagramaMermaidProps, gerarIdDiagrama(), AppShell(), Header(), Logo(), MobileNav() (+13 more)

### Community 10 - "lazy-paginas.tsx"
Cohesion: 0.11
Nodes (24): BuscaPage, CadernosPage, CentralAnexosPage, ConfiguracoesPage, DashboardPage, EditorPage, GrafoNotaPage, GrafoPage (+16 more)

### Community 11 - "SyncPage.tsx"
Cohesion: 0.13
Nodes (26): aguardarServidor(), ativarNovoDispositivo(), encerrarServidor(), iniciarServidor(), passo(), PASTA_WORKER, PERSISTENCIA, principal() (+18 more)

### Community 12 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 13 - "EditorPage.tsx"
Cohesion: 0.09
Nodes (28): LIMITES_ARQUIVO, PREFERENCIAS, formatarTamanho(), dataRelativa(), formatadorData, formatadorHora, formatarData(), formatarDataHora() (+20 more)

### Community 14 - "thoth-sync/package.json"
Cohesion: 0.11
Nodes (18): devDependencies, @cloudflare/workers-types, oxlint, typescript, wrangler, oxlint, typescript, name (+10 more)

### Community 15 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, erasableSyntaxOnly, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

### Community 20 - "markdown/index.ts"
Cohesion: 0.33
Nodes (8): extrairTituloPadrao(), htmlParaMarkdown(), markdownParaHtml(), textoSimples(), turndown, exportarParaTexto(), ImportacaoExportacaoPage(), tituloArquivo()

## Knowledge Gaps
- **181 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `render.tsx`, `errors/index.ts`, `layout/index.ts`, `lazy-paginas.tsx`, `SyncPage.tsx`, `plugins`, `EditorPage.tsx`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `Nota` connect `render.tsx` to `react`, `mudancas.ts`, `EditorPage.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `plugins` connect `plugins` to `react`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07557964468533575 - nodes in this community are weakly interconnected._
- **Should `mudancas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06263087759375595 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._