# Repository Guidelines

## Project Structure & Module Organization

This repository contains ThothNet, a React 19 + Vite + TypeScript PWA for notes and visual knowledge management. First-party app code lives in `src/`. Route and app bootstrapping code is in `src/app`, shared shell UI in `src/layout`, reusable UI primitives in `src/components/ui`, domain entities in `src/domain`, persistence/auth/markdown/graph logic in `src/core`, synchronization logic in `src/sync`, and feature screens in `src/features/<feature>`. Static PWA assets are in `public/`. Operational scripts are in `scripts/`. The Cloudflare sync worker is isolated under `cloud/workers/thoth-sync`. Generated outputs such as `dist/`, `graphify-out/`, and `node_modules/` should not be edited directly.

## Build, Test, and Development Commands

Use `pnpm` with `pnpm-lock.yaml`.

- `pnpm dev`: start the Vite development server.
- `pnpm build`: run TypeScript project builds and create the production Vite bundle.
- `pnpm preview`: serve the production build locally.
- `pnpm lint`: run Oxlint on the app.
- `pnpm teste:e2e`: run the sync end-to-end script in `scripts/teste-sync-e2e.ts`.
- `pnpm teste:grafo`: run graph behavior checks.
- `pnpm teste:auth`: run authentication checks.
- `pnpm --dir cloud/workers/thoth-sync dev`: run the Cloudflare Worker locally.
- `pnpm --dir cloud/workers/thoth-sync typecheck`: type-check the worker.

## Coding Style & Naming Conventions

Write TypeScript and React components with ES modules. Use two-space indentation, `PascalCase` for components and pages, `camelCase` for functions/hooks, and Portuguese domain names when matching existing modules (`notas`, `cadernos`, `anexos`). Keep feature-specific hooks under `src/features/<feature>/hooks`; shared hooks belong in `src/hooks`. Prefer exported constants for limits/configuration in `src/config` instead of hardcoded values. Oxlint enforces React hooks rules and TypeScript/React checks.

## Testing Guidelines

There is no general unit-test runner configured. Add focused script-based tests under `scripts/` when covering core flows, and expose them through `package.json` using the existing `teste:<area>` naming pattern. Always run `pnpm lint` and `pnpm build` before submitting changes; run the relevant `pnpm teste:*` command for sync, graph, or auth changes.

## Commit & Pull Request Guidelines

This checkout has no readable git history, so no repository-specific commit convention can be inferred. Use short imperative commit messages, for example `Add note export validation`. Pull requests should describe the user-facing change, list commands run, mention data/storage or sync impacts, link related issues, and include screenshots for UI changes.

## Security & Configuration Tips

Do not commit secrets for the Cloudflare Worker, D1, R2, or bearer tokens. Keep environment-specific configuration out of source files and document required variables near the worker configuration when adding new integrations.
