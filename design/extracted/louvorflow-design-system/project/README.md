# LouvorFlow — Design System

**LouvorFlow** is a multi-tenant platform for managing a church's worship ministry: songs, scheduling (_escalas_), members, and events. Users are worship leaders, musicians and church administrators — usually on mobile, often between rehearsals.

Source of truth for the current system: the codebase at **[`j0ruge/LouvorFlow`](https://github.com/j0ruge/LouvorFlow)** on branch `master`.

Key reference files in the repo:

- `packages/frontend/.interface-design/system.md` — existing design-system spec (primary source)
- `packages/frontend/src/index.css` — CSS variables for light / dark / classic themes
- `packages/frontend/tailwind.config.ts` — Tailwind token mapping
- `packages/frontend/src/components/ui/` — shadcn/ui primitives (44 components)
- `packages/frontend/src/components/AppSidebar.tsx`, `AppLayout.tsx` — shell
- `packages/frontend/src/pages/{Dashboard,Songs,Scales,Login}.tsx` — core screens

> Nothing in this folder fetches from the repo directly. All tokens, colors and page recreations live here.

---

## Index

| File / Folder | What's inside |
|---|---|
| `colors_and_type.css` | CSS variables for color, gradients, shadows, radius, spacing, type |
| `preview/` | Per-concept cards rendered in the Design System tab |
| `ui_kits/louvorflow/` | High-fidelity recreation of the app shell + core pages |
| `assets/` | Logos, brand lockups, placeholder imagery |
| `SKILL.md` | Agent-Skill–compatible entry point |

---

## Products

LouvorFlow is currently a single product: a **web app** (`packages/frontend`, Vite + React 18) backed by a Node/Express + Prisma API (`packages/backend`). There is **no public marketing site or mobile native app** in the repo, so the UI kit covers only the authenticated web app.

Three core flows drive the UI:

1. **Músicas** — repertório cataloging (tonalidade, BPM, versions, artistas, categorias)
2. **Escalas** — event scheduling (_próximas_ vs _passadas_, integrantes por função, músicas ordenadas)
3. **Integrantes** — members, roles (RBAC), funções (instrument/role), invites

Cross-cutting: multi-tenant (church selection on login), dark/light mode, two color themes (**Âmbar** default, **Clássico**).

---

## Content Fundamentals

**Language:** Brazilian Portuguese. All UI copy, error messages and docs are PT-BR.

**Tone:** warm, respectful, quietly professional — "_um hinário bem organizado_". Never playful, never corporate, never liturgical-ornate. Think _sacristia arrumada_: clean, present, unobtrusive.

**Casing:** Title Case in PT-BR conventions for page titles and primary actions ("Nova Música", "Próximas Escalas"). Sentence case for helper / descriptive copy.

**Pronoun / address:** Implicit **você** (informal 2p singular) — never _tu_, never _o usuário_. Copy speaks directly: "Entre com suas credenciais", "Gerencie o repertório do ministério".

**Verbs on buttons:** short imperatives — _Entrar_, _Salvar_, _Excluir_, _Nova Música_, _Editar_, _Recuperar_, _Descartar_. Destructive actions confirm with "Sim, excluir" + "Cancelar".

**Empty / error states:** describe _what_ is missing and propose _what to do_.
- Empty: "Nenhuma música cadastrada" + "Comece adicionando músicas ao catálogo do ministério." + CTA.
- Error: "Erro ao carregar músicas." + "Tentar novamente" button.
- Zero-search: "Nenhum resultado encontrado" + `Nenhuma música encontrada para "{term}".`

**Emoji:** **never** in product UI. No emoji cards, no emoji in empty states. Lucide icons carry all iconography.

**Examples that capture the voice:**

> "Visão geral do ministério de louvor"
> "Gerencie o repertório do ministério"
> "Os vínculos com músicas e integrantes desta escala serão removidos. Deseja continuar?"
> "Entre com suas credenciais para acessar o sistema"

---

## Visual Foundations

### Color vibe

A **warm, monochromatic amber family (30°–40° H)** for neutrals and brand, with a **burgundy/wine accent (350°)** for emphasis. Light mode is _linen cream_ canvas (`38 40% 96%`) — never pure white. Dark mode deepens to _warm charcoal_ (`30 12% 12%`) — like a dimmed sanctuary. The hue family stays constant between modes; only lightness/saturation shift.

Semantic colors (destructive red) are kept identical across modes.

A secondary "**Clássico**" theme exists (violet light / forest-green dark) but **Âmbar is canonical** — document everything against Âmbar first.

### Backgrounds

- Page canvas uses `--gradient-subtle` (very gentle vertical cream shift) — **not** a flat fill.
- Cards use `--gradient-card` (135° diagonal, near-imperceptible).
- No full-bleed photography. No repeating patterns. No hand-drawn illustrations.
- Auth screens: full-viewport `bg-gradient-subtle` with a single centered card.

### Type

**Brand typography — a single modern family:**

- **[Sora](https://fonts.google.com/specimen/Sora)** (display + body / UI) — geometric-humanist sans-serif with a contemporary, young voice. One family covers everything: wordmark, headings, tables, navigation. Loaded at 400/500/600/700/800 via Google Fonts.

Sora is an open-source Google Font. Page titles (`h1`) use **Sora 700** through `bg-gradient-primary bg-clip-text text-transparent` — amber-to-wine on a geometric face is the signature treatment of the system. Body, nav, tables and dense UI stay in Sora 400/500/600 so data remains legible and calm.

### Spacing & layout

4-px base grid (Tailwind). Layout padding is `p-4` on mobile, `p-6` on `sm+`. Sidebar `16rem` / `3rem` collapsed / `18rem` mobile overlay. Header is sticky `h-16` with `backdrop-blur`.

**Elegância (from the repo's own system doc) is the top priority:** prefer overlays (Drawer / Popover / Dialog) to layout shifts; never push content down to reveal something temporary; generous padding over density.

### Corner radii

`--radius` = **12px** (base). `lg`=12, `md`=10, `sm`=8, `full`=9999. Cards + dialogs `lg`. Inputs/buttons `md`. Badges `sm` or pill (`full`).

### Borders

Low-opacity borders (`hsl(var(--border))` = warm light gray) carry most of the separation work. Dark mode leans on borders even more (shadows reduce).

### Shadows (warm-tinted)

Three tiers, all **brown-tinted** in light mode, **black** in dark:

- `shadow-soft`: `0 2px 15px -3px hsl(30 40% 30% / 0.08)` — resting cards
- `shadow-medium`: `0 4px 25px -5px hsl(30 40% 30% / 0.12)` — hover on dashboard tiles, dialogs
- `shadow-glow`: `0 0 30px hsl(38 90% 60% / 0.2)` — amber glow on emphasis / hover on stat cards

### Animation

Short and utilitarian — the app is not a motion product.

- Accordion expand/collapse: **200ms ease-out**
- Dialog open/close: **200ms** fade + zoom 95% + slide from center
- Hover transitions (color): **150ms** default (`transition-colors`)
- `transition-all duration-300` on card hover to combine shadow + background shifts
- Loading: `animate-pulse` for skeletons

No bounces, no spring physics, no parallax. Easing is always soft-out.

### Hover / press / focus states

- **Hover (primary button):** `bg-primary/90` (90% opacity on primary).
- **Hover (gradient button):** `hover:opacity-90`.
- **Hover (card):** `hover:shadow-medium` or `hover:shadow-glow` + subtle background shift.
- **Hover (sidebar item):** `bg-sidebar-accent`.
- **Hover (table row):** `hover:bg-muted/50`.
- **Active (sidebar item):** `bg-sidebar-accent font-medium`.
- **Press:** no scale. Opacity/bg change only.
- **Focus:** `outline-2 outline-ring` (amber).
- **Disabled:** `opacity-50 pointer-events-none`.

### Transparency & blur

Used in one place: the header (`bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`). Everywhere else surfaces are opaque. Badges use `bg-primary/10 text-primary` (10% tint) as a soft-chip pattern — the closest thing to an inline accent.

### Cards

`bg-card` · `border border-border` · `rounded-lg` (12px) · `shadow-soft` at rest · often `border-0 shadow-soft` when the shadow alone suffices. Card header `p-6`, content `p-6 pt-0`. List-item cards inside cards use `bg-gradient-card` + `border border-border` at `p-4`.

### Imagery

Imagery is **incidental** — no hero photos, no illustrations. The only image-like content is avatar fallbacks (initials on `bg-gradient-primary`) and icons.

---

## Iconography

**System:** [Lucide React](https://lucide.dev) v0.462.0 — `import { Music, Calendar, … } from "lucide-react"`.

**Style:** single-weight outlined strokes, rounded joins, no fills. Lucide _only_ — no mixing with Heroicons, FontAwesome, etc.

**Sizing (Tailwind):**

| Context | Classes | px |
|---|---|---|
| Large (empty states) | `h-12 w-12` | 48 |
| Header / logo mark | `h-6 w-6` / `h-8 w-8` | 24–32 |
| Sidebar items | `h-5 w-5` | 20 |
| Inline in button / table / metadata | `h-4 w-4` | 16 |

**Color:**

- Default: inherits `currentColor` (`text-foreground` / `text-muted-foreground`).
- Accent: `text-primary` for active / branded contexts.
- Destructive: `text-destructive` on error states.
- Inverse: `text-white` inside `bg-gradient-primary` tiles (e.g. avatar initials, list-item icon squares).

**Semantic choices documented in the repo's system.md:**

- `CornerDownLeft` (↵) for "confirmar seleção" — **never** `Plus` (+).
- `Music` is the brand glyph; used as the logo mark, list-item tile icons, and page icon for Músicas.
- `Calendar` for Escalas, `Users` for Integrantes, `BarChart3` for Relatórios, `History` for Histórico, `Settings` for Configurações, `Shield`/`Key`/`UserCog` for admin, `Building2` for Igrejas (super-admin).
- Status: `AlertCircle` (error), inbox-style (empty), `Loader2` + `animate-spin` (loading inline).

**Emoji:** never. **Unicode as icons:** never (except ↵ rendered through a Lucide icon).

**Logo / wordmark:** there is **no bespoke logotype** in the repo. The brand is `Music` icon + the word "LouvorFlow" in `text-lg font-bold tracking-tight`. We recreate this as the canonical lockup in `assets/`.

**Substitution flag:** we use Lucide via CDN in previews; this is the same library the app uses, so it is a 1:1 match, not a substitution. The Lucide font/sprite files are not copied — they are pulled from `https://unpkg.com/lucide@latest`.

**Font substitution flag:** the live app currently runs on the **system font stack**; this design system proposes **Sora** as the brand typography going forward. All previews render with Sora; if the user declines, fall back to the system stack — token names and scale are identical.

---

## How to use

- `colors_and_type.css` — drop into any HTML/React surface to pick up tokens. Toggle `.dark` on `<html>` for dark mode.
- `ui_kits/louvorflow/` — start here for product recreations. `index.html` is a live, clickable shell of the app.
- `preview/` — atomic cards consumed by the Design System tab; not meant to be imported directly into product work.
- `SKILL.md` — entry point for the Agent Skill packaging; delegates to this README.

---

## Caveats

- **Brand typography** is a single family: **Sora** (display + body), open-source Google Font. The live app ships with a system-font stack — this is a forward recommendation. If adopted, update `packages/frontend/index.html` with the Google Fonts `<link>` and extend `tailwind.config.ts` with `fontFamily.sans: ['Sora', ...]` and `fontFamily.display: ['Sora', ...]`.
- **No bespoke logo.** The `Music` icon + wordmark is the lockup. If a real logomark exists elsewhere, please attach it.
- **No marketing surfaces.** Only the authenticated app is represented.
