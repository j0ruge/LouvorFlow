# PRD: Share Schedule to WhatsApp

## Overview

Worship leaders at every LouvorFlow tenant need to communicate the weekly
service schedule (songs + members + roles) to their team in a WhatsApp group.
Today they open LouvorFlow, look at the escala detail page, switch to
WhatsApp, and retype the songs (with key), the song reference links, and the
list of members with their roles. This manual transcription happens every
week, is error-prone (wrong key, missing members), and discourages last-minute
schedule updates because each change forces a re-send.

This feature lets a worship leader, from the escala detail page at `/escalas`,
copy a fully-formatted schedule message to the clipboard **or** open WhatsApp
directly with the message pre-filled, in one click. The message uses
WhatsApp's lightweight markdown so titles are bold and dates italicized when
the recipient sees the message in the group.

It is for **worship leaders** (users holding the `escalas.write` permission)
of any tenant on LouvorFlow. It is valuable because it removes a recurring
weekly chore, eliminates transcription errors, and encourages keeping the
schedule on LouvorFlow up-to-date right until service time.

## Goals

- Reduce time to share a complete schedule from minutes (manual retyping) to
  under five seconds (one click + pick group).
- Remove transcription errors as a class of problem (wrong key, missing
  member, outdated song link).
- Increase the perceived value of keeping the LouvorFlow escala in sync with
  reality, since the cost of re-sharing drops to near zero.
- Ship the MVP behind the existing `escalas.write` permission so no new RBAC
  surface is introduced.

## User Stories

**Primary persona — Worship leader (`escalas.write`)**

- As a worship leader, I want to copy the full escala (songs, keys, members,
  roles) as a WhatsApp-formatted message so I can paste it into my church's
  worship group without retyping anything.
- As a worship leader, I want a button that opens WhatsApp directly with the
  message pre-filled so I can pick my group and tap send without context
  switching.
- As a worship leader, when a song has multiple registered artist versions
  with different reference links, I want to pick which version applies to
  *this* escala so the team gets the link the leader actually intends to use.
- As a worship leader, I want my version choice to stick to the escala so the
  next time I share I do not have to pick again.
- As a worship leader, I want clear visual confirmation that the copy
  succeeded so I trust the action worked before switching apps.

**Secondary persona — Member (no `escalas.write`)**

- As a regular member, I do not see the share buttons; I rely on the leader
  to share. (Out of scope by design — see Non-Goals.)

## Core Features

### 1. WhatsApp-formatted message generator (P0)

Generates a plain-text string from an escala's data using this exact layout:

```text
*<Tipo de evento>* — _<DD/MM/AAAA HH:mm>_

🎵 *Músicas* (<n>)

1. <Nome da música> (<Tom>)
   <Link da versão escolhida, se existir>
2. <Nome da música> (<Tom>)
   <Link da versão escolhida, se existir>
…

👥 *Integrantes* (<n>)

<Nome integrante> — <função 1>, <função 2>
<Nome integrante> — <função 1>
…
```

Rules:

- Bold (`*text*`) and italic (`_text_`) follow WhatsApp markdown.
- Songs ordered by `ordem` (existing field on `eventos_musicas`).
- Tom is omitted gracefully if the song has no `tonalidade`.
- The link line is omitted entirely if no version is selected for that song
  or the selected version has no link.
- Members ordered alphabetically by name; functions joined by `, `.
- Members with no functions show `<Nome>` with no trailing dash.

### 2. Per-escala song version selector (P0)

When a song has more than one registered artist version on the music catalog,
the worship leader picks which version to use **for this specific escala**
when they add or edit the song in the escala. The choice is persisted with
the escala-song relationship, not on the global song record. Songs with
exactly one version auto-select it (no UI noise). Songs with zero versions
work fine — they simply have no link in the message.

### 3. Share action group on the escala detail page (P0)

A new action appears in the escala detail header next to the existing
`Editar` / `Excluir` buttons, gated on `escalas.write`. It exposes two
actions:

- **Copiar texto** — copies the formatted message to the clipboard, shows a
  success toast.
- **Abrir no WhatsApp** — opens `https://wa.me/?text=<encoded-message>` in a
  new tab/window so the user picks the group on WhatsApp Web/Desktop/Mobile.

The two actions can ship as a single split button or two adjacent buttons —
the visual treatment is the TechSpec's call.

### 4. Resilient feedback (P0)

- Successful copy → toast `Escala copiada para a área de transferência`.
- Clipboard failure (e.g., insecure context, browser denial) → toast
  `Não foi possível copiar. Use o botão "Abrir no WhatsApp".`
- WhatsApp share opens in a new tab; if the popup is blocked, surface a
  toast suggesting the user enable popups for the site.
- Empty escala (no songs and no members) → button stays enabled but the
  message renders the headers with `(0)` counts so the leader can still
  share an early heads-up.

## User Experience

**Primary flow — Share an upcoming escala**

1. Worship leader navigates to `/escalas` and opens the detail of an
   upcoming escala.
2. Header shows `Editar`, `Compartilhar` (new), `Excluir`.
3. Leader clicks `Compartilhar`. Two options are visible: `Copiar texto` and
   `Abrir no WhatsApp`.
4a. **Copy path**: Click `Copiar texto`. Icon momentarily flips to a check.
    Toast confirms. Leader switches to WhatsApp manually and pastes.
4b. **Direct path**: Click `Abrir no WhatsApp`. New tab opens WhatsApp
    Web/App with the message already filled in. Leader picks the group and
    sends.

**Secondary flow — First time sharing a song with multiple versions**

1. Leader edits the escala and adds a song that has 3 registered versions in
   the music catalog (e.g., original, acoustic, live).
2. Inside the song card on the escala (or on the add-song dialog), a small
   version selector appears.
3. Leader picks the desired version. Selection is saved against the
   escala-song relationship.
4. Next time the leader (or anyone else) shares the escala, the selected
   version's link appears in the message. The leader does not need to pick
   again unless they edit the escala.

**Discoverability**

- The share button uses an icon already familiar to users (`Share2` or
  `MessageCircle` from lucide-react) plus the label `Compartilhar`. Placing
  it in the existing header action group ensures it is found at the same
  glance as `Editar`.
- A tooltip on the icon clarifies "Copiar ou enviar pelo WhatsApp" for new
  users.

**Accessibility**

- Buttons must be keyboard reachable (Tab order) and announce their label to
  screen readers.
- Toast feedback must use the existing Sonner accessible region (already
  configured project-wide).
- Color contrast on the success state (icon flip to check) follows the
  project design tokens.

## High-Level Technical Constraints

- Must respect the existing tenant isolation model — the message is built
  client-side from the standard tenant-scoped escala detail endpoint, so no
  cross-tenant leakage is possible.
- Must work on the same set of browsers LouvorFlow already supports
  (modern Chrome, Edge, Firefox, Safari, mobile Chrome/Safari). Clipboard
  API requires HTTPS, which production already serves.
- Must work for tenants with no permission changes — the feature reuses the
  existing `escalas.write` permission.
- Message length: WhatsApp's `wa.me/?text=` URL has practical length limits
  on some clients. The TechSpec must validate behavior for escalas with
  ~30 songs to ensure no truncation in production.
- The version-link data must come back through the existing escala detail
  endpoint to keep the share path single-roundtrip from the client's
  perspective.

## Non-Goals (Out of Scope)

- **Direct send to a specific WhatsApp group/contact.** WhatsApp's public
  URL scheme does not let third parties target a group; the user always
  picks the destination on the WhatsApp side. Anything more requires the
  paid WhatsApp Business API and is out of scope.
- **Read receipts / delivery tracking.** LouvorFlow has no visibility into
  what happens after the message leaves the WhatsApp tab.
- **Templating / customization** of the message format (e.g., user-defined
  templates per tenant). The MVP ships one canonical layout.
- **Sharing via Telegram, e-mail, SMS, calendar invite, etc.** Adjacent
  channels can be added later if demand exists.
- **Member self-service share.** Only `escalas.write` users see the action.
- **Automatic broadcast** (cron, scheduled push, etc.). The action is
  manual and on-demand.
- **Globally selecting a "primary version"** for a song across all escalas.
  The selection is per-escala by design; otherwise the leader cannot vary
  the version between two services using the same song.
- **Editing the message text before sending.** The user copies or shares
  exactly what the system generates; further edits happen in WhatsApp.

## Phased Rollout Plan

### MVP (Phase 1)

- Per-escala version field added to the escala-song relationship.
- Version picker UI on the song card inside the escala (only when ≥2
  versions exist; auto-select when exactly 1).
- Backend escala detail endpoint enriched with the selected version's link.
- New `Compartilhar` action group on the escala detail page (gated on
  `escalas.write`).
- Copy-to-clipboard with toast feedback.
- Open-in-WhatsApp via `wa.me/?text=…`.
- Header in the message: `*<Tipo>*` + italicized date.

**Success criteria to proceed to Phase 2**

- ≥30 % of leaders use the share action at least once per week within four
  weeks of release.
- Zero reported incidents of the message containing wrong song keys or
  member roles attributable to the formatter.
- Positive qualitative feedback (no sustained complaints) about message
  layout and the version-picker UX.

### Phase 2 (Quality of life — only if MVP metrics hit)

- Optional second message containing the cifras / lyrics of the selected
  versions (separate copy button so the main share stays light).
- Bulk-copy multiple upcoming escalas at once for monthly planning.
- Inline preview of the message in a popover before clicking copy.

### Phase 3 (Future)

- Pluggable channels: Telegram, e-mail digest.
- Per-tenant customizable message template.
- Backend signed short-link service if `wa.me/?text=` length becomes a
  problem for very large escalas.

## Success Metrics

- **Adoption**: % of weekly active worship leaders that use Copiar texto or
  Abrir no WhatsApp at least once per ISO week.
- **Frequency**: Average shares per escala (counted over the 14 days
  surrounding service date).
- **Time saved per share**: Self-reported survey, 30 days post-launch
  (target: leaders report < 10 seconds vs. > 60 seconds before).
- **Error reduction**: Number of leader-reported "wrong info in WhatsApp"
  incidents per month (target: 0 attributable to the formatter).
- **Message integrity**: 0 incidents of truncation/missing data in the
  shared message attributable to URL length.

## Risks and Mitigations

- **Adoption risk — leaders keep their old habit of manual retyping.**
  Mitigation: a one-time in-app toast / tooltip the first time a leader
  with `escalas.write` opens an escala detail page after release.
- **Message length risk — `wa.me/?text=` truncates very long URLs on some
  clients.** Mitigation: explicit TechSpec test with a synthetic 30-song
  escala on Chrome desktop, Chrome Android, Safari iOS. If truncation is
  observed, fall back to clipboard-only with a warning toast for that case.
- **Format mismatch risk — WhatsApp updates its markdown parser.**
  Mitigation: keep the format generator pure and unit-tested so changing
  the format is a one-line edit if needed.
- **Schema migration risk — backfilling the new version field for existing
  escalas.** Mitigation: nullable field; existing rows simply omit the link
  until the leader edits the escala once.
- **Permission expectations risk — members complain they cannot share.**
  Mitigation: the PRD intentionally restricts to `escalas.write`; if
  feedback contradicts, revisit in Phase 2.

## Architecture Decision Records

- [ADR-001: Per-escala song version selection over global primary version](adrs/adr-001.md) — The link shown in the shared message comes from a version chosen on the escala-song relationship, not a global "primary version" on the song catalog.

## Open Questions

- Visual treatment of the share action: split button vs. two adjacent
  buttons vs. dropdown menu — defer to TechSpec / interface-design review.
- Exact icon choice (`Share2`, `MessageCircle`, custom WhatsApp glyph) —
  defer to TechSpec / design.
- Whether the version picker should also let the leader pick "no version /
  no link" explicitly (e.g., when the leader does not want to share a link
  this week) — current proposal: yes, the picker has an empty option.
- Whether to localize the message strings (`Músicas`, `Integrantes`) for
  future multi-language tenants. Today LouvorFlow is PT-BR only, so the
  MVP hard-codes Portuguese.
