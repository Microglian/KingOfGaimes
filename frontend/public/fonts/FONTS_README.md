# Card Forge - Custom Fonts

Place custom font files here for accurate Yu-Gi-Oh card text rendering.

## Expected Font Files

| Filename | Used For | Fallback |
|----------|----------|----------|
| `CardName.ttf` | Card name text | Palatino Linotype, Palatino, Georgia, serif |
| `CardType.ttf` | Type line in brackets | Palatino Linotype, Palatino, Georgia, serif |
| `NormalText.ttf` | Normal monster flavor text (italic) | Palatino Linotype, Palatino, Georgia, serif |
| `EffectText.ttf` | Effect monster description text | Palatino Linotype, Palatino, Georgia, serif |

## Notes
- Fonts should be in `.ttf` or `.woff2` format.
- If fonts are not present, the app will use system serif fallback fonts.
- The ideal fonts for authentic card rendering are **Matrix Bold Small Caps** (for name/type) and **Matrix Book** (for text).
- `.woff2` format is preferred for smaller file sizes.
