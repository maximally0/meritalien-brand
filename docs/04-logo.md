# Logo and marks

## The identity is the wordmark

Meritalien does not have a separate drawn logo. The identity **is** the typeset
wordmark, split in two:

```html
<a class="nav__mark" href="/" aria-label="Meritalien — home">Merit<span>alien</span></a>
```

- **"Merit"** — set in `--text` (ink on paper, paper on ink)
- **"alien"** — set in `--accent` (`#00e07a`)

The split is the idea: **merit** is what you have, **alien** is the status the border
gives you. The word does the positioning work that a symbol usually does.

It is set in **Newsreader** (`--font-serif`) at weight **400**, size `1.375rem` (22px),
tracks `-0.01em`, and does not wrap. Do not re-set it in another face, do not
letter-space it, do not add a symbol next to it.

> **Measured, 2026-09-15.** This document previously claimed Geist at weight 500 with
> `-.022em` tracking. That was wrong — `components.css` sets
> `font-family: var(--font-serif)`, and the rendered wordmark is Newsreader 400 at 22px.
> Anyone following the old text would have produced a sans-serif wordmark that does not
> match the site. Always check `assets/css/components.css` for `.nav__mark`; the CSS is
> the source of truth, not this page.

The serif is the point. The site reserves Newsreader for statements, and the wordmark
is the first statement on the page — setting it in Geist would flatten the distinction
between the brand's name and its UI.

> **Note:** if a drawn symbol is ever wanted, it does not exist yet. The M-plus-dot
> below is the *icon*, which is a different thing — see the next section. Do not
> present it as a logo lockup.

---

## The icon

The icon is the wordmark compressed to a single glyph: **the M, plus the green**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#0b0b0c"/>
  <path d="M11 44 H16.5 V31.88 L22.43 44 H27.57 L33.5 31.88 V44 H39 V20 H33.19
           L25 36.74 L16.81 20 H11 Z" fill="#fbfaf8"/>
  <circle cx="48" cy="39" r="5" fill="#00e07a"/>
</svg>
```

- Round square, `rx: 10` of 64
- Field: `--ink-900` `#0b0b0c`
- M: `--paper-100` `#fbfaf8`, drawn as a **geometric path**, not a font glyph
- Dot: `--accent` `#00e07a`, r 5, centred at (48, 39)

**"Merit" is white, "alien" is green — so the icon keeps the M white and reduces the
green half to a full stop.** It reads as **"M."**

The M is a path rather than a Geist glyph on purpose: at 16px a font M smears, while a
geometric path with flat terminals stays crisp.

### The geometry, and why it is this specific geometry

Refined 2026-09-15. The original had three defects that only showed at size:

| | Original | Now | Why |
|---|---|---|---|
| V apex | stopped 4 units short of the baseline (`y=40`) | lands **on** the baseline (`y=44`) | a short V reads as a closed block, not a geometric M |
| Stroke weight | mixed — 6.2 verticals, 5.4 stems, drifting diagonals | a consistent **5.5** throughout | one weight is what makes it read as drawn rather than approximated |
| Dot | r 4.5 at cy 41.5 — overshot the baseline by 2 | **r 5 at cy 39** | its lower edge now meets the baseline exactly, and it survives small sizes |
| Margins | 14 left / 12 right — right-heavy | **11 / 11**, optically equal | the mark sat off-centre in its own square |

Content spans `x 11..53` in the 64 box. The dot is never allowed to be an afterthought:
its bottom edge is the M's baseline.

### At 16px

The dot **does survive** now, as a single deliberate green pixel. That is the reason the
dot grew — under the previous geometry it reduced to ~1px of anti-aliased smear and was
effectively lost at tab size. Verified by rendering the mark at 256 / 180 / 64 / 32 / 16
and looking at each one; do the same after any change, because this is exactly the kind
of defect that is invisible in the SVG and obvious in the favicon.

---

## The icon family

All of these are **derived from one SVG**, so they cannot drift. There used to be two
different marks — the browser tab showed an M with a dot, and the iOS home screen showed
an M with a vertical bar, drawn separately with PIL. Nobody would have noticed until
someone added the site to their home screen.

| File | Size | Purpose |
|---|---|---|
| `favicon.svg` | vector | Browser tab. **Source of truth.** |
| `favicon-32.png` | 32 | Legacy crawlers that want a PNG |
| `apple-touch-icon.png` | 180 | iOS home screen |
| `icon-192.png` | 192 | PWA manifest |
| `icon-512.png` | 512 | PWA manifest, store listings |
| `icon-192-maskable.png` | 192 | Android adaptive |
| `icon-512-maskable.png` | 512 | Android adaptive |

**Maskable is not the same file with a different name.** Android applies its own mask
(circle, squircle, teardrop), so a maskable icon must have **no transparency and no
pre-rounded corners** — those corners would show as a broken shape inside the mask. The
maskable variants are full-bleed squares with the mark scaled to **0.82** about the
centre, which puts it inside the 80% safe zone.

Regenerate everything after any change to the SVG:

```bash
python generators/make-icons.py
```

---

## Clear space and minimum size

- **Clear space:** the height of the M's stem (≈ the icon's full height ÷ 4) on all
  four sides. Nothing enters that margin — no text, no rule, no edge of a panel.
- **Minimum size:** 16px for the icon. Below that the M's counters close up.
- **Minimum wordmark size:** 16px cap height. Below that the Merit/alien colour split
  stops reading as one word.

---

## Using the accent

The green in the icon is subject to the same rule as everywhere else:

> It appears on exactly three things and nowhere else. If it shows up a fourth place,
> the accent stops meaning "go".

In the icon the accent is the dot. That is one of its three carries; it does not grant
permission to add green elsewhere in the same surface.

On paper surfaces the readable variant is `--accent-ink` `#00854a` — `#00e07a` on paper
is only 2.0:1 and must not be used for text.

---

## Never

- Do not place the icon on a light background without the ink field. It is designed as a
  filled tile.
- Do not stretch, rotate, outline, or add a drop shadow to the tile.
- Do not re-colour the dot to anything but `--accent`.
- Do not set the wordmark in another typeface, or split it at a different point
  ("Merit" + "alien" is the only split — not "Mer" + "italien").
- Do not combine the icon and the wordmark into a lockup that was not designed.
- Do not use `#00e07a` for text on a paper surface. Use `#00854a`.
