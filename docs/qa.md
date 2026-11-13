# Verification — November 12, 2026

## Scope

Initial local Chromium browser QA used Playwright CLI without authenticated external workflows. Initial handoff tests intercepted navigation. The later draft-prefill update additionally checks the real ChatGPT composer using harmless synthetic text in a separate signed-out browser. Production verification is recorded separately below.

## Verified behavior

- Initial 24-card page and 48-card state after Load more.
- Full-catalog text search combined with department and task filters.
- Genuine empty results, filter reset, and URL-addressable detail pages.
- Search/filter retention, browser Back, restored scroll position, and retained loaded count.
- Edited starter copied exactly; reset returns to the original prompt.
- Empty prompt disables both Copy and the ChatGPT handoff.
- Copy handles a 10,350-character prompt in full. Try in ChatGPT now transfers the edited starter in a URL independently of clipboard access.
- Denied clipboard permission shows a manual-copy dialog containing the entire prompt.
- Drafts survive navigation within the app and reset on refresh.
- Help dialog opens accessibly and closes with Escape.
- Responsive grids: three columns on desktop, two at 820 px, one at 390 px and 320 px, without horizontal page overflow.
- Mobile search and editors use 16 px input text to avoid focus zoom on iOS; no real iOS device was available.
- Reduced-motion preference disables card entrance animation.
- Avant Garde and Scandia were confirmed loaded in the browser. Logos use vector outlines.
- Blocking the Adobe stylesheet successfully loaded Jost, Hanken Grotesk, and Montserrat without breaking the layout.
- Follow-up Copy uses the selected step's text; editing during a delayed clipboard write does not show a stale success state.
- Production preview loaded all 274 entries, direct detail URLs, mobile prerequisite disclosure, and the missing-prompt view with no JavaScript runtime errors.

## Fixes identified during QA

- Invalidate a prior Copied status when text is edited or reset, including an edit made while an asynchronous clipboard write is pending.
- Disable card Copy when its in-memory primary draft is empty.
- Darken muted text and compact labels to meet normal-text contrast requirements.
- Put an expandable prerequisite section before the editor on mobile.
- Preserve ordinary modified-link behavior for Back to library.

## Content review

All 275 raw records include usable article context; nine source articles do not include an explicit starter prompt and were adapted from their actual workflow instructions. The importer records unavailable articles rather than inventing their content.

Each editorial slice was checked for source coverage, unique identity, required fields, appropriate task tags, and visible source-label leakage. Independent reviewers compared 20 complex entries with original source material, including native tools, security reviews, scientific analysis, contracts, financial models, and CRM actions. The review restored specific model-audit, approval, and original-file-preservation requirements.

The brand-skill merge preserves both original workflows: executable skill packaging, exact brand rules, artifact-specific application, sample validation, and later refreshes.

## Evidence

Browser screenshots are stored in the ignored `output/playwright/` directory. Unit tests are retained in `tests/`; source reconciliation is checked by `npm run validate:catalog`. The README lists the complete repeatable verification commands.

Final checks passed: TypeScript, production build, all 18 unit tests, and complete catalog reconciliation (274 entries, 616 prompt steps, 275 source records, one merged source, zero unavailable). The production build separates catalog data from application code and emits no oversized-chunk warning.

Final screenshots: `desktop-final.png`, `mobile-final.png`, `detail-desktop-final.png`, and `detail-mobile-final.png`. Captures finish entrance animations before saving so the evidence reflects the settled interface.

## ChatGPT draft-prefill update

- Replaced Copy & open with a native new-tab Try in ChatGPT link in both the editor and sidebar.
- `q` holds the complete edited starter and `disable_auto_send=true` prevents automatic submission in the current ChatGPT client. Using `q` alone was observed to auto-submit a harmless test message; this is why the explicit flag is required.
- Verified the actual signed-out ChatGPT composer preserves newlines, URL punctuation, Thai text, and emoji, with zero user messages submitted when the flag is present.
- Clicked the toolbar and sidebar links from the real local app. The edited starter and an 11,400-character draft arrived exactly in ChatGPT, stayed unsent, and required zero clipboard calls even with clipboard access denied.
- Reset updates both link destinations; blank drafts remove both destinations. The independent Copy action still opens the full manual-copy dialog when permission is denied.
- Unit coverage verifies exact encoding, the auto-send guard, whitespace-only drafts, and long text without truncation. Clipboard denial remains relevant only to Copy.
- The current behavior was cross-checked against the public ChatGPT client bundle at `https://chatgpt.com/cdn/assets/7078.5cd07a5c9b.js`; its auto-send branch explicitly checks for the absence of `disable_auto_send`. This is observed web-client behavior, not a promised public API contract.

## Vercel production deployment

- Production: https://fellow-prompt.vercel.app/; Vite build with Node.js 24.x, `npm ci`, and `dist` output.
- Before deployment, all 18 tests, catalog validation, TypeScript, and the production build passed.
- Anonymous HTTP requests and an isolated signed-out browser opened the home page and `/prompts/build-an-ai-tour-guide` successfully; refreshing the detail route retained the correct page.
- Search combined with Engineering and Coding filters survived a full reload. Load more increased the visible cards from 24 to 48.
- Edited text matched both ChatGPT link destinations exactly, including URL punctuation and the no-auto-send flag. Reset restored the source prompt. This deployment check inspected links without submitting anything to ChatGPT.
- Desktop at 1440 px and mobile at 390 px rendered without horizontal overflow. Scandia, Avant Garde, and Nexa faces used by the interface loaded; browser error logs were empty.
- JavaScript, CSS, and SVG assets returned their expected MIME types. `/content/raw/claude.json` returned the SPA HTML fallback, not the raw source data.
- Existing Vercel deployment protection was retained; the production domain is public without a bypass link. Deployments remain manual at the user's request, with no automatic GitHub repository connection.
- Screenshots: `output/playwright/vercel-desktop.png`, `vercel-mobile-home.png`, and `vercel-mobile-detail.png` (ignored local evidence).

## Skill Compass — November 13, 2026

Branch: `codex/skill-discovery-draft`. Local development and production-preview verification only; this feature has not been deployed to the public site.

### Interface and behavior

The feature retains Fellow's warm paper, green actions, established typefaces, and restrained editorial layout. The landing page introduces the survey and download, the interview focuses on one question, and the results put usable skills before installation detail. Question entrances and progress transitions respect reduced motion.

- Completed all nine questions, reviewed answers, entered an optional Thai/English task reminder, and received three distinct recommendations. An Organizer/Analyst preference mix with a communication goal recommended Meeting Follow-through first.
- Required answers prevent continuing. Unknown/none choices exclude concrete choices. First/second style choices have accessible rank text and a live ordered summary; selecting a third replaces the second while preserving the first.
- Browser Back/Forward preserves answers. Editing one answer returns directly to review; changing the goal updates recommendations without changing the working-style result or losing the task reminder.
- Start again clears answers and the reminder; revisiting an old result through browser history shows the fresh-session recovery view. Refreshing results and directly opening an incomplete interview route recover without invented answers.
- All-unknown preferences produce an unnamed profile. No prepared material produces preparation guidance rather than a ready-to-start claim. Images alone are insufficient for the text-based skills.
- Related prompts return to the skill results within the same session. Library filters, loaded batches, and prompt editing/reset remain intact. ChatGPT links preserve edited text and `disable_auto_send=true`.
- Sample-task copying preserves the complete text. Simulated clipboard denial shows the full manual-copy dialog; Escape closes it. A subsequent successful clipboard write preserves the sample.
- Keyboard Tab/Space can select answers. Native form controls, focus on new question headings, input labels, and details/summary guides were checked. This was not a dedicated screen-reader audit.
- Desktop at 1440 px, tablet at 820 px, and mobile at 390/320 px have no horizontal page overflow. Final screenshots were taken after fonts and entrance animations settled. Reduced-motion emulation removes question animations.
- Answers and the optional reminder stay in React memory. Browser storage remained empty; reminder text was absent from the URL and skill ZIPs. Survey processing makes no AI API request.
- No browser application errors were observed. Development console output contained only React DevTools notices.

### Downloads and package quality

All six v1.0.0 download links were clicked in the browser, both during development and from the built production preview. Every production URL returned HTTP 200 with `application/zip`. The downloaded bytes match the manifest SHA-256 values; independent Python ZIP checks verified CRCs and the exact three source files under each skill root.

Each package contains `SKILL.md`, `references/output-template.md`, and `references/example.md`. The templates are specific to evidence synthesis, constrained decisions, presentation storylines, meeting follow-through, workflow improvement, or reusable-workflow design. They define inputs, evidence handling, output requirements, and complete fictional worked examples. They do not include survey answers, API credentials, scripts, or connector dependencies.

The build validates names, versions, frontmatter, references, file allowlists, and archive paths before emitting assets. Fixture tests cover corrupt/missing sources, symlinks, traversal, deterministic ZIP bytes across timestamps/timezones, and preserving unrelated downloads. `predev`, `pretest`, and `prebuild` regenerate packages from the checked-in sources.

### Skill behavior and native loading

A separate agent that did not author the skill content applied all six instructions to new synthetic tasks. The trials covered contradictory research counts, failed decision constraints, unsupported presentation ROI, proposed versus agreed meeting actions, overlapping process-error counts, and an unproven workflow with conflicting records. Full tasks and outputs are in ignored `output/playwright/skill-quality/`.

Two minor issues prompted focused refinements: the research output inferred an unspecified collection method, and the workflow output placed a clarification activity with unknown timing into a numbered sequence. Both instructions/templates were clarified. Targeted retests preserve the unknown method and put the uncertain activity in an unnumbered section. These are single, self-reviewed instruction-guided trials and two non-blinded retests, not a reliability measurement.

For native verification, all six ZIPs were extracted into an isolated temporary project's `.agents/skills/`. An ephemeral, read-only Codex run discovered all six IDs and explicitly invoked Meeting Follow-through. Its three file reads succeeded, and the Thai output preserved the unapproved launch proposal, confirmed checklist owner/deadline, internal-pilot restriction, unknown FAQ assignment, and unsent follow-up. No user-installed skill files were changed. Evidence is copied to ignored `output/playwright/native-skill-check/`.

Native limits: this checks six metadata discoveries and one explicit invocation in the current Codex environment. Automatic triggering, native invocation of the other five skills, and Claude upload/invocation were not tested. The UI provides platform-specific guidance without claiming universal account compatibility.

### Checks and evidence

- Passed: 51 Vitest tests, catalog reconciliation (274 entries / 275 source records), TypeScript, production build, all six `skill-creator` structural checks, and independent ZIP/hash verification.
- The built application completed the survey and served all six downloads at local port 4174. A direct related-prompt URL survived refresh and returned to a fresh discovery session correctly.
- Final screenshots: `output/playwright/skill-compass-desktop-final.png`, `skill-compass-mobile-final.png`, `skill-survey-mobile-final.png`, `skill-results-desktop-final.png`, `skill-results-mobile-final.png`, and `skill-results-320-final.png`.
- Production download evidence: `output/playwright/production-fellow-*-1.0.0.zip`. Earlier development captures/downloads are retained separately and may predate the final template refinements.

### OpenAI option clarification

After browser feedback, question 8 groups ChatGPT and Codex into one OpenAI option. The existing `chatgpt` answer value is retained, so a currently selected ChatGPT answer remains valid. The result guide distinguishes shared skill support, local Codex installation, and ChatGPT plugin distribution using [OpenAI's skill documentation](https://learn.chatgpt.com/docs/build-skills). It does not claim a ZIP attachment installs a skill or a plugin.

- Re-ran all 51 tests, catalog validation, and the production build successfully.
- Completed the production-preview survey with keyboard selection of the combined option, verified its review label and OpenAI guidance, and switched to Claude and back without changing the leading recommendation.
- Checked the revised survey at 963 px and 390 px, plus results at 320 px, with no horizontal overflow. Visually inspected `output/playwright/skill-openai-option-desktop.png` and `skill-openai-option-mobile.png`.
- This verifies the revised interface; native installation coverage remains as documented above. ChatGPT desktop import was not tested.
