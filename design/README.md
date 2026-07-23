# Design — source of truth

The Petabyte Portal UI is based on the prototype in this folder. **When the design
needs to change, edit it here first**, then port the change into the React code.

| File | What it is |
| --- | --- |
| `portal.original.html` | The exact file Winn designed (Claude Artifact bundle, 171 KB). Keep as-is. |
| `portal.html` | The unpacked, human-readable design — full markup, CSS, icon sprite, and the `<script type="text/x-dc">` state/logic. This is the readable reference for the **dashboard**. |
| `login.original.html` | Winn's latest login redesign (Claude Artifact bundle, 370 KB, 2026-07-22). Keep as-is. |
| `login.html` | The unpacked readable version of the login redesign. **Supersedes the login branch in `portal.html`.** Hero layout: typed headline, floating hi-res mark (`public/petabyte-mark-hd.png`), parallax + spotlight, magnetic Microsoft button. Its CSS/logic also sketches dashboard extras not yet ported: dark theme, ⌘K command palette, app status dots, drag-to-reorder favorites, card tilt. |

## How the design maps to the code

| Design (`portal.html`) | Code |
| --- | --- |
| `<style>` blocks (CSS vars, all classes) | `app/globals.css` (verbatim; `@font-face` dropped — handled by `next/font`) |
| `.markimg` base64 logo | `public/petabyte-mark.png` |
| `<svg><defs>` icon symbols (`#ic-*`) | `components/icons.tsx` (`IconSprite` + `Icon`) |
| `<sc-if value="isLogin">` branch | `components/LoginScreen.tsx` → `app/page.tsx` (`/`) |
| `<sc-if value="isDash">` branch | `components/PortalApp.tsx` → `app/dashboard/page.tsx` (`/dashboard`) |
| `apps`, `catMeta`, `catIcon` in the script | `components/portal-data.ts` |
| `state` + methods (search, fav, recent, toast, ⌘K) | state/handlers in `PortalApp.tsx` |

## Design tokens

- Font: **Hanken Grotesk** (400/500/600/700/800)
- Accent: `#2f80d8` · bg `#f4f6fa` · surface `#fff`
- Ink: `#0f1729` / `#5a6678` / `#94a0b3` · lines `#e6eaf1` / `#eef1f6`
- Category colors: eng `#4f46e5`, fin `#059669`, data `#2563eb`, ops `#ea580c`, ppl `#db2777`, sec `#dc2626`

## Wired since the prototype (kept here for history)

- **Auth** ✅ — the Microsoft button now calls NextAuth `signIn("microsoft-entra-id")`
  and the menu calls `signOut()`; the "C" domain guard lives in `access/policy.ts`.
- **App catalog** ✅ — apps come from Postgres (`prisma/schema.prisma`), managed in
  the owner-only Access Manager. `portal-data.ts` keeps only the category
  label/icon mapping. Per-app "A" access (Entra groups) is still pending.
- **Categories** — hidden in the UI for now (taxonomy undecided); the `category`
  column stays in the DB.

## Beyond the original prototype (built later, no design file — code is the source)

Dark mode, ⌘K command palette, notification bell + announcements, drag-to-reorder
favorites, card tilt, and the mobile drawer were added after `login.html`. When
changing these, edit the React/CSS directly; there is no separate prototype to sync.
