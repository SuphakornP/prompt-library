# Fellow Prompt

An English-language prompt library by Fellow Intelligence. Find a task, adapt its prompt, or use Skill Compass to discover and download a reusable AI skill.

**Live site:** [fellow-prompt.vercel.app](https://fellow-prompt.vercel.app/)

## Run locally

Requires Node.js 22.12 or newer; developed and verified with Node.js 24.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. Vite uses a strict port so it will report an error rather than silently opening another address if port 5173 is occupied.

```sh
npm run typecheck
npm test
npm run validate:catalog
npm run build:skills
npm run build
npm run preview
```

There is no sign-in, backend, database, or AI API key. The catalog ships with the application. Only the hosted brand fonts require a network connection during ordinary browsing; CSS font fallbacks keep the application usable if those fonts cannot load.

`dev`, `test`, and `build` regenerate the six skill ZIPs through their npm lifecycle hooks. Run `npm run build:skills` directly after editing skill source files when a development server is already running.

## Deploy on Vercel

The production project is `fellow-prompt`. Deployment is currently manual: request a production deployment through the Vercel plugin from `SuphakornP/prompt-library` at the desired `main` commit. GitHub login is connected, but the project has no automatic repository connection; pushing to GitHub alone does not update the live site.

Use the repository root, Node.js 24.x, and the `main` branch for production deployments. `vercel.json` sets the Vite framework, `npm ci` install command, `npm run build` build command, and `dist` output directory. No environment variables are required.

The SPA rewrite serves `index.html` for application routes, allowing direct visits and refreshes at `/prompts/:slug` and `/discover`; existing static assets are served normally. Only the built `dist` output is published. Keep the production domain publicly accessible, and verify the home page, a direct prompt link, the survey, and a skill download after deployment. A connected GitHub project can deploy future pushes to `main` automatically.

The Skill Compass implementation on `codex/skill-discovery-draft` has not been deployed to the live site.

## Using the library

- Search titles, summaries, departments, tags, and the full prompt text. Combine search with department and task filters.
- Results start alphabetically, with 24 cards per batch. Filter state is stored in the URL; Back restores the list position and loaded batch.
- Open a use case to review its prerequisites, expected output, and ordered prompt steps. Mobile puts prerequisites in an expandable section before the editor.
- Edit any step before using it. Edits are kept in memory while browsing this page; refreshing resets them. They are not saved to local storage or the library URL. Clicking Try in ChatGPT explicitly passes the current starter to ChatGPT in the destination URL.
- Follow-up prompts belong in the same AI conversation. Each step has its own Copy action and reset control.
- **Try in ChatGPT** opens a new tab with the complete edited starter already in the composer. Review it, attach required files, and press Send when ready. Both the editor and sidebar use the same current draft; neither requires clipboard access.
- The handoff uses `https://chatgpt.com/?q=...&disable_auto_send=true`, encoded with `URLSearchParams`. Current ChatGPT behavior was verified in a separate signed-out browser: the text is filled in and remains unsent. The explicit flag matters because `q` alone can submit automatically. Blank drafts have no active handoff; valid text is preserved without trimming or truncation. Files, chat history, and integrations are not transferred.
- Clipboard failure opens a dialog containing the full text for manual copying. A successful copy indicator is cleared when the prompt changes.

## Using Skill Compass

- Open **Find your skills** at `/discover`. Answer nine questions about your work, preferences, experience, tool, and starting material. The three style questions accept an ordered first and optional second choice.
- Review your answers and optionally write one task to remember. Edit one answer and use **Save & review** to return without repeating the remaining questions.
- Results show a primary style, a blend, or an unknown style when there is too little preference information. These describe answers from this session, not measured ability.
- Explore three ranked skills with reasons, specific inputs and outputs, or open the remaining three. All six include a ZIP download, installation guidance, and a sample task. Material readiness is a category check; review the specific inputs and your tool's installation support before use.
- Choose **ChatGPT / Codex** (OpenAI), Claude, or another tool for setup guidance. The OpenAI guide explains shared skill support and the verified local Codex installation route. These ZIPs are standalone skill folders, not ChatGPT plugins; copying a sample task into chat does not install a skill.
- Answers and the optional task stay in memory while navigating this tab. Refresh, a new tab, or **Start again** clears the survey. Answers are not stored in URLs, local storage, or downloaded packages and are not sent to an AI service.
- Related prompts keep their original prerequisites. Returning from a related prompt preserves the survey session; the existing prompt library, draft editing, and no-auto-send handoff remain available.

All six downloads are version `1.0.0`, with a focused `SKILL.md`, a task-specific output template, and a complete worked example. They use supplied text and return briefs, plans, or storyboards; they do not execute automations or generate presentation files themselves. See [the skill download guide](docs/skill-downloads.md) for sources, packaging, installation, and verification limits.

## Content snapshot

The November 12, 2026 snapshot reconciles **275 source entries**: 119 from [ChatGPT use cases](https://learn.chatgpt.com/use-cases) and 156 from [Claude Academy](https://academy.claude.com/use-cases). All source pages were accessible. They produce **274 library entries and 616 prompt steps**, with two equivalent brand-skill workflows combined into one.

Titles, summaries, and prompts are rewritten around the actual task, inputs, constraints, and deliverables. Product-specific capabilities remain explicit as prerequisites where required. Related tasks with different inputs or outputs remain separate; matching source slugs alone do not cause a merge.

Prompt entries come only from the curated catalog. Source references, retrieval dates, resource hashes, and editorial merge decisions are maintained outside the displayed interface:

| Location | Purpose |
| --- | --- |
| `src/data/catalog.json` | Catalog consumed by the app |
| `src/types.ts` | Catalog and ordered prompt-step interfaces |
| `content/raw/` | Retrieved source metadata, article context, and original prompt blocks |
| `content/editorial/` | Source-grounded English adaptations, mapped by source ID |
| `content/merges.json` | Reviewed semantic merges and their complete replacement entries |
| `content/provenance.json` | Every source mapped to an imported/merged entry or a documented unavailable reason |
| `content/provenance/` | Per-source discovery inventories and fetched-resource hashes |

The catalog's workflows have not been executed against AI services. Handoff checks use harmless synthetic text in a separate signed-out browser; they verify transfer into the composer, not every external workflow or AI-generated result.

## Refreshing the content

The importer requires `curl` and public internet access. It discovers current catalog pages and hashed metadata bundles, parses static literals with Acorn, and never executes downloaded JavaScript. Requests run with concurrency three and bounded retries.

```sh
# Rediscover the catalogs; reuse previously accessible article snapshots.
npm run import:sources

# Re-fetch source articles as well.
npm run import:sources -- --refresh

# Limit a refresh to one source.
npm run import:sources -- --source=claude --refresh
```

Review source changes and update the corresponding editorial records before rebuilding:

```sh
npm run build:catalog
npm run validate:catalog
npm test
npm run build
```

The full catalog builder rejects missing or unknown editorial source IDs, duplicate IDs/slugs, broken mappings, or invalid merges. A development-only `node scripts/build-catalog.mjs --partial` can preview completed editorial work; it does not overwrite the final provenance manifest. It is not the release workflow.

## Brand and implementation

React, TypeScript, Vite, and Lucide icons. Small CSS transitions respect `prefers-reduced-motion`. The visual system follows Fellow Signal's warm paper, deep green/charcoal header, fine borders, and restrained green actions.

Headings use `itc-avant-garde-gothic-pro`, body text uses `scandia-web`, and numeric accents use `nexa` through the same hosted Adobe kit as Fellow Signal. Jost, Hanken Grotesk, and Montserrat provide named fallbacks. The wordmark is outlined SVG and remains exact when web fonts are unavailable.

Reusable logos, monochrome artwork, the symbol, and favicon are in `public/brand/`. See `public/brand/README.md` for asset details and `docs/qa.md` for the verification record.

## Skill sources and product notes

- [Fellow Skill Compass concept and implementation](docs/skill-discovery-draft.md) preserves the product rationale, describes the implemented branch behavior, and records intentional differences from the early draft.
- Skill metadata lives in `src/data/skills.json`; authored instructions live in `content/skills/`. `npm run build:skills` validates and packages them into ignored `public/downloads/skills/` assets and updates the tracked `src/data/skill-downloads.json` manifest with file sizes and SHA-256 hashes.
- [The download guide](docs/skill-downloads.md) covers all six skills. Native Codex checks discovered all six in a temporary project and explicitly invoked Meeting Follow-through. Claude import and the other five native invocations remain untested. See [QA](docs/qa.md) for browser checks, behavioral trials, and remaining limits.
