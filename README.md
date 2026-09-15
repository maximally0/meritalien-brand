# Meritalien — brand kit

The design system behind [meritalien.com](https://meritalien.com), packaged so we can
produce on-brand work outside the website: PDFs, decks, one-pagers, new site sections,
and the motion.

This is a **working kit, not a style guide**. Every value is lifted from the files that
actually build the site, the fonts are the real font files, and the templates render.
Change a token in `tokens/tokens.css` and everything downstream follows.

---

## The one idea

**Origin → destination.** Talent is somewhere; opportunity is somewhere else; the work
is the line between.

That is the layout grammar, not a tagline. `from → to` shows up as the route readout,
the two-country comparison, the doors, the globe arcs. When you build something new,
ask what the *from* and the *to* are. If neither exists, it is probably the wrong thing.

---

## Start here, by job

| I want to… | Read | Start from |
|---|---|---|
| Add a **section to the website** | [`docs/06-cookbook.md`](docs/06-cookbook.md) §1 | `templates/section-starter.html` |
| Make a **PDF / one-pager** | [`docs/06-cookbook.md`](docs/06-cookbook.md) §2 | `templates/onepager.html` + `templates/print.css` |
| Make a **deck** | [`docs/06-cookbook.md`](docs/06-cookbook.md) §3 | `templates/deck-slide.html` |
| Reuse the **animations** | [`docs/02-motion.md`](docs/02-motion.md) | `templates/motion-demo.html` |
| Just get the **colours and type** | [`docs/01-foundations.md`](docs/01-foundations.md) | `tokens/` |
| Understand the **voice** | [`docs/03-voice.md`](docs/03-voice.md) | — |
| Get the **logo and icons** | [`docs/04-logo.md`](docs/04-logo.md) | `assets/icons/` |

**`templates/motion-demo.html` is the fastest way to understand how we move.** Open it
in a browser and scroll. Every animation runs on the real code, labelled with its spec.

---

## What is in here

```
docs/
  01-foundations.md    colour, type, space, radii, grid, breakpoints, a11y floor
  02-motion.md         every animation, exact parameters, how to reuse it
  03-voice.md          how Meritalien sounds, with real examples and a do/don't table
  04-logo.md           the wordmark, the M-and-dot icon, the icon family, clear space
  05-components.md     the reusable class vocabulary
  06-cookbook.md       step-by-step for the four jobs
tokens/
  tokens.css           THE SOURCE OF TRUTH for every design value
  tokens.json          W3C DTCG — Figma, Token Studio, Style Dictionary
  tokens.scss          SCSS variables
assets/
  css/                 tokens, base, components, extra — the real stylesheets
  js/                  app.js, craft.js, globe.js, navigator.js + gsap/lenis/ScrollTrigger
  fonts/               Geist, Newsreader, Departure Mono (woff2 + ttf) + licences
  icons/               favicon.svg (source of truth) + the derived PNG icon family
templates/
  section-starter.html a website section, already wired
  motion-demo.html     every animation, runnable
  onepager.html        A4 document
  deck-slide.html      16:9 slide
  print.css            print/PDF stylesheet
examples/
  deck-slide.pdf       rendered from templates/deck-slide.html (2 pages, 960x540pt)
  onepager.pdf         rendered from templates/onepager.html (A4, 210x297mm)
generators/
  export-tokens.py     tokens.css -> tokens.json + tokens.scss
  make-icons.py        favicon.svg -> the PNG icon family
  render-pdf.py        HTML -> PDF at an exact page size
  og-cards.py          the social-share card generator
```

---

## The rules that actually matter

Everything else is detail. These are the ones that make it look designed instead of
decorated, and each one exists because ignoring it shipped a real bug.

**1. The accent is a signal, not a highlight.**
`#00e07a` appears on **exactly three things** and nowhere else. If it shows up a fourth
place, it stops meaning *go*. On any new surface, pick your three carriers and refuse a
fourth. On paper, use `--accent-ink` `#00854a` — `#00e07a` is only 2.0:1 there.

**2. Dark surfaces must carry `on-ink`.**
It restates the text colours. Without it, an eyebrow renders at **2.92:1** (invisible)
and `.fromto__to` renders near-black on near-black. This is the single easiest way to
ship an invisible element, and it has happened more than once.

**3. Everything translates. Nothing fades in place.**
One easing curve: `cubic-bezier(0.16, 1, 0.3, 1)`. Three durations: 260 / 420 / 700ms.
If motion needs to feel different, change its duration or distance — never its curve.

**4. Content must never depend on an animation succeeding.**
Translate-only, reveal via IntersectionObserver (which fails open), and a failsafe sweep
that force-restores anything still invisible. A blank section is worse than a missing
animation.

**5. Never load `extra.css` into a designed artifact.**
It carries the *site's article print stylesheet*, which redefines the palette
black-on-white to save ink, collapses every grid to one column, and hides nav/footer.
Correct for printing a web page; fatal for a deck. See the head of
`templates/deck-slide.html`.

**6. Serif is reserved.**
Newsreader is for statements. Geist is for structure, data and UI. Departure Mono is for
labels, eyebrows and machine-facts. Serif never touches the H1. Reserving the serif
register is what makes it mean something.

**7. Zero hedging outside the legal pages.**
No "not a law firm", no "may vary", no "subject to change" on a content surface. All of
it lives on `/legal/` and nowhere else.

**8. Measure contrast; do not eyeball it.**
Three separate contrast bugs shipped in this project because values *looked* fine.
≥4.5:1 for text, and WCAG SC 1.4.10 (reflow at 320px) and SC 2.5.8 (24px targets) are
the floor, not aspirations.

---

## Using the tokens

```html
<link rel="stylesheet" href="tokens/tokens.css">
```

```css
.thing { color: var(--text); background: var(--paper-100); border-radius: var(--r-lg);
         transition: transform var(--dur) var(--ease); }
```

Figma / Token Studio consume `tokens/tokens.json`. Sass consumes `tokens/tokens.scss`.
**Never retype a hex value** — that is how three copies of a palette start drifting.

Space is a 4px scale (`--s-1` … `--s-32`). Do not invent off-scale values.
Two radii, no more: `--r-sm` 4px, `--r-lg` 10px.

---

## Generating things

```bash
# tokens.css -> tokens.json + tokens.scss
python generators/export-tokens.py

# favicon.svg -> the PNG icon family (180 / 192 / 512 / 32 + maskable)
python generators/make-icons.py

# HTML -> PDF at an exact page size (--deck for 16:9)
python generators/render-pdf.py templates/deck-slide.html out/deck.pdf --deck
python generators/render-pdf.py templates/onepager.html out/onepager.pdf
```

`export-tokens.py` **fails loudly** if it cannot classify a variable. A silently dropped
token looks exactly like a token that was never defined, and you only find out when
something renders the wrong colour.

---

## Verifying an artifact before you ship it

A PDF nobody looked at is not a finished artifact.

1. **Assert the page count and page size.** `960×540pt` is 16:9; `595×842pt` is A4.
2. **Confirm the fonts are embedded** — check `/FontDescriptor`, not the `/BaseFont`
   listing. Chrome emits Type3 outlines for mono faces, which have no `/BaseFont` at
   all; a "missing" font in the report is usually that, not a broken `@font-face`.
3. **Look at every page.** Rasterise to PNG and inspect. Vision is the only way to catch
   clipping and imbalance.
4. **`overflow: hidden` clips silently.** Overflowing a flex column does not error; it
   disappears.

```python
import fitz
d = fitz.open("out/deck.pdf")
print(d.page_count, d[0].rect)                     # 2, Rect(0, 0, 960, 540)
for i, pg in enumerate(d):
    pg.get_pixmap(dpi=110).save(f"out/proof/p{i+1}.png")
```

---

## Fonts and licensing

All three families are open-source and free for commercial use. The licence files ship
alongside them in `assets/fonts/`.

| Family | Licence | Copyright |
|---|---|---|
| **Geist** | SIL OFL 1.1 | Vercel, in collaboration with basement.studio |
| **Newsreader** | SIL OFL 1.1 | The Newsreader Project Authors (Production Type) |
| **Departure Mono** | **MIT** | Helena Zhang & Tobias Fried |

The site self-hosts all three. There are **no third-party font or script requests** in
the built output — partly for reliability, and partly because loading fonts from Google's
CDN transmits your visitors' IP addresses to Google, which a German court has ruled
breaches the GDPR.

---

## Source of truth

| Thing | Lives in | Regenerate with |
|---|---|---|
| Every design value | `tokens/tokens.css` | edit by hand — it is the source |
| Token exports | `tokens/tokens.json`, `tokens.scss` | `generators/export-tokens.py` |
| The mark | `assets/icons/favicon.svg` | edit by hand — it is the source |
| The icon family | `assets/icons/*.png` | `generators/make-icons.py` |
| Motion | `assets/js/app.js`, `craft.js` | — |

Where this document and `tokens.css` disagree, **`tokens.css` wins.**
