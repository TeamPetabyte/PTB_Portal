# Reference design systems

Curated from [nexu-io/open-design](https://github.com/nexu-io/open-design) (Apache-2.0).
These are **reference only** — `portal.html` in the parent folder stays the source of truth
for the Petabyte Portal. Consult these when extending the UI (new pages, components, tokens).

Each system folder contains:

| File | What it is |
| --- | --- |
| `DESIGN.md` | The 9-section design spec (voice, layout, type, color, motion, a11y) |
| `design-tokens.json` | Machine-readable tokens |
| `tokens.css` / `tailwind-v4.css` | CSS variables / Tailwind v4 theme — copy-pasteable |
| `components.html` | Rendered component gallery |

## Bundled systems

| Folder | Good for |
| --- | --- |
| `application` · `dashboard` | Internal app / dashboard shells — closest to the portal |
| `clean` · `corporate` · `default` | Neutral, professional baselines |
| `linear-app` · `vercel` · `notion` | Polished product-UI references (spacing, density, motion) |
| `cal` · `intercom` | SaaS patterns (scheduling, support widgets) |

Full catalog (152 systems, 159 skills) lives in the clone at `~/Desktop/open-design`.
