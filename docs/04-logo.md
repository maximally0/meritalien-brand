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

Because it is type, it is set in **Geist** at weight 500 and tracks with the heading
value (`-.022em`). Do not re-set it in another face, do not letter-space it, do not
add a symbol next to it.

> **Note:** if a drawn symbol is ever wanted, it does not exist yet. The M-plus-dot
> below is the *icon*, which is a different thing — see the next section. Do not
> present it as a logo lockup.

---

## The icon

The icon is the wordmark compressed to a single glyph: **the M, plus the green**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0b0b0c"/>
  <path d="M14 44V20h6.2l6.4 12.4L33 20h6.2v24h-5.4V29.6L29 40h-4.6L19.4 29.6V44z"
        fill="#fbfaf8"/>
  <circle cx="47.5" cy="41.5" r="4.5" fill="#00e07a"/>
</svg>
```

- Round square, `rx: 12` of 64 (**18.75%** — matches the `--r-lg` feel, not a pill)
- Field: `--ink-900` `#0b0b0c`
- M: `--paper-100` `#fbfaf8`, drawn as a **geometric path**, not a font glyph
- Dot: `--accent` `#00e07a`, at the lower right

**"Merit" is white, "alien" is green — so the icon keeps the M white and reduces the
green half to a full stop.** It reads as **"M."**

The M is a path rather than a Geist glyph on purpose: at 16px a font M smears, while a
geometric path with flat terminals stays crisp.

### Honest limitation

At **16px the dot is effectively lost** — you see the M alone. That is acceptable (the
M carries the identity), but if the dot must survive at tab size, either the dot grows
or the M shrinks. Do not simply scale the whole icon down and hope.

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
