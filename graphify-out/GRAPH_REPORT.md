# Graph Report - ThothNet  (2026-09-08)

## Corpus Check
- 115 files · ~20,158 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 528 nodes · 1302 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b0e8510`
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
- idb.ts
- compilerOptions
- layout/index.ts
- StatusPage.tsx
- GrafoNotaPage.tsx
- plugins
- render.tsx
- thoth-sync/package.json
- React + TypeScript + Vite
- tsconfig.json
- compilerOptions

## God Nodes (most connected - your core abstractions)
1. `react` - 28 edges
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
- `useEstadoSync()` --indirect_call--> `obterEstadoSincronizacao()`  [INFERRED]
  src/features/sync/hooks/useEstadoSync.ts → src/sync/transportar.ts
- `erroSincronizacao()` --calls--> `AppError`  [EXTRACTED]
  src/sync/config.ts → src/core/errors/AppError.ts
- `CentralAnexosPage()` --calls--> `formatarTamanho()`  [EXTRACTED]
  src/features/anexos/CentralAnexosPage.tsx → src/core/formato/arquivos.ts
- `MiniaturaAnexo` --calls--> `formatarTamanho()`  [EXTRACTED]
  src/features/anexos/components/MiniaturaAnexo.tsx → src/core/formato/arquivos.ts
- `EditorPage()` --calls--> `formatarTamanho()`  [EXTRACTED]
  src/features/notas/EditorPage.tsx → src/core/formato/arquivos.ts

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "EditorPage.tsx"
Cohesion: 0.07
Nodes (54): react, Badge(), BadgeCor, BadgeProps, Cor, CORES, Button(), ButtonProps (+46 more)

### Community 1 - "mudancas.ts"
Cohesion: 0.07
Nodes (71): anexosStore, construirAnexo(), urlsDeAnexos, comTransacao(), requisicaoParaPromessa(), cadernosStore, AFiltroNota, buscarPorTermo() (+63 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (29): lucide-react, marked, dependencies, lucide-react, marked, react, react-dom, react-markdown (+21 more)

### Community 3 - "src/index.ts"
Cohesion: 0.20
Nodes (19): compararRevisoes(), RegistroSync, Revisao, TAMANHO_LOTE, TipoRegistro, TIPOS_REGISTRO, autorizado(), CORS_CABECALHOS (+11 more)

### Community 4 - "ImportacaoExportacaoPage.tsx"
Cohesion: 0.13
Nodes (19): extrairTituloPadrao(), htmlParaMarkdown(), markdownParaHtml(), textoSimples(), turndown, AlteracaoNota, Nota, NovaNota (+11 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (27): devDependencies, oxlint, tailwindcss, @tailwindcss/typography, @tailwindcss/vite, @types/node, @types/react, @types/react-dom (+19 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+17 more)

### Community 7 - "idb.ts"
Cohesion: 0.09
Nodes (33): AppError, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, ERROR_CODES, ErrorCode, formatarErro(), getMensagemUsuario() (+25 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 9 - "layout/index.ts"
Cohesion: 0.13
Nodes (20): App(), router, AppShell(), Header(), Logo(), MobileNav(), GrupoNavegacao, GRUPOS_NAVEGACAO (+12 more)

### Community 10 - "StatusPage.tsx"
Cohesion: 0.13
Nodes (16): Card(), CardProps, APP, NAVEGACAO, formatarEstimativa(), formatarTamanho(), formatadorData, formatadorHora (+8 more)

### Community 11 - "GrafoNotaPage.tsx"
Cohesion: 0.43
Nodes (4): PagePlaceholder(), PagePlaceholderProps, GrafoNotaPage(), GrafoPage()

### Community 12 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 13 - "render.tsx"
Cohesion: 0.18
Nodes (13): ImagemMarkdown(), MarkdownPreview(), MarkdownPreviewProps, urlDeBlobAnexo(), Anexo, idDeUrlDeAnexo(), NovoAnexo, PREFIXO_ANEXO (+5 more)

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
- **156 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `EditorPage.tsx` to `ImportacaoExportacaoPage.tsx`, `idb.ts`, `layout/index.ts`, `StatusPage.tsx`, `GrafoNotaPage.tsx`, `plugins`, `render.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `plugins` connect `plugins` to `EditorPage.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `anexosStore` connect `mudancas.ts` to `EditorPage.tsx`, `render.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EditorPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06840539922214596 - nodes in this community are weakly interconnected._
- **Should `mudancas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06965871902758299 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._