# Local verification — November 12, 2026

## Scope

Local Chromium browser QA via Playwright CLI; no authenticated external workflows or public deployment. Initial handoff tests intercepted navigation. The later draft-prefill update additionally checks the real ChatGPT composer using harmless synthetic text in a separate signed-out browser.

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
