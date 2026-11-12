# Changelog

Notable application, catalog, configuration, and documentation changes are recorded here. Dates use Asia/Bangkok; the newest date appears first.

## 2026-11-12

### Added

- Published Fellow Prompt at [fellow-prompt.vercel.app](https://fellow-prompt.vercel.app/) through a manual Vercel production deployment from GitHub, with public access verified.
- Added Vercel build configuration and SPA routing so prompt detail links can open and refresh directly when hosted online.
- Added deployment instructions and excluded local `.vercel/` project metadata from Git.
- Added this changelog to keep repository changes and their purpose in one place.
- Added `AGENTS.md` with contributor guidance for project structure, development commands, coding style, testing, and pull requests.
- Built the initial Fellow Prompt application with 274 English use cases and 616 prompt steps, search, department/task filters, alphabetical results, and Load more.
- Added editable prompt workflows, per-step copying, reset controls, manual-copy fallback, and in-memory drafts retained during navigation.
- Added ChatGPT handoff links that preserve the edited starter and fill the composer without automatically submitting it.
- Added the Fellow-inspired responsive design, typography, SVG logos, keyboard support, and reduced-motion behavior.
- Added source import, editorial adaptation, catalog generation, and provenance validation for 275 source entries, including one merged source entry.
- Added Vitest coverage, local setup instructions, and browser verification notes.

### Changed

- Documented the production URL, manual deployment workflow, and live desktop/mobile verification results; GitHub pushes do not deploy automatically.
- Updated `AGENTS.md` to require a changelog entry before committing any changes and a documentation/checks review before pushing, so repository history stays current.
