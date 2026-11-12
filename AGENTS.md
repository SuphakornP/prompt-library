# Repository Guidelines

## Project Structure & Module Organization

Fellow Prompt is an English-language React + TypeScript application built with Vite. It has no backend, authentication, or AI API integration.

- `src/App.tsx` implements the library and detail views; `src/lib/library.ts` contains search, filter, draft, and handoff helpers.
- `src/types.ts` defines catalog types; `src/styles.css` holds the shared visual system.
- `src/data/catalog.json` is generated from `content/editorial/` and `content/merges.json`. Source snapshots and provenance live under `content/`.
- `scripts/` contains import, catalog-build, and validation tools; `tests/` contains Vitest suites.
- `public/brand/` holds SVG assets; `docs/qa.md` records browser verification.

## Build, Test, and Development Commands

Use Node.js 22.12+ and npm.

- `npm ci`: install dependencies from the lockfile.
- `npm run dev`: start at `http://127.0.0.1:5173`; the port is strict.
- `npm run typecheck`: check TypeScript without emitting files.
- `npm test`: run Vitest once.
- `npm run validate:catalog`: check schema, identities, and source reconciliation.
- `npm run build`: type-check and produce `dist/`; `npm run preview` serves that build locally.

## Coding Style & Naming Conventions

Match existing two-space indentation, semicolons, single-quoted TypeScript strings, and ES modules. Use PascalCase for React components and types, camelCase for functions and variables, and kebab-case for catalog slugs. Prefer explicit types and type-only imports. No formatter or linter is configured; avoid unrelated formatting changes. Preserve the existing Fellow visual system and reduced-motion support.

## Testing Guidelines

Name tests `tests/*.test.ts` and use descriptive `describe`/`it` cases. No numeric coverage threshold is configured. Cover changed behavior, especially combined filtering, exact prompt transfer, and catalog reconciliation. For code or catalog changes, run tests, validation, and the production build. For UI changes, verify desktop/mobile layout, keyboard navigation, editing/reset, clipboard failure, and Back navigation; record relevant evidence in `docs/qa.md`.

## Catalog & Configuration Rules

Edit editorial records before running `npm run build:catalog`; preserve prerequisites, ordered steps, and provenance. Use `npm run import:sources -- --refresh` for intentional source refreshes. Never execute downloaded source JavaScript. Keep drafts in memory and preserve the ChatGPT handoff's no-auto-send behavior. Do not commit secrets, `.env` files, build outputs, dependencies, or browser artifacts.

## Commit & Pull Request Guidelines

History currently contains one imperative commit beginning “Build Fellow Prompt”; follow concise, action-oriented subjects. PRs should explain the problem, resulting behavior, validation, and limitations. Link relevant issues and include desktop/mobile screenshots for visual changes.
