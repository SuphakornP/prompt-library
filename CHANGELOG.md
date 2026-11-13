# Changelog

Notable application, catalog, configuration, and documentation changes are recorded here. Dates use Asia/Bangkok; the newest date appears first.

## 2026-11-13

### Added

- Implemented Fellow Skill Compass with a nine-question guided survey, ordered working preferences, answer review and single-answer editing, style/blended results, and explained skill recommendations so visitors can choose a practical starting point.
- Added six original v1.0.0 downloadable skills, each with focused instructions, a task-specific output template, and a complete worked example; included Codex/Claude setup guidance and sample tasks for other chat tools.
- Added deterministic skill ZIP generation, validation, and a SHA-256 download manifest, with automatic packaging before development, tests, and production builds.
- Added scoring, selection, metadata, and package regression tests, plus documented synthetic skill trials and a native Codex check that discovered all six skills and explicitly invoked Meeting Follow-through in a temporary project.
- Retained the Skill Compass product concept and documented the implemented behavior, distribution workflow, and verification limits. This branch has not been deployed to production.

### Changed

- Added Skill Compass navigation while preserving library filters, in-memory prompt drafts, related-prompt return paths, clipboard fallback, and the existing no-auto-send ChatGPT handoff.
- Kept survey answers and optional task text in memory only; refreshed tabs restart the survey, and downloads contain no user answers.

### Fixed

- Grouped ChatGPT and Codex as one OpenAI survey option and clarified their shared skill support, local ZIP installation, and ChatGPT plugin distinction in the results guide.
- Exposed first/second preference order to assistive technology and clarified selection replacement, because order affects style scoring.
- Stopped treating visual references alone as sufficient starting material for a presentation storyline; readiness now requires one of its text-based input categories.

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
