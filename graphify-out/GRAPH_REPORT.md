# Graph Report - ThothNet  (2026-09-08)

## Corpus Check
- 130 files · ~26,392 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 659 nodes · 1606 edges · 22 communities (19 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `beea0069`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EditorPage.tsx
- mudancas.ts
- dependencies
- src/index.ts
- teste-grafo.ts
- devDependencies
- compilerOptions
- idb.ts
- compilerOptions
- layout/index.ts
- lazy-paginas.tsx
- PagePlaceholder.tsx
- plugins
- thoth-sync/package.json
- ThothNet
- tsconfig.json
- compilerOptions
- render.tsx
- cytoscape-cola.d.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 36 edges
2. `abrirBancoDeDados()` - 22 edges
3. `PageHeader()` - 19 edges
4. `compilerOptions` - 19 edges
5. `Nota` - 18 edges
6. `comTransacao()` - 17 edges
7. `useNotas()` - 17 edges
8. `notasStore` - 16 edges
9. `useTags()` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `principal()` --calls--> `sincronizar()`  [EXTRACTED]
  scripts/teste-sync-e2e.ts → src/sync/transportar.ts
- `principal()` --calls--> `fecharBancoDeDados()`  [EXTRACTED]
  scripts/teste-sync-e2e.ts → src/core/storage/idb.ts
- `principal()` --calls--> `salvarConfiguracaoSync()`  [EXTRACTED]
  scripts/teste-sync-e2e.ts → src/sync/config.ts
- `useEstadoSync()` --indirect_call--> `obterEstadoSincronizacao()`  [INFERRED]
  src/features/sync/hooks/useEstadoSync.ts → src/sync/transportar.ts
- `erroSincronizacao()` --calls--> `AppError`  [EXTRACTED]
  src/sync/config.ts → src/core/errors/AppError.ts

## Import Cycles
- None detected.

## Communities (22 total, 3 thin omitted)

### Community 0 - "EditorPage.tsx"
Cohesion: 0.05
Nodes (74): react, Badge(), BadgeCor, BadgeProps, Cor, CORES, Button(), ButtonProps (+66 more)

### Community 1 - "mudancas.ts"
Cohesion: 0.07
Nodes (70): anexosStore, construirAnexo(), urlsDeAnexos, comTransacao(), requisicaoParaPromessa(), AFiltroNota, buscarPorTermo(), normalizarTexto() (+62 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (37): cytoscape, cytoscape-cola, lucide-react, marked, dependencies, cytoscape, cytoscape-cola, lucide-react (+29 more)

### Community 3 - "src/index.ts"
Cohesion: 0.20
Nodes (19): compararRevisoes(), RegistroSync, Revisao, TAMANHO_LOTE, TipoRegistro, TIPOS_REGISTRO, autorizado(), CORS_CABECALHOS (+11 more)

### Community 4 - "teste-grafo.ts"
Cohesion: 0.05
Nodes (57): arvore, frequencias, grafo, link, nos, notas, relacaoDeTag, tags (+49 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (33): fake-indexeddb, devDependencies, fake-indexeddb, oxlint, tailwindcss, @tailwindcss/typography, @tailwindcss/vite, tsx (+25 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+17 more)

### Community 7 - "idb.ts"
Cohesion: 0.06
Nodes (45): aguardarServidor(), ativarNovoDispositivo(), encerrarServidor(), iniciarServidor(), passo(), PASTA_WORKER, PERSISTENCIA, principal() (+37 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 9 - "layout/index.ts"
Cohesion: 0.13
Nodes (22): DiagramaMermaid(), renderizar(), DiagramaMermaidProps, gerarIdDiagrama(), GrafoInterativo(), AppShell(), Header(), Logo() (+14 more)

### Community 10 - "lazy-paginas.tsx"
Cohesion: 0.10
Nodes (26): BuscaPage, CadernosPage, CentralAnexosPage, ConfiguracoesPage, DashboardPage, EditorPage, GrafoNotaPage, GrafoPage (+18 more)

### Community 12 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 14 - "thoth-sync/package.json"
Cohesion: 0.11
Nodes (18): devDependencies, @cloudflare/workers-types, oxlint, typescript, wrangler, oxlint, typescript, name (+10 more)

### Community 15 - "ThothNet"
Cohesion: 0.13
Nodes (14): Arquitetura, Ciclo de vida de uma nota, Deploy, Desenvolvimento, Estrutura, Fluxos, Funcionalidades, Privacidade (+6 more)

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, erasableSyntaxOnly, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch, noUnusedLocals (+10 more)

### Community 20 - "render.tsx"
Cohesion: 0.17
Nodes (17): useMapaDeLinks(), extrairTituloPadrao(), htmlParaMarkdown(), markdownParaHtml(), textoSimples(), turndown, BlocoPre(), extrairCodigoMermaid() (+9 more)

## Knowledge Gaps
- **198 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `EditorPage.tsx` to `mudancas.ts`, `teste-grafo.ts`, `idb.ts`, `layout/index.ts`, `lazy-paginas.tsx`, `PagePlaceholder.tsx`, `plugins`, `render.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `Nota` connect `teste-grafo.ts` to `EditorPage.tsx`, `mudancas.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `STATUS_NOTA` connect `EditorPage.tsx` to `mudancas.ts`, `teste-grafo.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EditorPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05157178038533971 - nodes in this community are weakly interconnected._
- **Should `mudancas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06977808281857699 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._