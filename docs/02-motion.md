# Motion

The complete animation system: every animation on the site, its exact parameters, and
how to reproduce it. The source is `assets/js/app.js` (reveal, nav, counters, marquee,
drawer) and `assets/js/craft.js` (page transitions, scrub sequences).

There is also a **runnable demo of all of it**: `templates/motion-demo.html`. Open it in
a browser. Everything below is demonstrated there with the real code.

---

## Three rules that govern everything

### 1. Everything translates. Nothing fades in place.

```css
--ease: cubic-bezier(0.16, 1, 0.3, 1);   /* easeOutExpo — the only curve */
--dur-fast: 260ms;
--dur:       420ms;
--dur-slow:  700ms;
```

There is **one** easing curve in the entire system. A second curve is how a site starts
to feel assembled rather than directed. If a motion needs to feel different, change its
*duration or distance*, never its curve.

Elements arrive by moving. Opacity is a secondary accompaniment, never the mechanism.
An element that appears by fading in place has no direction, and direction is the whole
brand idea.

### 2. Content must never depend on an animation succeeding

This is the rule that was learned the hard way, and it is why the architecture looks
the way it does.

GSAP's `from` tweens **render their hidden state at creation time**. A group whose
ScrollTrigger never fired — because of a stale trigger, a layout shift, a font swap —
stayed at `opacity: 0` permanently. Invisible content, hidden behind what looked like
progressive enhancement.

The fix, and the rule:

- **GSAP is used only for scrub-driven sequences**, where a missing trigger degrades to
  a *static, visible* section rather than a blank one.
- **All reveals run on IntersectionObserver**, which fails open.
- **Every animated section is translate-only**, so a dead trigger costs a 34px offset
  and nothing else.
- **A failsafe sweep runs at 6s** (and again 1.2s after `load`) and force-restores
  anything still under `opacity 0.05`.

```js
const failsafe = () => {
  $$("[data-pin-line], [data-see]").forEach((el) => {
    if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "opacity,transform" });
    }
  });
};
```

> A blank section is a worse outcome than a missing animation.

### 3. Reduced motion kills the theatre, keeps the meaning

```css
@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 1ms; --dur: 1ms; --dur-slow: 1ms; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

Then, individually:

| Animation | Under reduced motion |
|---|---|
| Reveals | Resolve instantly to final state |
| Smooth scroll (Lenis) | **Not initialised at all** — native scroll |
| Page transitions | Skipped |
| Scrub sequences | Skipped; sections render static and visible |
| Counters | Jump straight to the final number |
| Globe | Draws **one static frame** — still meaningful, just not moving |
| Hero video | Holds on its poster frame |

Note the pattern: reduced motion is not "the same thing, faster". It is the same
*content* with the movement removed. The globe still exists; it just doesn't rotate.

---

## The animations

### 1. Reveal — the workhorse

Every element marked `data-reveal` rises into place as it enters the viewport.

```css
[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 22px, 0);
  transition:
    opacity var(--dur) var(--ease),      /* 420ms */
    transform var(--dur) var(--ease);
  transition-delay: var(--reveal-delay, 0ms);
}
[data-reveal="left"]  { transform: translate3d(-28px, 0, 0); }
[data-reveal="right"] { transform: translate3d(28px, 0, 0); }

[data-reveal].is-in {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);        // once, then stop watching
    }
  });
}, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
```

- **Distance:** 22px vertical, 28px horizontal.
- **Trigger:** 5% visible, and the bottom margin is pulled in 12% so it fires *before*
  the element is fully in view — the motion completes as you arrive rather than after.
- **Once only.**

**Stagger.** There is no delay baked into the components. A group sets a per-child
delay on a custom property:

```js
$$("[data-stagger]").forEach((group) => {
  Array.from(group.children).forEach((child, i) => {
    child.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 70}ms`);
  });
});
```

**70ms steps, capped at 8 for groups and 6 for siblings.** The cap matters: without it a
30-card grid takes two seconds to finish and reads as slow, not choreographed.

**To use it:** add `data-reveal` to the element. Add `data-stagger` to a container to
cascade its children. Use `data-reveal="left"` / `"right"` only for things that
genuinely enter from a side — a two-column comparison, not a card.

**Never** put `data-reveal` on the primary headline of a page. The hero is not an
arrival; it is the thing you arrived for.

---

### 2. Smooth scroll — Lenis

```js
lenis = new window.Lenis({
  duration: 1.05,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),   // easeOutExpo, again
  smoothWheel: true,
  touchMultiplier: 1.6,
});
```

Wired into GSAP so the two share one ticker — **this matters**:

```js
if (window.ScrollTrigger) {
  lenis.on("scroll", window.ScrollTrigger.update);
  window.gsap.ticker.add((time) => lenis.raf(time * 1000));
  window.gsap.ticker.lagSmoothing(0);
  window.ScrollTrigger.refresh();
} else {
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
```

Without the shared ticker, Lenis and ScrollTrigger each run their own rAF loop and the
scrub animations jitter against the smoothing. Also note `lagSmoothing(0)` — GSAP
otherwise "catches up" after a frame drop, which you can see as a lurch.

**Not initialised at all under reduced motion.** Not `duration: 0` — not at all.

---

### 3. Page transitions

A static site has no router, so the departure is played on click and the arrival on load.

```js
// departure — 340ms out, navigate at 300ms
main.style.transition = `transform 340ms ${EASE}, opacity 340ms ${EASE}`;
main.style.transform = "translate3d(-24px,0,0)";
main.style.opacity = "0";
window.setTimeout(() => { window.location.href = href; }, 300);

// arrival — 620ms in from the other side
main.style.transform = "translate3d(28px,0,0)";
main.style.opacity = "0";
requestAnimationFrame(() => {
  main.style.transition = `transform 620ms ${EASE}, opacity 620ms ${EASE}`;
  main.style.transform = "translate3d(0,0,0)";
  main.style.opacity = "1";
});
```

**Out left, in from right.** Same axis, same direction, every time — so a route change
reads as one continuous movement rather than two unrelated ones. `sessionStorage` carries
the "departing" flag across the navigation.

Guards that matter: skip for `target="_blank"`, `download`, `#hash`, `mailto:`, `tel:`,
external hosts, and any modifier-key click. And handle bfcache:

```js
window.addEventListener("pageshow", (e) => {
  if (e.persisted) { /* reset transform/opacity — otherwise you return to an invisible page */ }
});
```

---

### 4. Scrub sequences — the pinned moment

Scroll-driven sequences. Desktop only.

```js
const canPin = window.ScrollTrigger && window.gsap && !REDUCED &&
               window.matchMedia("(min-width: 56rem)").matches;
```

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: "top 82%",
    end: "+=90%",
    scrub: 0.6,
    pin: false,            // never pin
    anticipatePin: 1,
  },
});
gsap.set(lines, { y: 34 });
tl.to(lines, { y: 0, duration: 1, stagger: 0.35, ease: "none" });
gsap.set(track, { xPercent: 6 });
tl.to(track, { xPercent: -6, duration: 3, ease: "none" }, 0);
```

- **`ease: "none"` on every scrub tween.** The scroll position *is* the easing. Adding a
  curve on top of a curve makes the motion fight the user's hand.
- **`pin: false` despite the name.** Pinning risks layout jumps on a long page; the
  section holds visually because the scrub is slow (over 90% of viewport height), not
  because it is pinned in place.
- **Translate only, deliberately.** A scrub tween at progress 0 renders its start state.
  Animating opacity would leave text invisible if the trigger never fired. Translating
  34px means a dead trigger costs a 34px offset and nothing else.
- **56rem minimum.** Pinning on a phone fights browser chrome and touch scrolling.

And keep ScrollTrigger honest — document height changes with fonts, images and
collapsibles, and a stale trigger strands sections:

```js
window.addEventListener("load", () => window.ScrollTrigger.refresh());
document.fonts.ready.then(() => window.ScrollTrigger.refresh());   // font swaps move everything
window.addEventListener("resize", debounce(() => window.ScrollTrigger.refresh(), 180));
```

---

### 5. Counters

```js
const dur = 1400;
const eased = 1 - Math.pow(2, -10 * p);   // easeOutExpo — same curve again
```

Fires once at `threshold: 0.4` (a counter should be well into view before it runs, or
the user misses it). Markup:

```html
<span data-count-to="31" data-count-decimals="0"
      data-count-prefix="" data-count-suffix=""></span>
```

Under reduced motion it sets the final value immediately — no animation, same number.

---

### 6. Nav — transparent over the hero, solid past it

```js
const trigger = solidAfter ? solidAfter.offsetHeight - 90 : 90;
nav.classList.toggle("is-solid", y > trigger);
```

Pages without a dark hero ship `is-solid` already in the markup. Pages with a transparent
hero opt in with `data-solid-after="#selector"`.

> This one shipped a real bug worth knowing about: **`is-solid` is what flips the nav's
> hairline and text colour.** ~90 pages were built without the class and rendered the
> nav's light text on a light page — an invisible menu. If you add a page template,
> confirm which state its nav ships in.

---

### 7. The globe — canvas, not WebGL

A dotted orthographic sphere with great-circle arcs, drawn on 2D canvas.

```js
rotY += dt * 0.0075;                 // 7.5°/second — a full turn in ~48s
if (rotY > 180) rotY -= 360;
```

- **Back-face culling falls out of `cos(c)`** — dots behind the sphere are simply not
  drawn. That is why this is 2D canvas and not three.js: the maths is trivial and you
  avoid a WebGL context, a bundle, and moritzlegal's 165 `will-change` layers.
- **The active marker pulses:** `1 + Math.sin(performance.now() / 420) * 0.22` — ±22%
  radius, one cycle every ~2.64s. Inner dot 3.6px, outer glow 8px.
- **Starts at `rotY = -76`** — the longitude that puts South Asia facing the viewer.
  The brand's thesis is visible in its first frame.
- **The RAF loop is gated by IntersectionObserver.** A canvas redrawing a sphere two
  screens below the fold burns battery for nothing; on a phone that is the difference
  between a warm handset and a cool one. Verified: 0 painted pixels off-screen, ~45k
  on-screen at 390px.
- **DPR is capped at 1.5 on mobile, 2 on desktop.** A dotted sphere does not need 3x.
- **`visibilitychange` also stops the loop** when the tab is hidden.

If you reuse the globe, the two things to preserve are the culling trick and the
off-screen gate. Everything else is tuning.

---

### 8. The mobile drawer

Not animated with a curve — it toggles `is-open`, which the CSS reveals. Accessible by
construction: the button manages `aria-expanded`, links close it on tap, and rows are
48px tall.

One structural note, because it is a trap: the drawer markup and JS were **correct all
along**, but the CSS never hid the two desktop CTAs at the mobile breakpoint, so the
hamburger was pushed 120px off-screen and the drawer was unreachable. The nav is now
partially visible by design — wordmark + primary CTA + toggle — because Nielsen Norman
Group's finding is that hiding navigation cuts discoverability almost in half.

---

### 9. The failsafe sweep

```js
window.setTimeout(failsafe, 6000);
window.addEventListener("load", () => window.setTimeout(failsafe, 1200));
```

Restores anything under `opacity 0.05`. It should never fire. If you ever see content
appear suddenly about six seconds in, this is what rescued it — and something upstream
is broken.

---

## Reproducing this on a new surface

**For a website section:** copy the `[data-reveal]` block and the IntersectionObserver
from `app.js`. That is the whole system. Use `templates/section-starter.html`.

**For a deck or PDF:** most of this does not apply — a PDF has no scroll and no
viewport. What carries over is the *mood*: the one easing curve, the negative display
tracking, and the accent discipline. For a **browser** deck (1920×1080, keyboard
navigation) you can reuse the reveal system directly.

**For a motion graphic or video:** the numbers to carry over are
`cubic-bezier(0.16, 1, 0.3, 1)` and 260 / 420 / 700ms, with 70ms stagger steps. That
combination *is* the brand's sense of timing.

---

## Pitfalls

- **Never wait on `networkidle` in an automated check.** The hero streams a looping
  video, so the page never goes idle. This broke four gates and looked like a site
  failure rather than a test failure. Wait on `load` plus an explicit settle.
- **Full-page screenshots of this site are useless.** Playwright expands the viewport,
  `100svh` sections explode, and every coordinate shifts. Capture per viewport or
  per element.
- **Measure in reduced motion.** Lenis is skipped and reveals auto-resolve, so it is the
  only stable environment for pixel measurement.
- **`will-change` is a trap at scale.** It was measured on the reference site at 165
  layers. Do not add it speculatively.
