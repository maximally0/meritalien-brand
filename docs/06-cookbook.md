# Cookbook — the four jobs

Practical steps for: a new website section, a PDF, a deck, and reusing the animations.

---

## 0. Get the tokens in

**CSS** — link the real file, do not retype values:

```html
<link rel="stylesheet" href="tokens/tokens.css">
```

**SCSS** — `@use "tokens/tokens.scss" as t;` then `t.$accent`. Generated; do not edit.

**JSON (DTCG)** — `tokens/tokens.json` for Figma, Token Studio, or Style Dictionary.

**Fonts** — `@font-face` with **relative** URLs. This is the single most common mistake:

```css
@font-face {
  font-family: Geist;
  src: url("../assets/fonts/Geist-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: block;      /* block for print, swap for web */
}
```

> Relative URLs resolve against **the HTML file's directory**, not the CSS file. Get it
> wrong and the render **silently falls back to Segoe UI / Georgia** — it will look
> merely mediocre rather than obviously broken. Always verify the embedded font names,
> never trust the visual.

For print and PDF use `font-display: block`. With `swap`, Chrome can rasterise the PDF
before the webfont arrives and you get fallback metrics in the final file.

---

## 1. A new website section

Start from `templates/section-starter.html`. It has the shell, a band, an eyebrow, a
headline, a grid, and reveals already wired.

**The shape of a section:**

```html
<section class="band">
  <div class="shell">
    <p class="eyebrow">The system</p>
    <h2 class="display" data-reveal>Four layers. One journey.</h2>
    <p class="lead" data-reveal>One sentence, serif, that states the thing.</p>

    <div class="grid grid-3" data-stagger>
      <article class="card" data-reveal> … </article>
      <article class="card" data-reveal> … </article>
      <article class="card" data-reveal> … </article>
    </div>
  </div>
</section>
```

**Checklist:**

- [ ] `.band` + `.shell` — never hand-roll padding.
- [ ] Only `--s-*` values. No off-scale spacing.
- [ ] `data-reveal` on the elements that should arrive; `data-stagger` on the container.
- [ ] If the section is dark, add `class="band--ink on-ink"` — **`on-ink` is not
      optional**, it is what restates the text colours.
- [ ] Eyebrow is mono uppercase, from the fixed vocabulary.
- [ ] Accent appears **at most once** in the section.
- [ ] Collapse on mobile: `grid-3` becomes one column at 40rem automatically.
- [ ] Run `python verify.py` and `python a11y_audit.py` if you are in the site repo.

**Breakpoints:** use only `30 / 40 / 48 / 60rem`, and `max-width` (the system is
desktop-first). A fifth value is a review flag.

---

## 2. A PDF (one-pager, report, or deck)

Use `templates/print.css` plus `templates/onepager.html`.

The engine is headless Chrome, one `.page` element per PDF page.

```css
@page { size: A4; margin: 0; }          /* or 1280px 720px for a 16:9 slide */
```

For a **deck-shaped** PDF, `1280px × 720px` in CSS px is exactly **960 × 540 pt** —
CSS px → PDF pt is **× 0.75**. That is true 16:9.

```bash
chrome --headless --disable-gpu \
  --no-pdf-header-footer \
  --user-data-dir=/tmp/chrome-pdf \
  --print-to-pdf="/absolute/path/out.pdf" \
  "file:///absolute/path/onepager.html"
```

Two things that will bite you:

- **The output path must be absolute.** A relative path fails with
  `Access is denied (0x5)`.
- **Always pass a dedicated `--user-data-dir`.** Otherwise Chrome conflicts with a
  running instance.

### Print-specific rules

`print.css` handles the differences between screen and paper:

```css
@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }  /* keep the ink bands */
  [data-reveal] { opacity: 1 !important; transform: none !important; } /* never ship a half-revealed page */
  .nav, .footer__cols, .marquee { display: none; }
}
```

The `[data-reveal]` reset is essential: a reveal that has not fired is `opacity: 0`, and
you would export a blank page.

### Verify

Never ship an unlooked-at PDF.

1. **Assert page count and page size** programmatically.
2. **Confirm the fonts are embedded** — check the `/FontDescriptor`, not the `/BaseFont`
   listing. Chrome emits **Type3 outlines** for mono and pixel faces, which have no
   `/BaseFont` at all; a "missing" font in the report is usually this, not a broken
   `@font-face`. Do not "fix" it.
3. **Look at every page.** Rasterise to PNG and inspect. Vision is the only way to catch
   clipping and imbalance.
4. **`overflow: hidden` on a fixed-height page clips silently.** Overflowing a flex
   column does not error; it disappears.

Text-extraction checks lie in two predictable ways: `text-transform: uppercase` shifts
the extracted case, and letter-spaced mono extracts as `"M E R I T"`. Match
case-insensitively and strip whitespace.

---

## 3. A deck (PPTX / slides)

Start from `templates/deck-slide.html`.

**Slide geometry:** 1280 × 720 CSS px → 960 × 540 pt. One `.slide` element = one page.

```css
@page { size: 1280px 720px; margin: 0; }
.slide { position: relative; width: 1280px; height: 720px; overflow: hidden;
         padding: 44px 64px 36px; display: flex; flex-direction: column; }
```

**The rules that make it read as Meritalien:**

- **Alternate ink and paper slides.** Five identical light slides have no spine.
- **Serif for the statement, Geist for everything structural, mono for eyebrows.**
- **The accent appears once per slide.** Pick the word or figure that matters and refuse
  a fourth green.
- **One artifact per slide.** A real table, a real route card, a real comparison. Prose
  that merely asserts something is filler — if the slide still works with the paragraphs
  deleted, delete them.
- **`.fromto` for any before/after.** It is the most on-brand component in the kit.

**If you need a real `.pptx`** (not a PDF), build the theme by hand — PowerPoint cannot
read CSS. Use:

| Element | Value |
|---|---|
| Background (light) | `#FBFAF8` |
| Background (dark) | `#0B0B0C` |
| Headline font | Geist SemiBold, tracking −2.2% |
| Body font | Geist Regular 17pt |
| Statement font | Newsreader Regular, italic for emphasis |
| Label font | Departure Mono, uppercase, +16% tracking |
| Accent | `#00E07A` — once per slide |
| Slide size | 16:9 (13.33in × 7.5in) |

Because Geist and Newsreader are not installed on most machines, **embed the fonts in
the .pptx** or it will silently substitute on someone else's laptop.

---

## 4. Reusing the animations

Full specs are in `docs/02-motion.md`. To lift them into a new page:

```html
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/base.css">
<script src="assets/js/vendor/gsap.min.js" defer></script>
<script src="assets/js/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/js/vendor/lenis.min.js" defer></script>
<script src="assets/js/app.js" defer></script>
<script src="assets/js/craft.js" defer></script>
```

Then mark things up:

```html
<div data-reveal>arrives as it enters the viewport</div>
<div data-stagger>
  <div data-reveal>70ms after its sibling</div>
  <div data-reveal>140ms after</div>
</div>
<span data-count-to="31" data-count-suffix="%"></span>
<section data-pin>
  <p data-pin-line>translate-only scrub</p>
</section>
```

**Minimum viable version** — if you only want the reveal system, you need the
`[data-reveal]` CSS block, the IntersectionObserver in `app.js`, and nothing else. No
GSAP, no Lenis. That is the 90% case, and it fails open.

**Three rules, restated because they are the whole thing:**

1. **Everything translates. Nothing fades in place.** One curve, always.
2. **Content must never depend on an animation succeeding.** Translate-only, fail
   open, plus the failsafe sweep.
3. **Reduced motion removes the movement, not the content.**

Open `templates/motion-demo.html` to see every animation running with the real code.

---

## Verification checklist for any derived artifact

- [ ] Fonts are the real files, embedded, and verified by name (not by eye)
- [ ] Accent appears once per surface
- [ ] Only `--s-*` spacing values
- [ ] Text contrast ≥ 4.5:1 — **measured**, not eyeballed
- [ ] Dark surfaces carry `on-ink`
- [ ] No hedging outside `/legal/`
- [ ] If it contains a number, it has a source and a date
- [ ] Someone has actually looked at the rendered output
