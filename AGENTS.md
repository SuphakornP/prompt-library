# Repository Guidelines

## Project Structure & Module Organization

Fellow Prompt uses React + TypeScript/Vite, without a backend, authentication, or AI API.

- `src/App.tsx` implements library/detail views; `src/lib/library.ts` contains search, filter, draft, and handoff helpers.
- `src/types.ts` defines types; `src/styles.css` holds shared styles.
- `src/data/catalog.json` is generated from `content/editorial/` and `content/merges.json`. Source snapshots and provenance live under `content/`.
- `scripts/` contains import, catalog-build, and validation tools; `tests/` contains Vitest suites.
- `public/brand/` holds SVGs; `docs/qa.md` records browser verification; `CHANGELOG.md` tracks changes.

## Build, Test, and Development Commands

Use Node.js 22.12+ and npm.

- `npm ci`: install dependencies from the lockfile.
- `npm run dev`: start at `http://127.0.0.1:5173`; the port is strict.
- `npm run typecheck`: check TypeScript without emitting files.
- `npm test`: run Vitest once.
- `npm run validate:catalog`: check schema, identities, and source reconciliation.
- `npm run build`: type-check and produce `dist/`; `npm run preview` serves that build locally.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, single-quoted TypeScript strings, and ES modules. Use PascalCase for components/types, camelCase for functions/variables, and kebab-case for catalog slugs. Prefer explicit types and type-only imports. No formatter or linter is configured. Preserve Fellow styling and reduced-motion support.

## Testing Guidelines

Name tests `tests/*.test.ts`; use descriptive `describe`/`it` cases. No coverage threshold is configured. Cover changed filtering, prompt transfer, and catalog behavior. For code/catalog changes, run tests, validation, and the production build. For UI changes, verify desktop/mobile layout, keyboard navigation, editing/reset, clipboard failure, and Back navigation; record evidence in `docs/qa.md`.

## Catalog & Configuration Rules

Edit editorial records, then run `npm run build:catalog`; preserve prerequisites, steps, and provenance. Refresh sources intentionally with `npm run import:sources -- --refresh`; never execute downloaded JavaScript. Keep drafts in memory and preserve ChatGPT's no-auto-send handoff. Exclude secrets, `.env` files, builds, dependencies, and browser artifacts from commits.

## Commit & Pull Request Guidelines

Use concise imperative subjects, such as `Add repository contributor guidelines`. PRs should explain behavior, validation, and limitations; link relevant issues and include screenshots for visual changes.

## Changelog Before Commit & Push

Before every commit, update root `CHANGELOG.md`, including documentation, configuration, test, and catalog changes. Use newest-first `YYYY-MM-DD` headings (Asia/Bangkok), with relevant `Added`, `Changed`, `Fixed`, or `Removed` subsections. Describe what changed and why; reuse existing date headings and preserve history. Commit the changelog with the related changes. Before pushing, confirm outgoing changes are documented and applicable checks passed; report skipped checks honestly. Pushing alone needs no duplicate entry.
