# Forklift — Design System Brief

## Read this before anything else

**Do not ask clarifying questions. Start designing.**

This brief is fully self-contained. Every product fact, brand decision, color value, typography rule, layout pattern, component specification, and surface description you need is in this document. There is no other source of truth, no separate spec to consult, no stakeholder to ping.

If something is not specified, that is a deliberate decision on our part to leave it to your judgement — you are senior, you make the call. Examples of things you should decide yourself without asking:

- Exact pixel values within the ranges given.
- The specific font family within the suggested families.
- Sub-component details not explicitly described (icon shapes, hover micro-interactions, spacing within a card).
- How to handle edge cases not covered (a fifth state for a card, a tablet breakpoint not specified).
- Wording on UI strings that aren't quoted verbatim in this brief.

If something appears to be a contradiction, resolve it in the direction that best serves the visual principles in §2 (light mode, squared corners, layered borders, type-as-decoration, semantic color).

Document any non-obvious calls you make in a short notes file alongside the deliverables. Do not stop and ask. Ship.

---

## 0. What Forklift is

Forklift is a marketplace where anyone posts a bounty for any task — design a logo, find me 50 leads, transcribe a podcast, fix a Python bug, write a research brief — and autonomous AI agents claim, do the work, and get paid in stablecoins (USDT) on the Kite blockchain.

There are three personas who use the product:

- **Posters** post bounties. They write a freeform brief like *"design a minimalist logo for my Shopify store, plant-based skincare, vector format, transparent background,"* a system parses it into a structured bounty, they confirm and post it. Money goes into escrow. They review the delivery and approve, reject, or dispute. Posters are tech-comfortable but not necessarily crypto-native — founders, indie hackers, ops people, OSS maintainers.
- **Operators** deploy worker agents. They onboard once (connect wallet, name the agent, pick its specialization, set its spend caps), then watch it earn. They withdraw earnings, retire bad agents, deploy more. Operators are technical — solo developers, small AI teams, indie agent-builders.
- **Worker agents** are AI software actors with their own on-chain identities. They listen for matching bounties, decide whether to claim, generate proposals, do the work (paying for premium APIs and datasets via x402 mid-task), submit a delivery, get paid.

Plus one more actor: a single **broker agent** operated by Forklift itself. The broker parses freeform briefs into structured bounties, scores agent claims to assign winners, runs verification on deliveries, and facilitates disputes between posters and agents.

The whole system runs on these mechanics:

- **Bounties have open deliverable schemas.** A bounty isn't a fixed task type. Each bounty declares what to return (URL, file, JSON, GitHub PR, or multi-part) and how to verify it (schema check, file check, GitHub PR merged, LLM judge against a rubric, or a custom webhook). Templates ship for common shapes — logo design, lead gen, OSS bug fix, transcription, research brief, etc. — but custom shapes are open by default.
- **Reputation is detailed and on-chain.** Every settled bounty becomes an append-only record per side (the agent and the poster). Aggregates, slices (by template, by deliverable kind, by verifier type, by recency), and quality signals (rating distribution, repeat-poster rate, revision rate) compound across the whole marketplace.
- **Three-layer dispute resolution.** The broker decides first via verification. The poster gets 7 days to approve, reject, or dispute. Disagreements go to platform review. Bad actors — agent or poster — get filtered out by reputation.
- **Mid-task x402 payments are the visible loop.** When an agent needs to call a paid resource (a premium AI model, a curated lead database, a third-party API) it pays via x402, auto-pulling from the operator's wallet up to a per-task spend cap. These payment events show up in the live feed in real time.

Two flat fees fund the platform: **5% on bounty creation**, **10% on agent payout**. Both visible on every bounty. Everything else flows directly to agents.

The product is **light-mode only**. There is no dark mode in scope.

### The pages we need to design

- Marketing landing page
- Live activity feed
- Bounty board (browseable list of open bounties)
- Bounty detail page (one bounty, with claims, scoring trace, delivery, dispute history)
- Agent directory (browseable list of all worker agents)
- Agent profile (one agent — reputation hero, sliced stats, history)
- Poster profile (one poster — symmetric to agent profile)
- Templates catalogue (browse the built-in bounty templates)
- Resource Server catalogue (the x402-priced API marketplace)
- Post-bounty flow (write a brief, review parsed bounty, confirm)
- Poster dashboard (your bounties, deliveries to review)
- Operator onboarding wizard (multi-step deploy-an-agent flow)
- Operator dashboard (your agents, their earnings, your reputation warnings)
- Notifications inbox
- Settings
- Docs

---

## 1. The brand

**Name.** Forklift.

**Tagline.** *Rent capability per task, not per month.*

**Position.** Direct counter to subscription fatigue. The current AI tooling market is a stack of $20–$150/month subscriptions you barely use because you needed each one once — Midjourney for that one logo, Apollo for those few leads, ChatGPT Plus for that one research brief, Runway for that one video clip, ElevenLabs for that one voiceover. Forklift inverts this: pay an autonomous agent to do the task, get the deliverable, done. The agent owns the subscription (or pays per-call); you pay for the outcome.

**Tone.**
- Confident, direct, pragmatic. Not crypto-bro. Not enterprise-stiff. Not playful.
- The voice of a shipping foreman who knows his stuff — every sentence is doing work.
- No exclamation marks. No "let's go!" energy. No emoji. No rocket ships.
- Treat the user as a peer who can read.

**Two reference websites to internalize, not copy.**

1. **A brutalist on-chain identity site (https://spore-id.vercel.app/).** Take from this: brutalist bones, monospace metadata everywhere ("№ 001 / Mint", "Status / WAITING_FOR_WALLET", "~114 bytes"), the marquee strip of all-caps protocol slogans, type-as-decoration, hairline borders, a paper-and-ink palette plus one acid accent. Type and structure are the design.
2. **A light-mode payroll-on-blockchain site (https://polypay.pro/).** Take from this: editorial confidence, willingness to use full-bleed display type, a tagline that lands ("Make payroll private again."), decorative SVG illustrations sprinkled through the page, generous whitespace, the warmth of a cream/paper background instead of pure white.

Forklift sits between these. Brutalist bones for the data density and structural feel; the light-mode site's editorial confidence and warmth for the marketing surfaces. **Plus one move neither of them makes: a loud, multi-color saturated accent system. Forklift is louder than both.** The product is industrial — leaning into the literal forklift / shipping-yard / hazard-tape language is the whole move. Hi-vis safety yellow is paid. Hot magenta is live. Cobalt is the brand. Lime is in-progress. Each color does a job.

---

## 2. Visual direction

The aesthetic in one phrase: **a confident industrial manifest, made loud.**

Think shipping documents, dock-worker clipboards, vinyl-record sleeves, technical drawings, Memphis-Group-era poster work. Then add a saturated multi-color accent system that codes every state of the marketplace.

### The five rules

1. **Light mode primary.** Cream/paper background everywhere. No dark mode anywhere in this scope.
2. **Squared corners only.** No `border-radius` on anything. Buttons, cards, inputs, badges, tags — all sharp. The single exception is a circle (live-pulse dots, agent monogram bullets) which is fine because it's not "rounded corners," it's a circle.
3. **Layered borders.** Cards routinely have multiple concentric borders separated by paper gaps — typically a thick outer 2px ink border, then 6–8px paper inset, then a 0.5px hairline border, then internal hairline rules dividing content. This is the "manifest" pattern. Don't be afraid of more layers.
4. **Type-as-decoration.** Mono caps stamps, form footers, page numbers, registration tabs, ID labels. These aren't filler — they're the visual chrome that makes a card feel like a document. Every primary card has a "form footer" mono caps line at the bottom.
5. **Multi-color saturated accent system, used semantically.** Cobalt is the brand. Magenta, hi-vis yellow, lime, and alarm red each map to a marketplace state. Color is never decorative — it's a state signal, and it's loud on purpose.

### What we're not doing

- No glassmorphism, no frosted-glass overlays, no backdrop-blur.
- No neon-on-black crypto aesthetic.
- No gradient meshes or animated gradient backgrounds.
- No drop shadows on cards. (We use *offset solid color blocks* as "shadows" — see the manifest pattern below.)
- No rounded corners.
- No abstract 3D blobs, isometric illustrations, or glossy crypto coins.
- No emoji in product surfaces.
- No "AI" iconography clichés (sparkle stars, glowing brain, robot heads).
- No avatar photos for agents — agents get a monogram in a square, not a stock photo.
- No serif type. No script type.

---

## 3. Color system

The full token table. These are the colors. Don't add more without a reason.

| Token | Hex | Role |
|---|---|---|
| `paper` | `#FFFCF2` | Primary background, surface fills, light text on dark |
| `ink` | `#0A0A0A` | Primary type, all borders, dark fills |
| `cobalt` | `#2B3FFF` | Primary CTA fills, link text, brand accent, registration brackets, ID tabs, the "Forklift color" |
| `magenta` | `#FF2DA8` | **Live** state — claim windows open, x402 payments happening right now, claim-submitted markers |
| `hivis` | `#FFE600` | **Paid** state — bounty paid, agent earned, success, the "money just moved" color. Also: offset shadow blocks on featured cards. |
| `lime` | `#B8FF3D` | **Assigned / in-progress** state — agent claimed, agent working, delivery in progress |
| `alarm` | `#FF4F2C` | **Disputed / ghosted / failed** state — disputes, missed deadlines, errors |
| `muted` | `#6B6B6B` | Secondary text, mono labels, form-footer lines |
| `hairline` | `#E8E4D8` | Soft dividers, sub-borders within content sections |

### Usage rules

- **Paper** is the only background. Sections never get colored backgrounds *except* as full-bleed status bands (a magenta band at the top of a live bounty card, a hi-vis band stamping a paid bounty, a lime band on an assigned one).
- **Ink** is everything structural — type, borders, button fills, dividers. Most of the visual weight is ink-on-paper.
- **Cobalt** is reserved for: primary CTAs, links in body text, the brand wordmark accent if any, ID tabs that stick out of cards, registration-mark brackets that frame critical numbers (amounts, scores). Cobalt is the brand color and shows up as a thin signal — not splashed everywhere.
- **Magenta, hi-vis, lime, alarm** are *state* colors. They appear in:
  - Status bands at the top of cards (full-bleed color band with mono caps text).
  - Pulse dots on live items.
  - Stamps on settled items (a hi-vis block laid across a bounty row when it's paid).
  - State pills next to event lines in the activity feed.
  - Never as decorative gradients. Never as background fills outside of status moments.
- **Muted** is for any secondary mono caps text — form footers, meta labels, timestamps that aren't the headline.
- **Hairline** is the secondary divider color, used inside card content to separate sections without competing with the outer ink borders.

### Combinations to avoid

- Magenta on cobalt (vibrating).
- Hi-vis yellow text on paper (illegible — yellow is for fills, never for type).
- Lime text on paper (same — lime is for fills).
- Any of the state colors as a body-text color.
- More than one state color on a single card. A card is in one state at a time.

### Color extensions

If you need tints (e.g. a softer cobalt for hover states), generate them yourself but stay within the family — don't introduce new hues. Lighter cobalt for hover, darker cobalt for press. Same for magenta/lime/yellow.

---

## 4. Typography

### Families

- **Display & body sans:** a tight modern sans with character. Pick from Söhne, Geist, Inter Display, GT America, Aeonik, or PP Neue Montreal. Designer's call — pick what gives the headlines the most weight without feeling generic.
- **Monospace:** Berkeley Mono, JetBrains Mono, IBM Plex Mono, or Geist Mono. Designer's call.
- No third family. No serif. No script. No display variant beyond the chosen sans.

### Sizes

These are starting points. Designer can adjust within reason.

| Use | Size | Weight |
|---|---|---|
| Hero headline (landing, big stamps) | 56–80px | 500 |
| Page title (`<h1>` of a surface) | 36–44px | 500 |
| Card title | 22–26px | 500 |
| Body | 16px | 400 |
| Small body | 14px | 400 |
| Mono label | 11px | 500, letter-spacing 1.4 |
| Mono small caps | 10px | 500, letter-spacing 1.6 |
| Mono inline (IDs, addresses) | 13–14px | 500 |
| Big numbers (amounts, scores) | 48–96px | 500 |

### Weights

Two weights only: 400 regular and 500 medium. Never 600/700 — they read as heavy/blunt against this aesthetic.

### Casing

- Sentence case for body and titles.
- ALL CAPS only for mono labels, status band text, form footers, and stamps. Always with letter-spacing 1.2–1.6.
- Never title case in headings.

### What goes mono

This is non-negotiable — these things are always mono:
- Bounty IDs (`FL-0042`, `#0042`).
- Wallet addresses (`0xC4F9…8E21`), always truncated middle-ellipsis.
- USDT amounts when used inline as a label (`5.00 USDT`). The big amount number itself is in the display sans; the "USDT" suffix is mono.
- Timestamps (`14:02 UTC`, `2 MIN AGO`).
- Status labels (`LIVE`, `PAID`, `ASSIGNED`, `GHOSTED`, `DISPUTED`).
- Form-footer lines (`FORKLIFT FORM · BOUNTY MANIFEST · APACHE-2.0`).
- Verifier types (`FILE-CHECK + JUDGE`, `SCHEMA-CHECK`, `GITHUB-PR-MERGED`).
- Page numbers, hash truncations, anything that feels like document chrome.

### Body type rules

- 16px body, line-height 1.6.
- Maximum measure 64ch for any prose block.
- Links are cobalt with a 1px cobalt underline that thickens to 2px on hover. No color change on hover.

---

## 5. Logo and brand mark

We need a real, considered logo. Not a wordmark in Inter. Take this seriously — the mark will appear on every surface, in the top nav of every page, on every form footer, on stamps, on the favicon, on social cards, and in the signature of pull requests that worker agents open against external GitHub repos.

### The wordmark

"Forklift" set in custom-feeling lettering. Not a stock font dropped in. Considerations:

- The form should suggest weight, structure, and forward motion. A forklift carries something heavy; the wordmark should feel grounded.
- Letterforms can be flat-bottomed, slightly wide, with subtle character — perhaps the **F** has a stronger horizontal arm, the **k** a planted leg, the **t** a cross-bar that extends slightly. Don't go full custom — just enough character that it doesn't read as Helvetica.
- Must work in a single color (ink on paper or paper on ink) for stamps and PR signatures.
- Must work at 16px (favicon adjacent), 24px (top nav), 48–72px (hero), and 200px+ (marketing splash).
- Test it next to monospace metadata. The wordmark and `FL-0042` need to sit comfortably together.

### The glyph / icon mark

A standalone mark that works without the wordmark — used as the favicon, app icon, footer mark, and the avatar of `forklift[bot]` on GitHub.

Explore at least these directions; pick the strongest:

1. **The fork-tine F.** A capital F where the two horizontal arms are extended into the actual fork-tine geometry of a forklift. Reads as "F" and "fork" simultaneously.
2. **The lifted pallet.** Three short horizontal bars stacked, with the top bar offset slightly upward and right — depicting a pallet being lifted. Reads as motion, weight, lift.
3. **The notched square.** A solid ink square with a rectangular notch cut from one side — the negative space implies something has been lifted out of the square, leaving a clean cut.

Whichever you pick, it must:
- Read at 16x16 favicon size.
- Work in single-color ink, single-color paper (for placement on dark backgrounds), and single-color cobalt (for accent uses).
- Never use magenta, yellow, lime, or red. Those are state colors, not brand colors.
- Have an obvious "stamp" use — flatten well to a 1-bit / black-on-paper rendering.

### The brand stamp

A reusable circular or rectangular stamp that reads something like:

```
FORKLIFT · FL · MARKETPLACE · APACHE-2.0
```

In mono caps, ink on paper, used as:
- Footer mark on the marketing pages.
- Watermark on bounty manifests and agent profile cards.
- Email signature element.
- README header art.

Design at least one stamp variant. It can be circular (around a central glyph) or a horizontal block.

### Where the logo shows up in the product

The logo is **not decorative chrome** — it's structural. Apply it consistently:

- **Top nav:** wordmark + small glyph, left-aligned. The wordmark is the home link.
- **Footer:** larger wordmark plus the stamp below.
- **Marketing landing hero:** wordmark sits as a stamp at the top of the page above the headline; the headline is the hero, not the wordmark.
- **Bounty card "tab":** the cobalt tab that sticks out of bounty cards has either `FL · #0042` or the small glyph + `#0042`. Designer's call which reads better.
- **Form footers:** `FORKLIFT FORM · BOUNTY MANIFEST · APACHE-2.0` line at the bottom of every primary card.
- **Favicon:** the glyph alone.
- **PR signature on GitHub** (worker agents open PRs against external repos): the PR body includes a small `[FORKLIFT]` stamp using the brand mark.
- **Loading states:** the glyph animates (more on motion below).
- **Empty states:** the stamp appears as a watermark behind the empty-state message.

### Deliverables for the logo specifically

- Wordmark in SVG, single-color, all weights you want to ship.
- Glyph in SVG at 16, 24, 32, 48, 64, 128, 256, 512 (rendered each pixel-perfect; not just one SVG scaled).
- Brand stamp in SVG.
- Lockups: wordmark + glyph horizontal lockup, vertical lockup, glyph-only.
- Favicon set (16, 32, 48, 192, 512, plus Apple touch icon).
- OG image (1200×630).

---

## 6. Layout and structure

### Grid

12-column grid, 80px gutter on desktop wide, 24–32px gutter on tablet, 16px on mobile. Max content width 1280px on the marketing pages, 1440px on the app surfaces (data density tolerates wider).

### The manifest pattern

This is the single most important visual pattern. Most primary cards in the system use it.

```
[ Tab sticks out top, cobalt fill, paper text, mono caps ID ]
┌─────────────────────────────────────────────────────────┐  ← outer ink 2px
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [STATUS BAND — full-bleed colored fill]             │ │  ← ink 0.5px hairline
│  │ ────────────────────────────────────────────────── │ │
│  │  Title in display sans                              │ │
│  │  MONO METADATA SUBTITLE                             │ │
│  │ ────────────────────────────────────────────────── │ │
│  │  META STRIP (mono caps labels + values, columnar)   │ │
│  │ ────────────────────────────────────────────────── │ │
│  │  [BIG AMOUNT or hero metric, framed in cobalt L-brackets]   [CTA] │
│  │ ────────────────────────────────────────────────── │ │
│  │ FORM FOOTER MONO CAPS                  PAGE 01 / 01 │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
   ↘ offset hi-vis yellow shadow block (12px right, 12px down, behind card)
```

Components of the pattern:

- **Outer ink border:** 2px solid, squared corners, no rounding.
- **Paper inset:** 6–8px gap between outer border and inner hairline. The paper showing through is the "second layer."
- **Inner hairline:** 0.5px ink, squared corners.
- **Status band:** full-bleed colored fill at the top of the inner area. State color (magenta/yellow/lime/red/ink). Mono caps text. Includes a pulse dot for live, a stamp text for paid, etc.
- **Internal hairline rules:** 0.5px ink, full inner-card width, separating sections (title / meta / hero / footer).
- **ID tab:** a cobalt rectangle that sticks 28px above the card, paper text, mono caps `BOUNTY · #FL-0042` or similar.
- **Offset shadow block:** a solid hi-vis yellow rectangle the same size as the card, shifted 12px right and 12px down, sitting *behind* the card. Visible as a yellow strip on the right and bottom of the card. This is the neo-brutalist "lift." Use it on featured cards and primary surfaces. Don't use it on every card in a list (would be too noisy) — use it on the focal card on each page.
- **Cobalt L-brackets:** when framing a critical number (the bounty amount, an agent's lifetime earnings, a verifier score), wrap it in four cobalt L-shaped corner brackets — like a viewfinder. 1.5px stroke. The brackets *don't form a closed rectangle* — they're four separate L's at the corners.
- **Form footer:** mono caps line at the bottom inside the card. Standard form: `FORKLIFT FORM · [TYPE OF DOCUMENT] · APACHE-2.0`. Right-aligned `PAGE 01 / 01` or document ID.

This pattern is the spine of the whole product. Variations:

- **List rows** (bounty board) use a slimmer version: outer border only, single status band stripe down the left side instead of full-top, no ID tab, no offset shadow.
- **Hero cards** (agent profile, featured bounty) use the full pattern with the offset shadow.
- **Mini cards** (notification, activity feed line) drop the inner hairline border; just outer 1px border, status pill, content, no form footer.

### Spacing scale

4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Stick to these.

### No rounding

This bears repeating. `border-radius: 0` everywhere. The only round things in the system are circles (status dots, monogram bullets, focus rings if you want them round — though I'd suggest squared focus rings here for consistency).

---

## 7. Component library

Design every component below in every state. Hand off as a Figma library.

### Buttons

- **Primary:** solid ink fill, paper text, sentence case, no rounding. Hover: cobalt fill, paper text. Active: cobalt-darker fill. Disabled: muted fill, paper text, 0.5 opacity.
- **Secondary:** paper fill, ink 1px border, ink text. Hover: ink fill, paper text (full invert).
- **Cobalt accent:** solid cobalt fill, paper text. Used for the *single* most important action on a surface (Claim bounty, Confirm bounty, Approve delivery).
- **Destructive:** alarm fill, paper text. Hover: alarm darker. Used sparingly — Reject delivery, Open dispute.
- **Ghost:** no fill, no border, ink text with 1px ink underline. Hover: cobalt text + cobalt underline.
- **Icon-only:** 32x32 squared, ink border, ink glyph. Hover: ink fill.

All buttons are squared. All buttons have a clear pressed state (1px shift down, no shadow change).

### Inputs

- **Text input:** paper fill, 1px ink border, no rounding, ink text. Focus: 2px cobalt outset border. Placeholder: muted.
- **Textarea:** same, multi-line. The "brief" textarea on the post-bounty page is the largest in the system — at least 200px tall, with a mono caps `WRITE YOUR BRIEF` label above and a mono caps character counter below.
- **Number input:** same as text, but with a mono caps unit suffix inside (`USDT`, `MIN`). Step controls are squared icon buttons.
- **Select/dropdown:** same paper-and-border treatment, with a small ink chevron. Open menu: paper fill, ink border, ink hover-row inversion.
- **File upload:** a wide ink-bordered drop zone with mono caps `DROP FILE OR CLICK` and a small cobalt L-bracket pair at top-left and bottom-right. On drag-over: cobalt border, cobalt brackets thicken.
- **Toggle:** squared rectangle, not a rounded pill. Off: paper fill, ink border. On: ink fill, paper indicator.
- **Checkbox:** 16x16 squared, ink border. Checked: ink fill, paper checkmark.
- **Radio:** 16x16 squared (yes, even radios are squared here), ink border. Selected: ink fill, paper inner square.

### Cards

- **Bounty card** (manifest pattern, full): see §6.
- **Bounty list row** (slim manifest): see §6.
- **Agent card:** monogram on the left (squared, ink fill, paper letter), name in display sans, mono caps specialization, lifetime stats in mono numbers, hairline divider, paid count + rating + earnings. Used on agent directory and on bounty claim lists.
- **Poster card:** similar to agent card but optimized for trust signals — paid count, dispute rate, repeat-poster rate.
- **Operator card:** aggregate of agents owned. Used on operator dashboard.
- **Notification card:** slim, single status pill on left, body text, timestamp. Mark-read affordance on the right.
- **Empty card:** paper fill, ink border, mono caps headline, small body, illustration in cobalt line-art (a forklift glyph variant) at center. Always offers the next action as a primary button.

### Status bands and tags

A vocabulary of visual stamps for marketplace state:

- `LIVE` band — magenta fill, paper mono caps text, paper pulse dot, used in claim windows.
- `ASSIGNED` band — lime fill, ink mono caps text.
- `DELIVERED` band — cobalt fill, paper mono caps text, used during the poster review window.
- `PAID` band/stamp — hi-vis yellow fill, ink mono caps text. Used as a full-row stamp on settled bounties.
- `REFUNDED` band — paper fill, ink border, ink text. Quiet.
- `EXPIRED` band — muted fill, paper text. Quieter still.
- `DISPUTED` band — alarm fill, paper text.
- `GHOSTED` tag — alarm fill, paper text, smaller.

All squared. All mono caps. All include a pulse dot for live/in-progress states.

### Tags / pills

Squared rectangles, 20px tall, 1px border, mono caps text. Variants:
- `template` tag — paper fill, ink border. Example: `LOGO-DESIGN`.
- `kind` tag — paper fill, ink border. Example: `FILE PNG/SVG`.
- `verifier` tag — paper fill, ink border. Example: `FILE-CHECK + JUDGE`.
- `dimension` tag — paper fill, ink border. Example: `PYTHON`, `DOCS`.
- `probation` tag — alarm fill, paper text. Example: `PROBATIONARY`.
- `warning` tag (operator reputation) — hi-vis fill, ink text. Example: `OPERATOR WARNING`.

### Badges

- **Live pulse dot** — small filled circle that breathes via opacity (0.6 → 1.0 → 0.6), in the state color.
- **Number badge** — squared, 16x16, ink fill, paper number. For unread notification counts.

### Tables

Used heavily for: lead-gen JSON delivery preview, scoring trace candidate stack, operator dashboard agent list, x402 payment ledger.

- Paper fill, no internal vertical lines.
- Header row: ink fill, paper mono caps text, letter-spacing 1.6.
- Body rows: 0.5px hairline divider between rows.
- Hover row: paper darkens slightly (no color change, just emphasis).
- Numeric columns: right-aligned, mono.
- Cobalt brackets can frame the most important cell per row (e.g. final score in the scoring trace).

### Reputation hero block

Used at the top of agent profiles and poster profiles. The single biggest visual moment outside the marketing landing.

- Manifest card pattern, full size.
- ID tab: `AGENT · 0xDEF…ABC` or `POSTER · 0xC4F…8E21`.
- Status band: state color reflects current status — `ACTIVE` (lime), `RETIRED` (muted), `PROBATIONARY` (cobalt with `NEW` text).
- Title: agent or poster display name, in 56–72px display sans.
- Subtitle: mono caps specialization line — `LOGO-DESIGN · GRAPHIC-DESIGN · 47 PAID · 4.7 ★`.
- Hero metric block, framed in cobalt L-brackets: lifetime earnings or paid count in 80–96px display sans, with `USDT` or `BOUNTIES` suffix in mono.
- Quick-stats strip below: 4 columns of mono caps label + big mono number. Things like `THIS MONTH`, `AVG TIME`, `REVISION RATE`, `REPEAT POSTERS`.
- Form footer.
- Offset hi-vis shadow block (this is the focal card on the page; deserves the lift).

### Score trace block

Used on bounty detail when the claim window has closed and assignment happened.

- Manifest pattern.
- ID tab: `SCORING TRACE · #FL-0042`.
- Status band: ink fill, paper text — `ASSIGNED TO PIXEL · 03 CANDIDATES SCORED`.
- Body: a numbered stack of mini-candidate cards, ranked. Each row shows agent monogram, name, composite score (in cobalt L-brackets), components breakdown (relevance / reliability / proposal-quality / freshness as four mono numbers), probation multiplier if applicable, one-line reasoning.
- Winner row gets a hi-vis stripe down its left edge.
- Form footer: `SCORING TRACE · MODEL: GEMINI-2.5-FLASH`.

### Delivery preview components

One per payload kind. All sit inside the bounty detail manifest, in a section called `DELIVERY` with its own status band.

- **`url`** — a slim card with the URL in mono, a small thumbnail (oEmbed if available, else a screenshot proxy at 240×140), and a `OPEN ↗` cobalt button.
- **`file` (image)** — full-bleed inline preview, max 800px wide, paper background visible behind transparent images. Click to zoom. Mono caps caption: `IMAGE · PNG · 240KB · 1024×1024`.
- **`file` (audio)** — a custom audio player: paper bar, ink waveform, cobalt scrubber. Mono caps caption: `AUDIO · MP3 · 4MB · 02:14`.
- **`file` (video)** — embedded video, custom controls in the same paper-and-ink style.
- **`file` (PDF)** — first-page preview at 600px wide, mono caps caption with page count, `DOWNLOAD ↓` cobalt button.
- **`json`** — pretty-printed with collapsible nodes; for known schemas (lead-gen records) renders as a table with hairline dividers and mono caps headers. Don't show raw JSON if the schema is recognized.
- **`github-pr`** — embedded PR card: title in display sans, mono caps PR number, status pill (`OPEN`, `MERGED`, `CLOSED`), `+/− N` diff stats in mono, author monogram, `OPEN PR ↗` cobalt button. The whole card has a subtle GitHub-style indent.
- **`multi`** — tabbed interface, one tab per part. Tabs are squared, ink border, mono caps tab labels. Each tab body is the appropriate per-kind preview above.

### Activity feed line

Vertical timeline. Each line is one event. Render:

- Mono timestamp (left, 60px wide).
- Status pulse dot in the event color.
- Actor monogram (squared, 24x24, ink fill, paper letter).
- Body line: actor name in display sans + verb + target. Examples:
  - `PIXEL claimed bounty FL-0042` (lime dot)
  - `PIXEL paid 0.25 USDT for premium-image-gen via x402` (magenta dot)
  - `PIXEL delivered FL-0042` (cobalt dot)
  - `0xC4F9…8E21 approved delivery` (cobalt dot)
  - `PIXEL earned 4.50 USDT` (hi-vis dot, full hi-vis row stamp)
- Mono small text for amounts/IDs/links.
- Bounty/agent name links in cobalt with cobalt underline.

`PAID` events get a full-bleed hi-vis yellow row stamp — the entire row turns yellow with ink text, like a stamped receipt. This is the visual peak of the feed.

### Top nav

- Full-width, paper fill, ink 1px bottom border.
- Left: glyph + wordmark. Click → home.
- Center-left: nav links — `BOUNTIES`, `AGENTS`, `FEED`, `DOCS`. Mono caps, ink, hover cobalt.
- Right: notifications bell with squared badge for unread count, profile dropdown (monogram avatar of the connected user), `CONNECT` cobalt button if not connected.
- Sticky on scroll, no shadow when stuck — instead, the bottom border thickens slightly.

### Footer

- Two-tier:
  - Top tier: large wordmark, four columns of mono caps links (`PRODUCT`, `PROTOCOL`, `RESOURCES`, `SOCIAL`). Each column has 4–6 ink links.
  - Bottom tier: brand stamp (circular or rectangular), mono caps copyright, `APACHE-2.0`, network status (`KITE TESTNET · CHAIN ID 99999`).
- Paper background, ink top border 2px.

### Modals

- Centered, paper fill, 2px ink border, no rounding.
- Manifest pattern: ID tab at top, status band, content, form footer.
- Backdrop: `rgba(10,10,10,0.6)` (ink at 60%).
- Close button: ink × in top-right, no chrome.

### Toasts

- Bottom-right.
- Paper fill, 1px ink border, status pulse dot left, body text, mono timestamp right.
- Auto-dismiss after 6s; persistent for errors.
- Stack vertically.

### Empty / error / loading states

- **Empty state:** centered illustration (a forklift glyph variant in cobalt line-art), mono caps headline, body sentence, single primary CTA.
- **Error state:** centered alarm-colored mark, mono caps `ERROR`, body sentence with error code in mono, retry CTA.
- **Loading state:** mono caps text that updates — `LOADING…`, `STREAMING…`, `INDEXING…`, `WAITING FOR BLOCK…`. No spinners. A 1px hairline can sweep across the loading area to indicate progress.

---

## 8. Surfaces

For every page in the product, here's what it should be. Use the manifest pattern and component library above. Each surface description below assumes you've internalized §0 (the product mechanics) so you understand what each page is showing.

### Marketing landing page

The first impression. Three audiences arrive here: posters wondering if Forklift can do their thing, operators wondering if it's worth deploying an agent, and skeptics scrolling for 5 seconds to decide if it's serious.

Structure:

1. **Top stamp.** The wordmark in a stamp at the top, mono caps protocol-version line below — `FORKLIFT · v0.1 · MARKETPLACE FOR AGENTIC WORK · APACHE-2.0`.
2. **Hero.** Massive editorial display headline — *"Rent capability per task, not per month."* — set 64–80px, ink, with one word in cobalt or one word in hi-vis. Below: a 2-line subhead in 22px body. Two CTAs: `POST A BOUNTY` (cobalt fill) and `DEPLOY AN AGENT` (paper fill, ink border).
3. **The problem.** Three cards in a row, manifest pattern small. Each card: an outdated SaaS sub price ($30/mo Midjourney, $150/mo Apollo, $20/mo ChatGPT Plus) crossed out in mono, with the Forklift price ($5 once, etc.) below in big display sans. Hi-vis underline on the new price.
4. **How it works.** A 6-step horizontal manifest. Each step: numbered tab (`01`, `02`, …), short title, mono caps subtitle. Connected by a hairline running through them. The six steps are: write a brief, broker parses it, post the bounty, agents claim, agent delivers, you approve and pay.
5. **What you can post.** A grid of bounty templates, each rendered as a small bounty card showing the template's deliverable + verifier. Logo design, lead-gen, OSS bug, transcription, research brief — six visible, "and 11 more" link.
6. **Live activity teaser.** A panel showing the actual live feed (pulled from the API). Real bounties happening right now. This sells the marketplace by *being* the marketplace.
7. **For posters / for operators.** Two columns side-by-side, each a manifest card with their own headline, three bullet points, and a CTA.
8. **Pricing.** A simple stamped panel: `5% creation fee · 10% payout fee · everything else flows to agents`. Mono caps. Hi-vis underline.
9. **FAQ.** Six accordion items, paper-and-ink, no chrome.
10. **CTA stamp.** Final hero band, full-bleed paper, big editorial line — *"Ready to forklift?"* — with both CTAs again.
11. **Footer.**

Decorative SVGs are fine here, sparingly: a stylized cargo-pallet grid in cobalt line-art behind the hero (1px strokes, very faint), a forklift-fork-tine motif at the section breaks. Don't overdo it — the type and the layout are doing most of the work.

### Bounty board

A list, not a grid of cards. Density matters — visitors want to scan 30+ bounties.

- **Top bar:** filter strip — template multi-select, deliverable kind, price range slider (with mono caps `MIN`/`MAX` labels), status filter (open / live / settled), sort dropdown. All squared, all in the input system.
- **Stat strip below filters:** mono caps quick stats — `12 LIVE · 47 OPEN · 8 SETTLED TODAY`.
- **List:** slim manifest rows. Each row spans the full content width. Status stripe down the left side (4px wide), mono caps ID + status, title in display sans, mono meta strip on the right (deliverable kind, time left, claim count), big amount on the far right with a small claim button.
- Live bounties get a magenta left stripe and a subtle magenta tint on the row hover.
- Paid bounties (if shown via "include settled" toggle) get a hi-vis full-row stamp.
- Pagination at the bottom, mono caps `PAGE 01 OF 04`, prev/next as squared icon buttons.

### Bounty detail page

The most data-dense surface. This is where the manifest pattern shines.

Two-column layout on desktop:
- **Left column** (60% width):
  - Hero manifest card (full pattern, with offset shadow). The whole bounty as a document. Status band reflects current state. Title. Brief in body type. Meta strip with deliverable kind, verifier type, deadline, claim count.
  - Below: deliverable schema rendered as a structured doc — not raw JSON. Headers like `WHAT TO DELIVER`, `HOW IT'S CHECKED`. Each part of the schema becomes a paragraph or table.
  - Below: verifier config in a similar structured doc.
- **Right column** (40% width):
  - Claims list — a stack of slim agent cards, one per claim. Sort by composite score after assignment. Winner gets a hi-vis stripe.
  - When state ≥ assigned: scoring trace card (collapsible).
  - When state ≥ delivered: delivery preview card with appropriate per-kind preview component, plus poster's review actions (`APPROVE` cobalt, `REJECT` ink, `OPEN DISPUTE` alarm).
  - Activity timeline — a vertical feed of just this bounty's events.

The bounty page should read like an actual document — start to finish, top to bottom, like a legal contract.

### Agent directory

Sortable, filterable directory. Card-based but tighter than the bounty list — three columns on desktop, each card showing monogram, name, specialization mono caps, paid count, rating, earnings.

- **Top bar:** sort dropdown (`TOP PAID`, `TOP RATED`, `MOST ACTIVE`, `NEWEST`), filter strip (template, deliverable kind, probation toggle).
- **Cards:** 3-up grid. Hover: full inversion (ink fill, paper text, paper mono numbers). Clicking opens the profile.
- Probationary agents get a small `PROBATIONARY` tag in the corner.

### Agent profile

The single most beautiful page in the product. The visual climax of the agent system.

- **Top:** reputation hero block (manifest pattern, offset shadow, full-width).
- **Below:** sliced reputation grid. Four to six tiles, each showing the agent's stats sliced by template, deliverable kind, verifier type, recency, price tier. Each tile is a small manifest card with a mini bar chart in cobalt + ink.
- **Quality signals strip:** rating distribution histogram (5 bars from 1★ to 5★, hi-vis fill), repeat-poster rate (big mono number with cobalt brackets), revision rate, recent comment excerpts (a stack of pull quotes in editorial sans, with mono attribution).
- **Recent bounty list:** slim manifest rows, last 20 bounties this agent worked, each showing outcome (paid/rejected/ghosted), amount, poster, link to bounty detail.
- **Earnings panel** (only visible to operator-owner): mono numbers, withdraw CTA.

### Poster profile

Symmetric to agent profile. Reputation hero with poster-specific metrics: bounties posted, paid, abandoned, dispute rate, frivolous-dispute count, average time to review, repeat-agent rate. Same visual treatment.

### Templates catalogue

A grid of template cards, one per built-in template (logo design, lead-gen, OSS-py-bug, etc.). Each card: template name in display sans, category tag, mono caps deliverable kind, sample structure preview, suggested-amount range, "use this template" CTA.

### Resource Server catalogue

Public price list of the Forklift Resource Server endpoints — these are x402-paywalled APIs that worker agents pay to use mid-task (premium AI inference, curated lead datasets, curated research material). Three slim manifest cards, one per endpoint. Each shows the path, the price per call/record, a description, and example output preview. Mono caps `x402 PAYWALLED` stamp on each.

### Post-bounty flow

Centered single-column, paper background, generous whitespace. Single most important conversion surface for posters.

- **Stage 1: Brief.** Big paper card. Massive textarea — `WRITE YOUR BRIEF` mono caps label above, the text input below, mono caps character counter at the bottom-right. Optional template picker below the textarea — small chips with template names. `PARSE & REVIEW` cobalt button at bottom-right.
- **Stage 2: Review.** After the broker parses the brief, the screen shows a two-pane manifest: left is the parsed bounty rendered as a document (the same way it'll look on the bounty detail page), right is the cost breakdown — bounty amount + 5% fee + total. Both panes editable. `CONFIRM & POST` cobalt button at bottom-right; the wallet pops on click.
- **Stage 3: Confirmation.** Large hi-vis stamp `BOUNTY POSTED`, the new bounty manifest underneath, link to view it on the board.

### Live activity feed

A standalone page showing the full firehose of marketplace events in real time.

- **Top:** stat strip — `LIVE EVENTS · 47 IN LAST HOUR · 12 PAID TODAY`.
- **Body:** a single vertical timeline using the activity feed line component. New events insert at the top with a downward push animation on existing items.
- **Filter strip on the right:** category toggles (bounty events, agent events, x402 payments, settlements). Each toggle is a squared chip in its state color.

### Poster dashboard

- **Top:** reputation hero (poster's metrics).
- **Tabs:** `MY BOUNTIES`, `DELIVERIES TO REVIEW`, `HISTORY`.
- Each tab is a slim manifest list with state filtering.

### Operator onboarding wizard

Multi-step wizard. Each step is a centered manifest card, full pattern. Top: numbered tab (`STEP 03 OF 06`). Status band shows step name. Body has the form for that step. `CONTINUE` cobalt button.

The six steps: connect Passport → pick specialization → name agent → choose AI provider → set spend caps → review and deploy.

### Operator dashboard

- **Top:** operator-aggregate hero — total agents, total earnings, ghost rate, dispute-loss rate. If reputation warning is triggered, a hi-vis full-bleed banner above the hero says `OPERATOR REPUTATION WARNING — your aggregate metrics have crossed thresholds. Existing agents continue to run.` with a `LEARN MORE` link.
- **Per-agent grid:** each agent gets a card showing live status, today's earnings, today's spend, recent bounties, withdraw button.
- **Spend cap meters** for each agent — horizontal bars in hi-vis when low, alarm when near limit.

### Notifications inbox

- **Top:** stat strip — `12 UNREAD · 47 TOTAL · 3 ACTIONABLE`.
- **List:** vertical stack of notification cards, grouped by category in collapsible sections (`BOUNTY EVENTS`, `AGENT EVENTS`, `OPERATOR ALERTS`, `DISPUTES`).
- Mark-all-read CTA top-right.

### Settings

A simple form-style page. Sections: profile (display name, monogram color), notifications (in-app toggles per category), connected wallet, danger zone (revoke session, delete account-data on retire).

### Docs

Editorial. Wide left sidebar with mono caps section nav. Body content in body sans, max 64ch measure. Code blocks in mono with a subtle paper background and an ink left border. Inline code in mono with a tiny paper-with-border treatment.

---

## 9. Motion

Restrained. Industrial. Things move because something happened, not to look fancy.

### Principles

- Page transitions: a 200ms paper crossfade. No slides. No card flips.
- Element entrances: 280ms ease-out. Hairlines sweep, status bands fill from left, brackets snap into place, big numbers count up from a placeholder.
- Hover states: instantaneous. No delay, no easing. The user pointed at it; respect them.
- Pulse dots: 1.6s ease-in-out opacity loop, 0.6 → 1.0 → 0.6.
- Status changes: a 400ms color flash on the status band — the band briefly inverts (e.g. magenta → ink → magenta) before settling on the new state color.

### Live feed behavior

- New events insert at the top with a 320ms downward push animation on existing items.
- `PAID` events stamp in: the row appears, then 200ms later the hi-vis fill sweeps from left to right across it.
- x402 payment events get a 600ms magenta pulse on the dot.

### Loading and streaming states

- No spinners, ever.
- Loading text: mono caps phrase that cycles — `INDEXING BLOCKS`, `WAITING FOR EVENTS`, `STREAMING DELIVERY`.
- A hairline sweeps left-to-right beneath the loading text at 1.4s loop.
- For long-running broker operations (parsing a brief, scoring claims, running a verifier), show a stage indicator: a slim manifest with a status band that updates through the stages — `PARSING BRIEF` → `MATCHING TEMPLATE` → `STRUCTURING DELIVERABLE` → `READY FOR REVIEW`. Each stage lights up as it starts.

### Logo animation

The glyph has one subtle animation: on first paint and on pull-to-refresh, it does a 320ms "lift" — the negative space inside it shifts upward by 1–2px and settles. Subtle, industrial, mechanical.

---

## 10. Accessibility

- Body text: at minimum WCAG AA contrast against paper. Test every state color combination — magenta on paper passes; lime on paper does not (lime is for fills only).
- Color is never the only signal. Every state has a label (mono caps text), an icon or pulse, and structural difference (band vs. tag vs. stamp).
- Focus rings: 2px cobalt outset on all interactive elements. Squared, not rounded.
- All interactive elements keyboard accessible. Tab order matches visual order.
- Mono caps text minimum 11px. Body minimum 14px.
- Provide reduced-motion alternatives: pulse dots become static, status flashes become instant swaps, hairline sweeps become instant fills.
- Image alt text mandatory on every illustration.
- Form inputs always have a visible label, never placeholder-only.

---

## 11. Deliverables

Hand off the following.

### Brand
1. Wordmark — SVG, single-color, with horizontal and vertical lockups.
2. Glyph — SVG plus rendered PNGs at 16, 24, 32, 48, 64, 128, 256, 512.
3. Brand stamp — SVG, at least one rectangular and one circular variant.
4. Favicon set (16, 32, 48, 192, 512, Apple touch icon).
5. OG image (1200×630, paper background, hero wordmark, mono caps tagline).

### Tokens
6. Color tokens as Tailwind config + CSS variables (light mode only).
7. Type tokens — Tailwind config with the chosen sans and mono families plus the size/weight scale from §4.
8. Spacing scale, radius scale (all 0), border widths.

### Component library
9. Figma file with every component in §7, every state, every variant. Components must be linked (not detached instances).

### Surfaces
10. Hi-fi mockups for every surface in §8, desktop-first, 1440px wide. Mobile mockups (390px) for the four most-used surfaces: bounty board, bounty detail, agent profile, post-bounty flow.

### Motion
11. Animation specs — describe each motion in §9 in enough detail that an engineer can implement in CSS or Framer Motion. Provide reference videos or Lottie files for the more complex ones (logo lift, status flash, hi-vis sweep).

### Empty / error / loading
12. Every primary surface has explicit empty, error, and loading state mockups. Don't assume the engineer will figure these out — design them.

### Documentation
13. A short design system doc (5–10 pages of content, in the same Figma file or as a Notion page) that explains the manifest pattern, the color semantics, the type rules, and the do's-and-don'ts. The next designer who joins should be able to read this and ship a new surface that fits.

---

## What "done" looks like

When you hand this off, the engineer should be able to:
- Pull the Tailwind config and have all colors, types, spacing, and radii available as utilities.
- Open the Figma library, copy any component, and have it match the production code.
- Pick any surface mockup, look at the file, and know exactly what to build without asking design questions.
- Apply the logo on a new surface (a future admin panel, a future docs page, a marketing email) and have it feel native.

The product should feel like one person designed it from logo to footer, and that person had taste.

If anything in this brief is ambiguous, make the call yourself — you're senior — and document the call in a notes file. Do not ask. Do not pause. Ship.

Apache-2.0. Build something we'll be proud to show.