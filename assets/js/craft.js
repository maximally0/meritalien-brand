/* ==========================================================================
   MERITALIEN — craft.js
   The layer that makes it feel directed rather than assembled.

   1. Page transitions — every route change is a departure: the outgoing page
      translates out along the same axis the new one arrives on.
   2. Pinned sequences — scroll-driven moments, desktop only, motion-safe.
   3. Stagger — GSAP-driven reveals for grouped items where the timing needs
      to be authored rather than uniform.
   ========================================================================== */
(() => {
  "use strict";

  const REDUCED = (window.MERITALIEN && window.MERITALIEN.REDUCED) ||
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  /* ======================================================================
     1. PAGE TRANSITIONS
     A static site has no router, so the departure is played on click and the
     arrival on load. Same axis, same curve: out left, in from right.
     ====================================================================== */
  const main = $("#main");

  if (main && !REDUCED) {
    // arrival
    if (sessionStorage.getItem("mt:departing") === "1") {
      sessionStorage.removeItem("mt:departing");
      main.style.transition = "none";
      main.style.transform = "translate3d(28px,0,0)";
      main.style.opacity = "0";
      requestAnimationFrame(() => {
        main.style.transition = `transform 620ms ${EASE}, opacity 620ms ${EASE}`;
        main.style.transform = "translate3d(0,0,0)";
        main.style.opacity = "1";
      });
    }

    // departure
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (a.hostname && a.hostname !== location.hostname) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      e.preventDefault();
      try { sessionStorage.setItem("mt:departing", "1"); } catch (_) {}
      main.style.transition = `transform 340ms ${EASE}, opacity 340ms ${EASE}`;
      main.style.transform = "translate3d(-24px,0,0)";
      main.style.opacity = "0";
      window.setTimeout(() => { window.location.href = href; }, 300);
    });

    // leave everything visible if the user navigates back from bfcache
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        main.style.transition = "none";
        main.style.transform = "";
        main.style.opacity = "";
      }
    });
  }

  /* ======================================================================
     2. PINNED SEQUENCES
     A pinned section holds while its content resolves. Desktop only — pinning
     on a phone fights the browser chrome and the touch scroll.
     ====================================================================== */
  const canPin = window.ScrollTrigger && window.gsap && !REDUCED &&
                 window.matchMedia("(min-width: 56rem)").matches;

  if (canPin) {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    $$("[data-pin]").forEach((section) => {
      const lines = $$("[data-pin-line]", section);
      const track = $("[data-pin-track]", section);
      if (!lines.length && !track) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          end: "+=90%",
          scrub: 0.6,
          pin: false,          // never pin: it risks layout jumps on a long page
          anticipatePin: 1,
        },
      });

      if (lines.length) {
        /* Translate only — deliberately no opacity.
           A scrub tween at progress 0 renders its start state, so animating
           opacity would leave the text invisible if the trigger never fired.
           Translating 34px means a dead trigger costs you a 34px offset and
           nothing else. It also matches the site's one motion rule: every
           element arrives, nothing fades in place. */
        gsap.set(lines, { y: 34 });
        tl.to(lines, { y: 0, duration: 1, stagger: 0.35, ease: "none" });
      }
      if (track) {
        gsap.set(track, { xPercent: 6 });
        tl.to(track, { xPercent: -6, duration: 3, ease: "none" }, 0);
      }
    });

    /* ==================================================================
       4. FAILSAFE
       Whatever else happens, no section may end up invisible. If anything
       that this file animated is still transparent a few seconds in, restore
       it. A blank section is a worse outcome than a missing animation.
       ================================================================== */
    const failsafe = () => {
      $$("[data-pin-line], [data-see]").forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
          gsap.set(el, { opacity: 1, y: 0, clearProps: "opacity,transform" });
        }
      });
    };
    window.setTimeout(failsafe, 6000);
    window.addEventListener("load", () => window.setTimeout(failsafe, 1200));

    /* ==================================================================
       3. STAGGER — handled by app.js, deliberately not here.

       This was originally a GSAP `from` tween per group. It shipped a bug:
       `from` renders its hidden state when the tween is created, so any
       group whose ScrollTrigger never fired stayed at opacity 0 — invisible
       content behind a "progressive enhancement". Stagger is now done by the
       IntersectionObserver reveal system in app.js, which fails open.
       GSAP is used only for scrub-driven sequences, where a missing trigger
       degrades to a static (visible) section rather than a blank one.
       ================================================================== */
    void 0;

    ST.refresh();
  }

  /* ======================================================================
     4. Keep ScrollTrigger honest after layout changes
     Images without dimensions, font swaps and collapsibles all change
     document height. A stale trigger strands sections at opacity 0.
     ====================================================================== */
  if (window.ScrollTrigger) {
    window.addEventListener("load", () => window.ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => window.ScrollTrigger.refresh());
    }
    let t = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => window.ScrollTrigger.refresh(), 180);
    });
  }
})();
