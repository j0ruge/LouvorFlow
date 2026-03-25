# LouvorFlow — Design System

## Direction & Feel

**Product:** Church worship team scheduling app (escalas de louvor).
**Users:** Worship leaders, musicians, church administrators — often on mobile, managing schedules between rehearsals.
**Feel:** Warm but professional. Spiritual without being ornate. Like a well-organized hymnal — structured but inviting.

**Light mode:** Amber/gold palette evoking candlelight, warm wood, linen hymnals. Canvas in cream — never pure white. Surfaces warm and quiet.
**Dark mode:** Deep sanctuary — warm dark browns with soft gold accents. Like a dimmed church interior before worship starts.

## Color Tokens (HSL)

### Light Mode

| Token | HSL | Role |
|---|---|---|
| `--background` | `38 40% 96%` | Page canvas — linen cream |
| `--foreground` | `30 15% 18%` | Primary text — warm charcoal |
| `--card` | `38 30% 99%` | Card surfaces — warm white |
| `--card-foreground` | `30 15% 18%` | Card text |
| `--popover` | `38 30% 99%` | Overlays |
| `--primary` | `38 80% 52%` | Brand — amber gold |
| `--primary-light` | `40 75% 62%` | Lighter amber |
| `--primary-glow` | `38 90% 60%` | Glow amber |
| `--secondary` | `30 35% 45%` | Secondary — warm brown |
| `--accent` | `350 45% 42%` | Accent — deep wine/burgundy |
| `--muted` | `35 20% 93%` | Muted surfaces — warm light gray |
| `--muted-foreground` | `30 12% 45%` | Secondary text — warm medium gray |
| `--destructive` | `0 84% 60%` | Error/danger — red |
| `--border` | `35 18% 87%` | Borders — warm |
| `--input` | `35 18% 87%` | Input borders |
| `--ring` | `38 80% 52%` | Focus rings — matches primary |

### Dark Mode

| Token | HSL | Role |
|---|---|---|
| `--background` | `30 12% 12%` | Page canvas — deep sanctuary |
| `--foreground` | `35 20% 88%` | Primary text — warm parchment |
| `--card` | `30 10% 15%` | Card surfaces — +3% lightness |
| `--primary` | `40 65% 55%` | Brand — soft gold |
| `--primary-light` | `42 60% 65%` | Lighter gold |
| `--primary-glow` | `40 70% 50%` | Glow gold |
| `--secondary` | `35 30% 30%` | Secondary — dark warm brown |
| `--accent` | `350 35% 50%` | Accent — muted wine |
| `--muted` | `30 8% 20%` | Muted surfaces |
| `--muted-foreground` | `30 10% 55%` | Secondary text |
| `--destructive` | `0 84% 60%` | Error/danger — same red |
| `--border` | `30 8% 22%` | Borders |
| `--ring` | `40 65% 55%` | Focus rings |

### Sidebar Colors

Sidebar silencioso — same background as canvas, separated by border only.

| Token | Light | Dark |
|---|---|---|
| `--sidebar-background` | `38 40% 96%` (same as canvas) | `30 12% 12%` (same as canvas) |
| `--sidebar-foreground` | `30 15% 18%` | `35 20% 88%` |
| `--sidebar-primary` | `38 80% 52%` (amber active) | `40 65% 55%` (gold active) |
| `--sidebar-accent` | `35 25% 91%` (subtle hover) | `30 8% 18%` |
| `--sidebar-border` | `35 18% 87%` (same as border) | `30 8% 22%` |

### Gradients

| Name | Light | Dark |
|---|---|---|
| `gradient-primary` | `135deg, hsl(38 80% 52%) → hsl(350 45% 42%)` (amber → wine) | `135deg, hsl(40 65% 55%) → hsl(350 35% 50%)` |
| `gradient-subtle` | `180deg, hsl(38 40% 96%) → hsl(35 35% 94%)` (cream shift) | `180deg, hsl(30 12% 12%) → hsl(30 10% 14%)` |
| `gradient-card` | `135deg, hsl(38 30% 99%) → hsl(35 25% 97%)` (warm card) | `135deg, hsl(30 10% 15%) → hsl(30 8% 17%)` |

### Shadows

Warm-tinted in light mode (brown shadows, not blue). Dark shadows in dark mode.

| Name | Light | Dark |
|---|---|---|
| `shadow-soft` | `0 2px 15px -3px hsl(30 40% 30% / 0.08)` | `0 2px 15px -3px hsl(0 0% 0% / 0.3)` |
| `shadow-medium` | `0 4px 25px -5px hsl(30 40% 30% / 0.12)` | `0 4px 25px -5px hsl(0 0% 0% / 0.4)` |
| `shadow-glow` | `0 0 30px hsl(38 90% 60% / 0.2)` | `0 0 30px hsl(40 70% 50% / 0.15)` |

## Depth Strategy

**Mixed: borders + colored shadows.** Primary separation via low-opacity borders (`border-border`). Cards use `shadow-sm` for subtle lift. Overlays use `shadow-lg`. Glow shadows (`shadow-glow`) reserved for emphasis. Dark mode leans more on borders since shadows are less visible.

## Border Radius

| Scale | Value | Usage |
|---|---|---|
| `--radius` (base) | `0.75rem` (12px) | Reference value |
| `lg` | `0.75rem` | Cards, dialogs, large containers |
| `md` | `calc(0.75rem - 2px)` ≈ 10px | Inputs, buttons |
| `sm` | `calc(0.75rem - 4px)` ≈ 8px | Badges, small elements |
| `full` | `9999px` | Avatars, pills |

## Spacing

**Base unit:** 4px (Tailwind default). Common scales used:

| Context | Classes | Pixels |
|---|---|---|
| Micro (icon gaps) | `gap-1`, `gap-1.5` | 4px, 6px |
| Tight (inline) | `gap-2`, `space-x-2` | 8px |
| Standard | `gap-3`, `p-3` | 12px |
| Component | `gap-4`, `p-4` | 16px |
| Section | `p-6`, `gap-6` | 24px |
| Container | `p-6` (main content) | 24px |
| Max container | `2rem` padding, `1400px` max | — |

## Typography

**Font:** System font stack (browser defaults). No custom fonts loaded.

| Level | Classes | Usage |
|---|---|---|
| Page title | `text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent` | Page headings (gradient text) |
| Section title | `text-lg font-medium` | Dialog titles, subsections |
| Body | `text-base` (default) | General content |
| Secondary | `text-sm text-muted-foreground` | Descriptions, metadata |
| Small | `text-xs text-muted-foreground` | Badges, timestamps |
| Logo | `text-lg font-bold tracking-tight` | Sidebar brand |

## Icon System

**Library:** Lucide React (`lucide-react` v0.462.0)

| Context | Size classes | Pixels |
|---|---|---|
| Large (empty states) | `h-12 w-12` | 48px |
| Header logo | `h-6 w-6` | 24px |
| Sidebar items | `h-5 w-5` | 20px |
| Buttons, inline | `h-4 w-4` | 16px |
| Avatar | `h-8 w-8` | 32px |

## Layout

### App Shell

```text
┌──────────────────────────────────────────┐
│ [Sidebar]  │  [Header: trigger + theme + user] │
│  16rem     │─────────────────────────────│
│  (3rem     │                             │
│  collapsed)│     Main Content (p-6)      │
│            │     bg-gradient-subtle      │
│            │                             │
└──────────────────────────────────────────┘
```

- **Sidebar:** Collapsible (icon mode). 16rem expanded, 3rem collapsed, 18rem on mobile.
- **Header:** Sticky, h-16, border-bottom, backdrop-blur. Contains: SidebarTrigger | flex spacer | ThemeToggle | UserMenu.
- **Main content:** `flex-1`, `p-6`, `bg-gradient-subtle`.
- **Sidebar background:** Silencioso — same background as canvas in both modes. Border-right provides separation. Navigation is furniture, not a feature.

### Navigation Groups

1. **Domain:** Dashboard, Músicas, Escalas, Integrantes, Configurações, Relatórios, Histórico
2. **Admin (conditional):** Usuários, Roles, Permissões — visible only for `isAdmin`

## Component Patterns

### Cards

- Surface: `bg-card`, `border`, `rounded-lg`, `shadow-sm`
- Header: `p-6`, with title (`text-2xl font-semibold tracking-tight`) + description
- Content: `p-6 pt-0`
- Footer: `p-6 pt-0`, flex row

### Buttons

| Variant | Style |
|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| `outline` | `border border-input bg-background hover:bg-accent` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` |
| `link` | `text-primary underline-offset-4 hover:underline` |

| Size | Padding |
|---|---|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 px-3 rounded-md` |
| `lg` | `h-11 px-8 rounded-md` |
| `icon` | `h-10 w-10` |

### Tables

- No background (transparent rows)
- Border-bottom between rows
- Hover: `hover:bg-muted/50`
- Selected: `data-[state=selected]:bg-muted`
- Header height: `h-12`
- Cell padding: `p-4`

### Dialogs/Overlays

- Overlay: `bg-black/80`
- Content: `bg-background`, `sm:max-w-lg`, `sm:rounded-lg`, `shadow-lg`
- Animations: fade-in/out + zoom 95% + slide from center, 200ms

### Empty States

- Reusable `EmptyState` component: icon (`h-12 w-12`), title, description, optional action button
- Centered layout with `text-muted-foreground`

### Error States

- Reusable `ErrorState` component: `AlertCircle` icon, title, optional retry button
- Uses `text-destructive` for icon

### Avatar

- Fallback: `bg-gradient-primary text-white`
- Sizes: `h-8 w-8` (header), larger in profile contexts

### Badges

- Padding: `px-2.5 py-0.5`
- Border-radius: `rounded-full`
- Variants: default, secondary, destructive, outline

## Animation

| Type | Duration | Easing |
|---|---|---|
| Accordion expand/collapse | 200ms | ease-out |
| Dialog open/close | 200ms | Tailwind defaults (fade + zoom) |
| Hover transitions | 150ms (default) | `transition-colors` |
| Loading | `animate-pulse` | Built-in Tailwind |

## Dark Mode

- Strategy: `class`-based via `next-themes`
- Toggle: Sun/Moon icon button in header (ghost variant, `h-9 w-9`)
- Default theme: `system`
- **Key difference:** Both modes share the same warm hue family (amber/brown 30-40°). Dark mode deepens and desaturates — like dimming the sanctuary lights. No hue shift between modes.
- Shadows reduce visibility in dark mode — borders carry more weight.
- Semantic colors (destructive) remain the same across modes.

## Progressive Disclosure

The application follows a consistent progressive disclosure strategy: show the minimum necessary to orient the user, then reveal complexity on demand. This is driven by the Constitution's Principle I (Mobile-First) and Principle V (Simplicity/YAGNI).

### Disclosure Hierarchy

The UI reveals information in 4 layers, each triggered by intentional user action:

| Layer | What's visible | What's hidden | Trigger to reveal |
|---|---|---|---|
| **L1 — Overview** | Summary cards, counts, lists | Details, relations, actions | Page load |
| **L2 — Selection** | Item row with name + key metadata | Full details, edit/delete, relations | Click/navigate to item |
| **L3 — Action** | Detail view with all sections | Edit forms, delete confirmation | Click action button |
| **L4 — Inline creation** | Form fields | Entity creation (tonalidade, artista) | Type new value in CreatableCombobox |

### Implemented Patterns

#### 1. Tabs (Settings page)

- **Trigger:** Click tab trigger
- **Mechanism:** `<Tabs>` (shadcn/ui) swaps content without page reload
- **Mobile:** Horizontal scroll with `overflow-x-auto scrollbar-none`; active tab auto-centers via `scrollIntoView({ behavior: 'smooth' })`
- **5 tabs:** Artistas, Categorias, Funções, Tonalidades, Tipos de Evento
- **Permission gate:** `readOnly={!canWrite}` hides mutation controls per tab
- **Spec reference:** `specs/006-frontend-backend-phase2/spec.md` FR-017

#### 2. Dialog Forms (MusicaForm, IntegranteForm, EventoForm)

- **Trigger:** Click "Nova/Editar" button
- **Mechanism:** `<Dialog>` (Radix) with form inside, max-width constrained
- **Sizing:** `sm:max-w-[600px]` (MusicaForm), `sm:max-w-[425px]` (others)
- **Scrollable body:** `max-h-[70vh] overflow-y-auto` for long forms
- **Draft recovery (MusicaForm only):** On open, checks `localStorage` for saved draft → shows `<AlertDialog>` "Recuperar rascunho?" with Descartar/Recuperar options
- **Conditional sections:** IntegranteForm shows Funções section only in edit mode (not creation)
- **Spec reference:** `specs/008-enhanced-musica-form/spec.md` FR-001–FR-015

#### 3. Inline Editing (MusicaDetail, ConfigCrudSection)

- **Trigger:** Click pencil icon
- **Mechanism:** State toggle (`isEditingName` / `editingId`) swaps display text ↔ `<Input>` with save/cancel buttons
- **Keyboard:** Enter to save, Escape to cancel
- **Permission gate:** Edit icon visible only if `canWrite`

#### 4. Confirmation Dialogs (DeleteConfirmDialog)

- **Trigger:** Click delete/trash icon
- **Mechanism:** `<AlertDialog>` (Radix) with contextual message describing cascade impact
- **Buttons:** "Cancelar" (outline) + "Sim, excluir" (destructive)
- **Loading state:** Both buttons disabled during mutation
- **Spec reference:** `specs/006-frontend-backend-phase2/spec.md` edge cases — cascade warnings

#### 5. Creatable Comboboxes (MusicaForm)

- **Trigger:** Type a value that doesn't match existing options
- **Mechanism:** `<CreatableCombobox>` shows "Criar [value]" option → calls mutation → adds to options list → auto-selects
- **Entities:** Tonalidade, Artista, Categoria, Função — all creatable inline without leaving the form
- **Spec reference:** `specs/008-enhanced-musica-form/spec.md` FR-006–FR-011

#### 6. Smart Conditional Dialogs (EventoDetail → FuncaoSelectDialog)

- **Trigger:** Click "+" to add integrante to event
- **Mechanism:** If integrante has 2+ funções → opens `<FuncaoSelectDialog>` (checkboxes, all pre-checked). If 0-1 funções → adds directly without dialog.
- **Validation:** Cannot confirm with 0 funções selected

#### 7. Search + Filter (Integrantes, Músicas)

- **Trigger:** Type in search input
- **Mechanism:** Debounce 300ms → `useMemo` client-side filter → replaces list
- **Pagination interaction:** When searching, pagination is disabled (loads all records). Cleared search restores pagination.
- **Empty search result:** EmptyState with "Nenhum resultado encontrado para \"{term}\""
- **Spec reference:** `specs/006-frontend-backend-phase2/spec.md` FR-022–FR-023

#### 8. Permission-Based Visibility (all pages)

- **Mechanism:** `useCan(permission)` hook + `<Can>` component
- **Pattern:** Action controls (create/edit/delete buttons) hidden when user lacks permission. Read-only views always accessible.
- **Self-edit exception:** In Integrantes, "Editar" visible on own card regardless of permissions (`member.id === user?.id`)
- **Admin section:** Sidebar "Administração" group visible only for `isAdmin`
- **Spec reference:** `specs/016-frontend-acl-visibility/spec.md`

### Data States (all pages)

Every data-driven view implements 4 states:

| State | Presentation | Component |
|---|---|---|
| **Loading** | Skeleton placeholders (pulse animation) | Page-specific `*Skeleton` |
| **Error** | AlertCircle icon + message + "Tentar novamente" button | `<ErrorState>` |
| **Empty** | Inbox icon + descriptive message + optional action CTA | `<EmptyState>` |
| **Loaded** | Full content | Page content |

### Mobile Adaptations

Per Constitution Principle I (Mobile-First):

#### Layout & Padding

| Pattern | Mobile (<sm) | Desktop (sm+) |
|---|---|---|
| **Container padding** | `p-4` (16px) | `sm:p-6` (24px) |
| **Header padding** | `px-4` (16px) | `sm:px-6` (24px) |
| **Main overflow** | `overflow-x-hidden` | — |

#### Flex Rows with Multiple Elements

| Pattern | Mobile (<sm) | Desktop (sm+) |
|---|---|---|
| **Header + actions** | `flex-col items-start gap-3` | `sm:flex-row sm:items-center sm:justify-between` |
| **Input + Select + buttons** | `flex-wrap` + `w-full` on inputs | `sm:w-48` / `sm:w-32` fixed width |
| **Title + button** | `flex-col gap-2` or `flex-wrap` | `sm:flex-row sm:items-center sm:justify-between` |
| **Select + add button** | `flex-wrap` with Select `flex-1` | Inline in one row |

#### List Item Rows

| Pattern | Mobile (<sm) | Desktop (sm+) |
|---|---|---|
| **Item row** | `gap-2`, `min-w-0` on content | `gap-3` |
| **Dynamic text** | `truncate` + container `min-w-0` | Same |
| **Action buttons** | `flex-shrink-0` | Same |
| **Inline icons** | `flex-shrink-0` | Same |

#### Specific Components

| Pattern | Desktop (md+) | Mobile (<md) |
|---|---|---|
| **Grids** | `md:grid-cols-2` or `lg:grid-cols-4` | Single column (exception: compact stat cards may use `grid-cols-2`) |
| **Tabs** | `md:grid md:grid-cols-5` | `flex overflow-x-auto` horizontal scroll |
| **Dialogs** | `sm:max-w-[425px]` centered | Full-width with rounded corners |
| **Buttons** | Inline with text labels | Some hidden (`hidden sm:inline-flex`), icon-only |
| **Sidebar** | 16rem expanded, 3rem collapsed | 18rem overlay, auto-close on navigation |
| **Detail buttons** | Visible "Detalhes" text button | Click anywhere on item row |
| **Tables** | shadcn `<Table>` with columns | Stacked cards (`sm:hidden`) + table (`hidden sm:block`) |

#### Anti-patterns (NEVER use on mobile)

- `w-48`, `w-32`, `w-56` etc. without responsive prefix → use `w-full sm:w-48`
- `flex items-center justify-between` without `flex-wrap` or mobile `flex-col` → always add wrap strategy
- Dynamic text (names, titles) without `truncate` + `min-w-0` → horizontal overflow
- `p-6` / `px-6` in layout containers without `sm:` → use `p-4 sm:p-6`
- `<Table>` without mobile alternative layout → always use dual layout: cards `sm:hidden` + table `hidden sm:block`

### Cross-References

| Document | What it defines |
|---|---|
| `.specify/memory/constitution.md` | Principle I (Mobile-First), Principle V (YAGNI) — foundational constraints |
| `.claude/rules/frontend-react.md` | Component library rules, shadcn/ui usage, form patterns |
| `specs/006-frontend-backend-phase2/spec.md` | Tabs, search, CRUD flows, deletion cascade warnings |
| `specs/008-enhanced-musica-form/spec.md` | Unified form, creatable comboboxes, draft recovery |
| `specs/014-frontend-auth-rbac/spec.md` | Auth flows, login, protected routes |
| `specs/016-frontend-acl-visibility/spec.md` | Permission-based UI visibility, `useCan` hook |

## Tech Stack (UI)

| Tool | Version | Role |
|---|---|---|
| React | 18 | UI library |
| Vite | 5 | Build tool |
| TailwindCSS | 3 | Utility-first CSS |
| shadcn/ui + Radix | — | 44 component primitives |
| Lucide React | 0.462.0 | Icons |
| next-themes | — | Dark mode |
| TanStack React Query | 5 | Server state |
| react-hook-form + Zod | — | Forms + validation |
| Sonner | — | Toast notifications |
| Recharts | — | Charts |
| tailwindcss-animate | — | Animation plugin |
