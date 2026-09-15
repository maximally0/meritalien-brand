# Meritalien — LinkedIn company-page cover

Three directions, rendered and measured. Nothing here is committed to git; every
file below is new and sits under `banner/`.

---

## 1. The verified spec

**LinkedIn's own published numbers, retrieved live 2026-09-15:**

> **LinkedIn Help — "Image specifications for your LinkedIn Pages and Career Pages"**
> https://www.linkedin.com/help/linkedin/answer/a563309

| Tab | Module | Minimum image size | Recommended image size |
|---|---|---|---|
| Page | Logo image | 268 (w) x 268 (h) px | 400 (w) x 400 (h) px |
| **Page** | **Cover image** | **1512 (w) x 256 (h) px** | **1512 (w) x 256 (h) px** |
| Life | Main image | 1128 (w) x 376 (h) px | 1128 (w) x 376 (h) px |

Also from the same page:

- "All images must be PNG or JPEG files and have a maximum size of **3MB**."
- "Your cover image might be adjusted to fit the screen, which might trim the image
  horizontally or vertically… **place key details away from the edges** of your cover
  photo, especially in the **lower-right** corner."

### The task's assumption was half right

**1128 x 191 is not the cover spec — it is the size LinkedIn renders the cover at.**
The published upload (and minimum) size is **1512 x 256**. The two are the same
frame: 1512/1128 = 1.34043 and 256/191 = 1.34031, i.e. both 5.906:1. Nothing in the
composition changes between them; only the pixel count does.

So this deliverable ships **1512 x 256 as the primary PNG** (the file you actually
upload, and the file that is sharp on a Retina display) **and a 1128 x 191 copy**
as the display size for previews and Figma.

Notes on how the source was reached, since it matters for trust:

- `linkedin.com/help/linkedin/` **rejects plain HTTP fetches** and a guessed article
  ID 404s. The live article ID (`a563309`) was recovered from a 2026 third-party
  guide that links it, then the article itself was fetched and read in full. The
  table above is quoted from LinkedIn, not from the guide.
- An **older** LinkedIn table (still mirrored widely, e.g. on
  knowledge.aspiration.marketing) lists the Page cover as *minimum 1192 x 220,
  recommended 1128 x 191*. That is the superseded spec. 1128 x 191 survives in
  circulation because it is the render size.

### Conflicting 2026 advice, and why I did not follow it

Several 2026 guides (ConnectSafely, Moda) state that "LinkedIn's official help center
lists **4200 x 700**" as the recommended company cover upload. I did not use it for two
reasons: 4200 x 700 is **6.000:1**, which is not the 5.906:1 frame of the live cover,
so that upload gets letterboxed or trimmed; and the number does not appear on
LinkedIn's current help page. **1512 x 256 is what LinkedIn publishes today.**

### Safe area actually used

LinkedIn crops the edges, and the 300 x 300 company logo is laid over the cover's
bottom-left (displayed ≈152 x 152 at desktop). Every direction therefore keeps its
content inside:

```
x >= 280px   (design px at 1128 x 191 scale)
y  32..170
bottom-left box (x < 272, y >= 110) left completely empty
```

Measured result: **0 content pixels inside that box on all three designs.** The
left gutter is deliberately larger than the right (280 vs 65px) because the logo
lives on the left — the cover is composed around the logo, not merely clear of it.

---

## 2. The three directions

| File | Direction | In one line |
|---|---|---|
| `design-01` | **Type-led** | The hero line alone, two lines of Geist on ink, with the accent spent on the single word "borders". |
| `design-02` | **Route-led** | The banner *is* a route readout — `MUMBAI ————● SAN FRANCISCO` — origin muted, destination bright, green destination dot closing the hairline. |
| `design-03` | **Mark-led** | The wordmark centred on paper, largest thing on the strip, "alien" carrying the accent in the AA-safe green. |

Each one spends the accent **exactly once** and refuses a second — verified by
pixel measurement, not by eye (`banner/_qa/audit.txt`).

---

## 3. Recommendation: `design-02` (route-led)

Three reasons, in order of weight.

1. **It is the brand's own grammar, doing the work.** `origin → destination` is the
   organising idea of the whole system (`docs/01-foundations.md`), and the route
   readout is its signature component. A cover that renders a real route is
   instantly different from every competitor's stock crowd photo, and it *says what
   the company does* — mobility, routes, the named visa categories — without
   spending a sentence saying it.
2. **It survives the two conditions that kill covers.** (a) *The thumbnail*: at
   ~200px wide, three short words and a green dot still read; a 44px sentence turns
   into grey texture. (b) *The logo overlay*: on an ink cover, LinkedIn's ink logo
   tile dissolves into the field and the composition is untouched — see the in-place
   mock at `banner/_qa/linkedin-mock.png`.
3. **It does not repeat what LinkedIn already prints.** The Page name and tagline sit
   directly beneath the cover. `design-03` sets the wordmark inside the cover, which
   prints the same word twice on one screen.

**Runner-up: `design-01`.** It is the strongest if the goal is positioning rather
than explanation — it states the thesis at a size that gets read, and it is the only
one of the three that carries the hero line. Use it for awareness, `design-02` for
the Page itself.

**`design-03` is the weakest for this surface specifically** — not because it is badly
made, but because a wordmark-led cover is redundant under a Page header that already
shows the name, and because on a pale cover LinkedIn's dark logo tile becomes the
loudest element on the strip and competes with the wordmark. It is the right design
for a different surface (an ad, a print strip, a deck cover) where the name is not
already printed.

---

## 4. Exact spec used, per file

All three: canvas **1128 x 191** CSS px, screenshotted at `device_scale_factor=2`
(2256 x 382) and resampled to the two delivery sizes. Shared plumbing is in
`banner-shell.css`; tokens, families and hairlines come from `tokens/tokens.css`,
`assets/css/base.css`, `assets/css/components.css`.

### `design-01.html` → `design-01.png` (1512 x 256) + `design-01-1128x191.png`
- Surface `--ink-900` `#0b0b0c`; text `--text-invert` `#fbfaf8`
- Accent **once**: the word "borders" — Newsreader Italic 46.4px, `--accent` `#00e07a`
- Headline: Geist Medium 44px / 1.04, tracking `--tr-display` `-.035em`
- Eyebrow + route labels: Departure Mono 14px (`--t-small`), `--tr-mono` `+.16em`,
  uppercase, `--text-invert-muted`
- Content margins: L 281 / R 66 / T 35 / B 37 design px
- No route component, no icon — deliberately, to keep the accent singular

### `design-02.html` → `design-02.png` (1512 x 256) + `design-02-1128x191.png`
- Surface `--ink-900`; origin city `--text-invert-muted`, destination `--text-invert`
- Accent **once**: the 13px destination dot at the end of the track, `--accent` `#00e07a`
- Cities: Departure Mono 40px / 1, tracking `+.07em`, uppercase
- Track: 1px `--line-invert-strong` from x 280 → x 1040, hollow origin marker (8px,
  ink-filled, 1px `--line-invert-strong` ring)
- Labels: Departure Mono 14px (eyebrow) and 13px (route list), `+.16em`
- Content margins: L 277 / R 81 / T 34 / B 27 design px

### `design-03.html` → `design-03.png` (1512 x 256) + `design-03-1128x191.png`
- Surface `--paper-100` `#fbfaf8`; text `--text` `#0b0b0c`
- Accent **once**: "alien" in the wordmark, `--accent-ink` `#00854a`
  — `#00e07a` is 2.0:1 on paper and may never be text there (`01-foundations.md`)
- Wordmark: Geist Medium 56px, `--tr-heading` `-.022em` (per `docs/04-logo.md`)
- Rule: 44 x 1px `--line-strong`
- Statement: Newsreader 18px (`--t-h3`), `--text-muted` `#5f5b55`
- Content margins: L 415 / R 416 / T 45 / B 44 design px (true horizontal centre)

---

## 5. Verification actually performed

Not eyeballed — measured, and then looked at.

**`banner/_qa/audit.py` → `banner/_qa/audit.txt`** (numpy, per delivered PNG):

| Check | design-01 | design-02 | design-03 |
|---|---|---|---|
| Size | 1512 x 256 ✔ | 1512 x 256 ✔ | 1512 x 256 ✔ |
| Corner pixels == claimed surface token | 4/4 ✔ | 4/4 ✔ | 4/4 ✔ |
| **Accent clusters** | **1** ✔ | **1** ✔ | **1** ✔ |
| Dominant colour inside the cluster | `#00de79`* | `#00e07a` ✔ | `#00854a` ✔ |
| Content px in keep-out box | 0 ✔ | 0 ✔ | 0 ✔ |
| Tightest edge margin | 35 design px | 27 design px | 44 design px |

\* `design-01`'s cluster reports `#00de79` as its *dominant* value because the accent
sits on thin italic serif strokes and Lanczos averages them; the paint value is
`--accent` from `tokens.css`. `design-02`'s dot and `design-03`'s "alien" are solid
fills and measure their exact token values, which is what confirms the
`#00e07a` → `#00854a` substitution on paper was applied correctly.

**Visual, per PNG** (`vision_analyze`, plus 2x zoomed crops in `banner/_qa/`): no text
is clipped, cut, or off-strip on any of the three; all three faces render as the real
files (Geist, Newsreader Italic, Departure Mono) with no fallback substitution;
baselines align across the Geist/Newsreader mix in `design-01`; the mono capitals in
`design-02` are complete (no container clipping).

**In place** — `banner/_qa/make-mock.py` → `banner/_qa/linkedin-mock.png` composes each
cover into a mock Page: page chrome below, and a 152 x 152 logo tile overlapping the
cover's bottom-left by **96px — deeper than LinkedIn's live layout**, to test the worst
case. Result: no collision on any of the three, and the compound finding that the ink
covers absorb the ink logo while the paper cover does not (this is what decided the
recommendation).

Two defects were found this way and fixed, then re-rendered and re-measured:

1. `design-02`'s hollow origin marker poked 22px into the bottom-left keep-out (the
   track's marker uses a −3.5px offset). The whole route group moved from x 272 to
   x 280; the intrusion is now 0.
2. `design-02`'s bottom margin was 21 design px (tighter than any other edge) and
   `design-03` sat 12px below centre. Both rebalanced; margins are now 27 and 44/45.

---

## 6. What I could not fix, and honest deviations

1. **Two sizes are not tokens.** The headline (44px), the route cities (40px) and the
   wordmark (56px) — and eyebrows set at `--t-small` 14px rather than `--t-mono`
   12.5px. The strip is a fixed 1128 x 191 artefact, so the fluid scale
   (`clamp(...vw...)`) has nothing to resolve against, and 12.5px mono is too small
   for a 191px-tall surface. Colours, families, tracking, hairlines and radii are all
   from `tokens.css`.
2. **The delivered PNGs are high-quality resamples, not native 1512-wide renders.**
   They were rasterised at 2256 x 382 (2x) and Lanczos-resampled to 1512 x 256 and
   1128 x 191 so both sizes come from one master and land on exact pixels. At this
   size the difference is invisible, but if a native master is wanted, set
   `zoom: 1.3404255` on `.stage` and screenshot at a 1512 x 256 viewport.
3. **A repo inconsistency I did not touch** (fixing it means editing an existing
   file): `assets/css/components.css` sets `.nav__mark { font-family: var(--font-serif) }`,
   while `docs/04-logo.md` says the wordmark "is set in **Geist** at weight 500 …
   Do not re-set it in another face." `design-03` follows the doc
   (Geist 500, `-.022em`) and uses `--accent-ink` for "alien". One of the two is wrong.
4. **`MUMBAI → SAN FRANCISCO` is illustrative**, taken from the brief's own example as
   the brand's signature readout. It is not a claim about a specific service lane. If
   Meritalien wants only lanes it actually serves, swap the two city names — nothing
   else in the layout depends on them.
5. **The mock is an approximation.** The logo tile in `linkedin-mock.png` is drawn by
   hand with a stock font, and its 96px overlap is deliberately deeper than LinkedIn's
   live layout. It is a collision test, not a pixel-accurate replica of the Page.
6. **The left gutter looks empty in isolation.** Delivery is 280 design px of
   deliberate quiet on the left of `design-01` and `design-02`, because that is where
   LinkedIn puts the logo. Viewed as a standalone file with no logo on it, it reads as
   generous margin; viewed on the Page, it reads as composed around the mark.

---

## 7. Files

```
banner/
  design-01.html              1512 x 256 source, type-led
  design-01.png               1512 x 256  ← LinkedIn upload size
  design-01-1128x191.png      1128 x 191  ← LinkedIn display size
  design-02.html / .png / -1128x191.png   route-led
  design-03.html / .png / -1128x191.png   mark-led
  banner-shell.css            canvas, label register, keep-out QA box
  render.py                   renders all three + the keep-out QA pass
  NOTES.md                    this file
  _qa/
    audit.py, audit.txt       pixel measurements quoted above
    make-mock.py              LinkedIn Page mock
    linkedin-mock.png         all three in place, with the logo overlay
    design-0N@2x.png          2256 x 382 masters
    design-0N-keepout@2x.png  masters with the red keep-out box drawn
    *_zoom.png                2x crops used for glyph-level checks
```

Re-render everything with `python banner/render.py && python banner/_qa/audit.py`.
