# Foundations

Every value here is lifted from `tokens/tokens.css`, which is the single source of
truth. If this document and that file disagree, the file wins — and `generators/export-tokens.py`
will fail if they ever drift.

---

## The one idea

**Meritalien is about a movement: origin → destination.** Talent is somewhere;
opportunity is somewhere else; the work is the line between.

That idea is not decoration, it is the layout grammar. `from → to` shows up as the
route readout, the two-country comparison, the doors, the globe arcs. When you build
something new in this system, ask what the *from* and the *to* are. If neither
exists, you are probably building the wrong thing.

---

## Colour

Two families and one signal.

### Ink — the dark surfaces

| Token | Hex | Used for |
|---|---|---|
| `--ink-900` | `#0b0b0c` | Hero, footer, the deepest band |
| `--ink-800` | `#131315` | Dark bands inside a page |
| `--ink-700` | `#1c1c1f` | Raised surfaces on ink |
| `--ink-600` | `#26262a` | Hairlines on ink |

### Paper — the light surfaces

| Token | Hex | Used for |
|---|---|---|
| `--paper-100` | `#fbfaf8` | The page itself |
| `--paper-200` | `#f3f1ed` | Alternating band |
| `--paper-300` | `#e9e6e0` | Pressed, inset, empty states |

The paper is deliberately warm (`#fbfaf8`, not `#ffffff`) and the ink is deliberately
not-quite-black (`#0b0b0c`). Pure white on pure black reads as a default; this reads
as a decision.

### Text

| Token | Hex | Used for | Contrast on paper |
|---|---|---|---|
| `--text` | `#0b0b0c` | Body | 19.6:1 |
| `--text-muted` | `#5f5b55` | Secondary | 6.1:1 |
| `--text-faint` | `#6e6a63` | Eyebrows, captions | 5.1:1 |
| `--text-invert` | `#fbfaf8` | Body on ink | 19.6:1 |
| `--text-invert-muted` | `#a8a49c` | Secondary on ink | 7.4:1 |

> **`--text-muted` and `--text-faint` are warm greys, never neutral.** An earlier
> build used `#6e6a63` for muted and `#9a958c` for faint. Both failed WCAG AA when
> measured — 3.66:1 and 2.85:1 against a required 4.5:1 — and the faint value was
> genuinely unreadable at 11px. Both were darkened. If you add a grey, measure it.

### Signal — the accent

```
--accent       #00e07a    on ink surfaces
--accent-ink   #00854a    AA-contrast variant, for paper surfaces
--accent-wash  rgba(0,224,122,.14)
--accent-line  rgba(0,224,122,.34)
```

**This is load-bearing. It appears on exactly three things and nowhere else:**

1. the word "**borders**" in the hero
2. the globe arcs
3. the primary CTA

> "If it shows up a fourth place, the accent stops meaning *go*."

That comment is in the token file itself, and it is the single most important rule in
this kit. The green is not a highlight colour. It is a signal, and a signal only works
if it is scarce. On a new surface, pick your three carries and refuse a fourth.

Note the two variants. `#00e07a` on paper is only 2.0:1 — it fails contrast badly for
text, though it is fine for a 1px rule or a filled button with dark text on it. When
the green must be *read* on paper, use `--accent-ink` (`#00854a`).

### Lines

```
--line                 rgba(11,11,12,.12)     hairlines on paper
--line-strong          rgba(11,11,12,.22)     borders that must read
--line-invert          rgba(251,250,248,.14)  hairlines on ink
--line-invert-strong   rgba(251,250,248,.28)
```

Every divider on the site is a 1px hairline. There are no 2px borders and no shadows
doing a line's job.

---

## Typography

Three families, and each has a **job**. This is the part people get wrong.

| Family | Role | Files |
|---|---|---|
| **Geist** | Structure, data, UI, buttons | Regular 400, Medium 500, SemiBold 600, Bold 700 |
| **Newsreader** | Statements — anything that *says* something | Regular, Italic |
| **Departure Mono** | Eyebrows, labels, numbers, route readouts | Regular |

> **Serif never touches the H1.** Geist sets every headline. Newsreader carries the
> voice: pull-quotes, the lead paragraph, the `from → to` line. Mono is the register
> for machine-facts — an eyebrow, a stat label, a city pair.

All three are open-source and free for commercial use. Licences ship in `assets/fonts/`.
Geist and Newsreader are OFL-1.1; **Departure Mono is MIT**.

### The scale

Fluid, one ratio, no arbitrary sizes:

| Token | Value | px at 1440 |
|---|---|---|
| `--t-display` | `clamp(2.75rem, 7.4vw, 5.75rem)` | 92 |
| `--t-h1` | `clamp(2.1rem, 5vw, 3.5rem)` | 56 |
| `--t-h2` | `clamp(1.75rem, 3.7vw, 2.75rem)` | 44 |
| `--t-h3` | `clamp(1.125rem, 1.5vw, 1.375rem)` | 22 |
| `--t-lead` | `clamp(1.0625rem, 1.45vw, 1.3125rem)` | 21 |
| `--t-body` | `1.0625rem` | 17 |
| `--t-small` | `0.875rem` | 14 |
| `--t-mono` | `0.78125rem` | 12.5 |

Line heights: display `.98`, heading `1.08`, lead `1.45`, body `1.62`.
Tracking: display `-.035em`, heading `-.022em`, mono `+.16em`.

Two things worth understanding:

- **The hard negative tracking on display type** (`-.035em`) is what makes a 92px
  headline look set rather than scaled. Large type needs tighter spacing, not looser.
- **Mono needs positive tracking** (`.16em`). Uppercase mono at small sizes smears
  together; the extra space is what makes an eyebrow legible.

### The eyebrow

The most-reused pattern on the site, and the one most likely to be copied wrong:

```css
.eyebrow {
  font-family: var(--font-mono);
  font-size: var(--t-mono);          /* 12.5px — was 11px, too small */
  letter-spacing: var(--tr-mono);    /* +.16em */
  text-transform: uppercase;
  color: var(--text-faint);          /* on paper */
}
.on-ink .eyebrow { color: var(--text-invert-muted); }
```

That `.on-ink` override is not optional. A paper-context eyebrow colour on an ink
surface measured **2.92:1** — invisible. Every dark surface must restate its text
colours.

---

## Space

4px base. Do not invent off-scale values.

```
--s-1 .25rem   --s-2 .5rem    --s-3 .75rem   --s-4 1rem
--s-5 1.25rem  --s-6 1.5rem   --s-8 2rem     --s-10 2.5rem
--s-12 3rem    --s-16 4rem    --s-20 5rem    --s-24 6rem     --s-32 8rem
```

### Section rhythm

```css
--band-y:    clamp(2.75rem, 9vw, 8.5rem);   /* vertical band padding */
--shell-x:   clamp(1.25rem, 4vw, 3rem);     /* horizontal gutter */
--shell-max: 76rem;                          /* 1216px content max */
```

`--band-y`'s minimum is deliberately small (44px) because phones were paying **144px
per section** — about 1.4 screens of pure padding across the homepage. The `9vw` term
takes over from roughly 490px up, so the desktop rhythm is unchanged by that fix.

---

## Radii — exactly two

```css
--r-sm: 4px;    /* compact: nav, tags, data */
--r-lg: 10px;   /* large: media, panels, cards */
```

No third radius. A system with four corner radii has no corner language.

---

## Grid and breakpoints

**Three breakpoints, and no `min-width` queries anywhere.**

| Tier | Width | Meaning |
|---|---|---|
| `30rem` | 480px | Small phone |
| `40rem` | 640px | Phone → large phone |
| `48rem` | 768px | Large phone → tablet |
| `60rem` | 960px | Tablet → desktop |

The site is desktop-first: base styles are desktop, and `max-width` queries unwind
them. Four tiers is the documented set — **treat a fifth value as a review flag.**

The original build had **six** ad-hoc breakpoints (40/44/48/60/62/64rem), five of them
clustered uselessly between 960–1024px, and the smallest at 640px — which meant every
phone from 320–639px got one identical layout. That is the whole reason the site "did
not adjust to all screen sizes". Consolidating was the fix.

Content max width is `--shell-max` (1216px), gutters are `--shell-x`.

---

## Accessibility floor (not optional)

Two WCAG AA criteria govern layout here, and the site failed both before the mobile
rebuild:

- **SC 1.4.10 Reflow** — no two-dimensional scrolling at **320 CSS px**, which the W3C
  defines as *a 1280px viewport at 400% zoom*. This is a low-vision requirement, not a
  small-phone nicety. There were 6 overflowing elements on every page.
- **SC 2.5.8 Target Size** — interactive targets at least **24×24 CSS px**. The site
  targets **44px** on `@media (pointer: coarse)`, which clears the standard and matches
  Apple's HIG.

Also non-negotiable: every text/background pair must measure ≥4.5:1. Measure it, do not
eyeball it — three separate contrast bugs shipped in this project because values
*looked* fine.
