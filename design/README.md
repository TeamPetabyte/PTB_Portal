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

## Not yet wired (prototype simulates these)

- **Auth**: the "Continue with Microsoft Entra ID" button simulates sign-in then
  redirects to `/dashboard`. Replace with NextAuth `signIn("microsoft-entra-id")`
  (see TODO in `LoginScreen.tsx`) and `signOut()` (see TODO in `PortalApp.tsx`).
- **App catalog**: `portal-data.ts` is static seed data; production should come
  from an API filtered by the user's access (C+A).
