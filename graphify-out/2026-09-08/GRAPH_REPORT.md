# Graph Report - ThothNet  (2026-09-08)

## Corpus Check
- 117 files · ~20,988 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 561 nodes · 1372 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67acc6a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EditorPage.tsx
- mudancas.ts
- dependencies
- src/index.ts
- ImportacaoExportacaoPage.tsx
- devDependencies
- compilerOptions
- errors/index.ts
- compilerOptions
- layout/index.ts
- lazy-paginas.tsx
- SyncPage.tsx
- plugins
- render.tsx
- thoth-sync/package.json
- React + TypeScript + Vite
- tsconfig.json
- compilerOptions

## God Nodes (most connected - your core abstractions)
1. `react` - 30 edges
2. `abrirBancoDeDados()` - 22 edges
3. `compilerOptions` - 19 edges
4. `PageHeader()` - 18 edges
5. `comTransacao()` - 17 edges
6. `useNotas()` - 17 edges
7. `useTags()` - 15 edges
8. `compilerOptions` - 15 edges
9. `compilerOptions` - 14 edges
10. `gravarSincronizacao()` - 13 edges

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

## Communities (20 total, 1 thin omitted)

### Community 0 - "EditorPage.tsx"
Cohesion: 0.07
Nodes (52): react, Badge(), BadgeCor, BadgeProps, Cor, CORES, Button(), ButtonProps (+44 more)

### Community 1 - "mudancas.ts"
Cohesion: 0.06
Nodes (79): anexosStore, construirAnexo(), urlsDeAnexos, comTransacao(), requisicaoParaPromessa(), cadernosStore, AFiltroNota, buscarPorTermo() (+71 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (30): lucide-react, marked, dependencies, lucide-react, marked, react, react-dom, react-markdown (+22 more)

### Community 3 - "src/index.ts"
Cohesion: 0.20
Nodes (19): compararRevisoes(), RegistroSync, Revisao, TAMANHO_LOTE, TipoRegistro, TIPOS_REGISTRO, autorizado(), CORS_CABECALHOS (+11 more)

### Community 4 - "ImportacaoExportacaoPage.tsx"
Cohesion: 0.14
Nodes (19): extrairTituloPadrao(), htmlParaMarkdown(), markdownParaHtml(), textoSimples(), turndown, AlteracaoNota, Nota, NovaNota (+11 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (31): fake-indexeddb, devDependencies, fake-indexeddb, oxlint, tailwindcss, @tailwindcss/typography, @tailwindcss/vite, tsx (+23 more)

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
Cohesion: 0.17
Nodes (17): AppShell(), Header(), Logo(), MobileNav(), GrupoNavegacao, GRUPOS_NAVEGACAO, ItemNavegacao, NAVEGACAO_PRINCIPAL (+9 more)

### Community 10 - "lazy-paginas.tsx"
Cohesion: 0.08
Nodes (29): BuscaPage, CadernosPage, CentralAnexosPage, ConfiguracoesPage, DashboardPage, EditorPage, GrafoNotaPage, GrafoPage (+21 more)

### Community 11 - "SyncPage.tsx"
Cohesion: 0.13
Nodes (26): aguardarServidor(), ativarNovoDispositivo(), encerrarServidor(), iniciarServidor(), passo(), PASTA_WORKER, PERSISTENCIA, principal() (+18 more)

### Community 12 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 13 - "render.tsx"
Cohesion: 0.12
Nodes (19): formatarEstimativa(), formatarTamanho(), formatadorData, formatadorHora, formatarData(), formatarDataHora(), ImagemMarkdown(), MarkdownPreview() (+11 more)

### Community 14 - "thoth-sync/package.json"
Cohesion: 0.11
Nodes (18): devDependencies, @cloudflare/workers-types, oxlint, typescript, wrangler, oxlint, typescript, name (+10 more)

### Community 15 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, erasableSyntaxOnly, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

## Knowledge Gaps
- **163 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+158 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `EditorPage.tsx` to `ImportacaoExportacaoPage.tsx`, `errors/index.ts`, `layout/index.ts`, `lazy-paginas.tsx`, `SyncPage.tsx`, `plugins`, `render.tsx`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `plugins` connect `plugins` to `EditorPage.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `anexosStore` connect `mudancas.ts` to `EditorPage.tsx`, `render.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _163 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EditorPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0702247191011236 - nodes in this community are weakly interconnected._
- **Should `mudancas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062359970126960415 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._