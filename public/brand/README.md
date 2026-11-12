# Fellow Prompt identity

The double-chevron mark expresses moving from an idea to a useful prompt. Its
rounded diagonal strokes reference the energy of the Fellow Signal mark while
remaining a distinct symbol. The tightly stacked wordmark uses outlined ITC
Avant Garde Gothic Pro Bold, so the logo renders consistently without fetching
fonts.

## Assets

- `fellow-prompt.svg`: green mark and ink lettering for light surfaces.
- `fellow-prompt-inverse.svg`: bright green mark and cream lettering for the dark header.
- `fellow-prompt-monochrome.svg`: one-color lockup; inherits `currentColor` when inline.
- `mark.svg`: standalone green symbol, with a 44 by 44 viewBox.
- `favicon.svg`: cream symbol on a green rounded square, with a 48 by 48 viewBox.

The full lockup has a 155 by 60 viewBox. Display at approximately 116 by 45 CSS
pixels in the header; preserve its aspect ratio. The standalone mark stays clear
at 24 to 44 CSS pixels. Keep at least one stroke width of clear space around it.

## Visual tokens

| Token | Value |
| --- | --- |
| Prompt green | `#299a70` |
| Green on dark | `#51c897` |
| Ink | `#1c1b17` |
| Warm cream | `#f8f6ef` |
| Page background | `hsl(45 31% 95%)` |
| Card surface | `hsl(50 50% 98%)` |
| Border | `hsl(42 25% 86%)` |
| Header surface | `#17150f` at 85% opacity |

Green follows the supplied Fellow Signal reference. The warm surfaces and type
families match the public Fellow Signal design tokens.

## UI typography

- Display: `"itc-avant-garde-gothic-pro", "Jost", sans-serif`.
- Body: `"scandia-web", "Hanken Grotesk", sans-serif`.
- Numerals and small labels: `"nexa", "Montserrat", sans-serif`.
- Brand font source: <https://use.typekit.net/rgw3tuo.css>.
- Reference application: <https://signal.fellowint.com/>.

Only the logo letter outlines are included here; font files are not bundled.
