# Components

The reusable vocabulary. Class names live in `assets/css/{base,components,extra}.css`.

> **Read this first:** `extra.css` loads last and overrides some values in
> `components.css` — most notably `.tag` (10px → 12px) and `--t-mono` (11px → 12.5px).
> Where the two disagree, **`extra.css` is the effective value** and is what this
> document states.

The reason for the override layer is that the mobile rebuild had to correct values
found by measurement, and patching a live system was safer than rewriting it. It is a
known smell: if you build something new, prefer putting correct values in
`components.css` directly.

---

## Layout primitives

```css
.shell          /* content column: max --shell-max (76rem), gutter --shell-x */
.band           /* a page section: padding-block --band-y */
.band--ink      /* dark section */
.band--ink-800  /* second dark level */
.band--paper-200/* alternate light section */
.band--tight    /* reduced vertical rhythm */
.rule           /* 1px hairline */
.stack          /* vertical rhythm between children */
.stack-lg
```

**Page rhythm:** ink for hero and footer, paper for the body, with `band--ink` insets for
contrast moments. Alternate dark and light — five identical light sections have no spine.

```html
<section class="band">
  <div class="shell">
    <p class="eyebrow">The system</p>
    <h2 class="display">Four layers. One journey.</h2>
    <div class="grid grid-3"> … </div>
  </div>
</section>
```

### Grids

```css
.grid       .grid-2      .grid-3      .grid-4
```

`.grid-3` and `.grid-4` drop to 2 columns at `60rem`, and **all grids collapse to one
column at `40rem`** — not `48rem`. At 768px a one-column grid produced 1,015px-tall
cards and an 11,233px page. Collapse at the phone breakpoint, not the tablet one.

---

## Type roles

```css
.eyebrow   /* mono, 12.5px, +.16em, uppercase, --text-faint */
.display   /* the largest statement size */
.lead      /* serif, --t-lead */
.mono      /* mono register */
.small
.sec-head  /* section header block */    .sec-head--wide
.pager
```

Every dark surface must restate its text colours:

```css
.on-ink .eyebrow { color: var(--text-invert-muted); }
```

Skipping this shipped an eyebrow at **2.92:1** — effectively invisible.

---

## Buttons

```css
.btn                /* base */
.btn--primary       /* accent fill. The ONLY green button. */
.btn--ghost         /* outline, for ink surfaces */
.btn--quiet         /* outline, for paper surfaces */
.btn--glass         /* translucent + blur, over media */
.btn--xl            /* hero scale */
.btn__arrow         /* the → glyph */
.btn-row
```

| Class | Spec |
|---|---|
| `.btn` | inline-flex, gap `--s-2`, radius `--r-sm` (4px), Geist 14px/500, tracking `-.01em`, padding `0 --s-4` |
| `.btn--primary` | `--accent` fill, `--ink-900` text, weight 600, hover `#00c96b`. Height 50px in the hero. |
| `.btn--ghost` | border `--line-invert-strong`, text `--text-invert`, hover `rgba(251,250,248,.08)` |
| `.btn--quiet` | text `--text`, border `--line-strong`, hover inverts to ink |
| `.btn--xl` | 52px tall, padding `0 --s-6`, radius `--r-lg`, 16px/500 |

```html
<a class="btn btn--primary" href="/discover/pathways/">Find your route
  <span class="btn__arrow" aria-hidden="true">→</span></a>
```

- Buttons are **16px apart** in a `.btn-row`.
- Label is **verb + object, two words**: "Find your route", "Know where you can go".
- `.btn__arrow` is always `aria-hidden` — the arrow is decoration, not meaning.
- On touch devices buttons grow to a 44px minimum target.

---

## Nav

```css
.nav  .nav__inner  .nav__mark  .nav__links  .nav__link
.nav__right  .nav__toggle  .nav__drawer
```

- **Default state is solid.** Only a page with a dark hero opts into transparency via
  `data-solid-after="#hero"`. Pages without a dark hero ship `is-solid` in the markup.
- **`is-solid` is load-bearing** — it flips the hairline and the text colour. ~90 pages
  shipped without it and rendered an invisible menu. If you add a template, confirm
  which state its nav ships in.
- **Partially visible on mobile by design:** wordmark + primary CTA + hamburger from
  340px up. Hiding navigation entirely cuts discoverability almost in half (NN/g), so
  only ≤336px falls back to wordmark + toggle.
- Drawer rows are 48px; `aria-expanded` is managed; links close it on tap.

---

## Cards

```css
.card  .card__body  .card__foot  .card__kicker  .card__title  .card--path
```

`.card` is a grid, `gap --s-3`, padding `--s-6`, `--paper-100` fill, `--line` hairline,
`--r-lg` radius. Hover lifts it `-3px` with `--shadow-lift`.

The hover lift is a **desktop affordance** — on touch there is no hover, so the resting
state must already read as interactive. Never rely on hover to reveal something.

---

## Data and labels

```css
.stat  .stat__num  .stat__label
.table-wrap
.srclist
.tag  .tag--accent
.chip  .chips
```

- `.stat__num` — Geist, `clamp(2rem, 4vw, 3rem)`, weight 500, tracking `-.035em`, line-height 1
- `.tag` — mono, **12px** (overridden from 10px), `+.12em`, uppercase, `4px 8px` padding, `--r-sm`. `.tag--accent` uses `--accent-line` border and `--accent-ink` text.
- `.chips` / `.chip` — the filter rail on the stories index. 44px tall on touch.

**Every stat carries a source.** `.srclist` exists for this. A number without a source
and a date does not go on a page.

---

## Contrast pairs — the brand's signature

```css
.fromto  .fromto__from  .fromto__to  .fromto__track
.doors  .doors--row  .doors--stacked  .doors--stages  .door
.door__num  .door__name  .door__q  .door__desc  .door__meta  .door__arrow
```

These are the components that express the core idea — origin → destination. `.fromto` is
a two-track comparison; `.doors` is a row of choices that stack on mobile.

**`fromto` is the one to reach for** on any new surface about a before/after or a
before/after route. It is the most on-brand component in the kit.

> **Trap:** a component variant inherits the *whole* base rule, not just the properties
> you change. `.doors--row .door` sets explicit `grid-column` placements; resetting only
> the children when collapsing to one column leaves the base `grid-template-columns`
> alive and the content overflows its track by 40px. Reset the template **and** the
> placements.

---

## Media

```css
.hero  .hero__inner  .hero__h1  .hero__sub  .hero__actions  .hero__row
.hero__media  .hero__video  .hero__scrim  .hero__media-fallback  .hero__scroll
.marquee  .marquee__track  .marquee__row  .marquee__row--rev
.portrait  .portrait--lg  .portrait--mono
.globe-stage  .globe-stage__readout
```

- **`.hero__media` is a full-bleed layer** with a gradient `.hero__media-fallback` that
  `:has()` hides once real media is present.
- **`.hero__scrim`** is why headline text stays legible over footage. Do not remove it.
- **Portraits size to 1100px max.** They shipped at up to 3223px and 27.7MB total;
  the largest real display size is 542px.
- **`.marquee`** needs `overflow: hidden` on the container or the `max-content` track
  overflows the page.

---

## Editorial

```css
.prose  .split  .aside-sticky  .callout  .collapsible
.collapsible__toggle  .collapsible__label  .collapsible__panel  .collapsible__sign  .collapsible__count
.belief  .belief__grid  .belief__head  .belief__what  .belief__close
```

- `.collapsible` is how long sections stay short. On mobile especially, collapse rather
  than stack — the stories index went from 24.5 screens to 4.1 by doing this.
- `.prose` caps line length. Body copy should stay inside 50–75 characters.
- `.aside-sticky` is desktop-only; it must degrade to a normal block below `60rem`.

---

## Stories

```css
.story  .story__portrait  .story__who  .story__role  .story__hook  .story__what
.story-grid  .story-bar  .story-count  .story-more  .story-hero  .story-hero__meta
```

The stories index is a **browse surface**, so it must scan:

- Filter chips by region (`--chips`), real counts, client-side.
- Nine shown by default, "Show all N" to expand.
- **On phones the cards become compact rows** — small portrait, text beside it. A
  full-width 4:5 portrait per card meant ~570px of scroll each. Two columns return at
  640px, the large-portrait treatment at 960px.
- All cards stay in the DOM so search and no-JS still find them.

---

## Company register

```css
.co-hero  .co-rail  .co-rail__item  .co-rail__k  .co-rail__n  .co-rail__v
.co-stats  .co-timeline  .co-timeline__row  .co-timeline__w  .co-grid
```

Company pages are a separate register from talent pages — **Persuade** (talent) versus
**Operate** (companies). Do not blend them. A company reader wants mechanism and proof;
a talent reader wants possibility and route.
