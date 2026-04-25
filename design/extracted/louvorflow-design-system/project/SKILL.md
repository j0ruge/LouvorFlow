# LouvorFlow Design System — Skill

Use this skill whenever work involves the **LouvorFlow** product (worship-ministry SaaS, PT-BR, multi-tenant): song catalog, escalas/scheduling, integrantes, dashboard, auth.

## Fast facts
- **Brand typography**: **Sora** (display + body, 400–800) — Google Font. Geométrica-humanista, moderna, jovem. Uma família só pra tudo. Fallback: system stack.
- **Palette**: warm amber/gold primary (`38 80% 52%`) + burgundy accent (`350 45% 42%`) on linen cream canvas (`38 40% 96%`). Dark mode = warm charcoal sanctuary.
- **Radius base**: 12px (cards/dialogs), 10px (inputs/buttons), 9999 (pills/avatars).
- **Shadows**: warm-brown-tinted, three tiers — soft / medium / glow (amber).
- **Icons**: Lucide only. No emoji, ever.
- **Signature treatment**: `h1` uses `bg-gradient-primary bg-clip-text text-transparent` (amber→wine).
- **Tone**: PT-BR, implicit _você_, short imperatives, warm & respectful. No corporate, no liturgical-ornate.
- **Sidebar**: silencioso — same color as canvas, separated by border only.

## Entry points
- `README.md` — full system doc (read first for any non-trivial work)
- `colors_and_type.css` — drop-in tokens (`:root` + `.dark`); `@import` this into any HTML surface
- `preview/` — per-token cards (colors, type, spacing, components, brand)
- `assets/brand-lockup.html` — logo lockups (Music icon + Sora wordmark)
- `ui_kits/louvorflow/` — hi-fi product recreations

## Do
- Import `colors_and_type.css` rather than redeclaring tokens.
- Use `hsl(var(--token))` syntax everywhere — tokens are stored as H S% L%.
- Match PT-BR copy conventions ("Nova Música", "Próximas Escalas", "Tentar novamente").
- Use Lucide icons via `lucide-react` (app) or `https://unpkg.com/lucide@latest` (previews).
- Prefer overlays (Drawer/Popover/Dialog) over pushing content down.

## Don't
- Don't use emoji, Heroicons, or any icon set other than Lucide.
- Don't invent new hues — stay in the 30–40° amber family + 350° wine accent.
- Don't use pure white (`#fff`) for canvases — use `hsl(var(--background))` (linen cream).
- Don't add filler content, decorative illustrations, or hero photography.
- Don't mix in other display/script typefaces; stick with Sora as the single brand family.

## Caveats
- The live app currently ships with a system-font stack; **Sora** is the forward recommendation documented here. If the user hasn't adopted it in the codebase yet, flag when proposing production-facing code.
- No bespoke logomark exists — the Music (Lucide) icon + "LouvorFlow" wordmark is the canonical lockup.
- Only the authenticated web app is covered; no marketing or native mobile surfaces.
