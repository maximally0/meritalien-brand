/* ==========================================================================
   MERITALIEN — app.js
   Motion system + nav + reveal + marquee + collapsible + counters.

   Motion rule: everything TRANSLATES. Nothing fades in place.
   One curve: cubic-bezier(0.16, 1, 0.3, 1). Declared in tokens.css as --ease.
   ========================================================================== */
(() => {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  document.documentElement.classList.remove("no-js");

  /* ======================================================================
     1. SMOOTH SCROLL — Lenis, wired into GSAP ScrollTrigger if present
     ====================================================================== */
  let lenis = null;
  if (!REDUCED && typeof window.Lenis === "function") {
    lenis = new window.Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    if (window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
      window.ScrollTrigger.refresh();
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ======================================================================
     2. REVEAL — translate-only, staggered per group

     [data-stagger] containers are promoted into this system rather than being
     animated separately. The reason is a real bug that shipped once: a GSAP
     `from` tween attached to a ScrollTrigger renders its hidden state at
     creation, and if the trigger never fires the content stays invisible
     forever. This reveal system fails OPEN — no JS, no IntersectionObserver,
     or reduced motion all end with the content visible.
     ====================================================================== */
  $$("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (!child.hasAttribute("data-reveal")) {
        child.setAttribute("data-reveal", "");
        child.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 70}ms`);
      }
    });
  });

  const revealables = $$("[data-reveal]");
  // A looping background video is decorative motion. Under reduced-motion, hold
  // it on its poster frame rather than looping — the composition survives, the
  // movement doesn't.
  if (REDUCED) {
    document.querySelectorAll(".hero__video").forEach((v) => {
      try { v.pause(); v.removeAttribute("autoplay"); } catch (e) {}
    });
  }

  /* Pick the hero footage. The phone encode is a portrait crop (~527KB) rather
     than a downscale of the landscape frame — on a tall viewport `cover` shows
     only about a quarter of the frame width, so a smaller landscape file would
     spend its pixels on parts of the picture nobody sees, and still look soft.
     On a metered or 2G connection we don't load video at all; the poster is a
     real frame and the hero still reads. */
  const heroVid = document.querySelector(".hero__video");
  if (heroVid && !REDUCED) {
    const conn = navigator.connection || navigator.mozConnection || {};
    const frugal = conn.saveData === true || /(^|-)2g/.test(conn.effectiveType || "");
    if (frugal) {
      heroVid.removeAttribute("autoplay");
      try { heroVid.pause(); } catch (e) {}
    } else {
      const mq = window.matchMedia("(max-width: 48rem)");
      const pick = () => {
        const narrow = mq.matches;
        const want = narrow ? heroVid.dataset.srcMobile : heroVid.dataset.srcDesktop;
        // the poster must match the crop, or the first paint jumps when the
        // video starts (landscape poster -> portrait frame)
        heroVid.poster = narrow ? "./assets/video/hero-mobile-poster.jpg"
                                : "./assets/video/hero-poster.jpg";
        if (!want) return;
        const cur = heroVid.querySelector("source");
        if (cur && cur.getAttribute("src") === want) return;
        heroVid.innerHTML = "";
        const src = document.createElement("source");
        src.src = want;
        src.type = "video/mp4";
        heroVid.appendChild(src);
        heroVid.load();
        const pr = heroVid.play();
        if (pr && pr.catch) pr.catch(() => {});
      };
      pick();
      if (mq.addEventListener) mq.addEventListener("change", pick);
    }
  }

  if (REDUCED || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    // stagger siblings inside the same parent group
    const groups = new Map();
    revealables.forEach((el) => {
      const key = el.dataset.revealGroup || el.parentElement;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    });
    groups.forEach((els) => {
      els.forEach((el, i) => {
        if (el.dataset.revealDelay === undefined) {
          el.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 70}ms`);
        }
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    revealables.forEach((el) => io.observe(el));

    /* Safety net.
       IntersectionObserver is reliable for human scrolling but can be outrun by
       a fast flick or a programmatic scroll that jumps hundreds of pixels per
       frame — and when it is outrun the content stays at opacity 0, which is a
       blank section. This sweep runs after scrolling settles and reveals
       anything at or above the fold line, including content already scrolled
       past. Cheap, because it only runs when scrolling stops. */
    let sweept = null;
    const sweep = () => {
      const fold = window.innerHeight + 60;
      revealables.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        if (el.getBoundingClientRect().top < fold) el.classList.add("is-in");
      });
    };
    const queueSweep = () => {
      window.clearTimeout(sweept);
      sweept = window.setTimeout(sweep, 140);
    };
    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", queueSweep, { passive: true });
    window.addEventListener("load", () => window.setTimeout(sweep, 300));
  }

  /* ======================================================================
     3. NAV — transparent over the hero, solid once past it
     ====================================================================== */
  const nav = $(".nav");
  if (nav) {
    /* Pages without a dark hero ship with `is-solid` already in the markup —
       without it the nav renders white-on-white at the top of the page, which is
       how ~90 pages shipped broken. `data-solid="always"` means the class is a
       property of the page, not of the scroll position, so the toggle below must
       not remove it. */
    const alwaysSolid = nav.dataset.solid === "always";

    const solidAfter = nav.dataset.solidAfter
      ? document.querySelector(nav.dataset.solidAfter)
      : null;

    const applyNav = (y) => {
      if (alwaysSolid) {
        if (!nav.classList.contains("is-solid")) nav.classList.add("is-solid");
        return;
      }
      const trigger = solidAfter
        ? solidAfter.offsetHeight - 90
        : Math.max(120, window.innerHeight * 0.72);
      nav.classList.toggle("is-solid", y > trigger);
    };

    if (lenis) lenis.on("scroll", ({ scroll }) => applyNav(scroll));
    window.addEventListener("scroll", () => applyNav(window.scrollY), { passive: true });
    applyNav(window.scrollY);

    const toggle = $(".nav__toggle", nav);
    const drawer = $(".nav__drawer", nav);
    if (toggle && drawer) {
      toggle.addEventListener("click", () => {
        const open = drawer.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        if (!open) return;
      });
      drawer.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
          drawer.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /* ======================================================================
     3b. STORIES INDEX — region filter + progressive disclosure
     ====================================================================== */
  const storyGrid = document.querySelector("[data-story-grid]");
  if (storyGrid) {
    const cards = Array.prototype.slice.call(storyGrid.querySelectorAll(".story"));
    const chips = Array.prototype.slice.call(document.querySelectorAll("[data-region-filter]"));
    const moreBtn = document.querySelector("[data-story-more]");
    const countEl = document.querySelector("[data-story-count]");
    const CLAMP = parseInt(storyGrid.getAttribute("data-clamp") || "9", 10);
    let region = "all";
    let expanded = false;

    const applyStories = () => {
      const matching = cards.filter(
        (c) => region === "all" || c.getAttribute("data-region") === region
      );
      const limited = !expanded && matching.length > CLAMP;
      const shown = limited ? matching.slice(0, CLAMP) : matching;

      cards.forEach((c) => {
        c.classList.toggle("is-out", shown.indexOf(c) === -1);
      });

      if (countEl) {
        countEl.textContent =
          shown.length === matching.length
            ? matching.length + (matching.length === 1 ? " story" : " stories")
            : "Showing " + shown.length + " of " + matching.length;
      }
      if (moreBtn) {
        moreBtn.hidden = !limited;
        if (limited) moreBtn.textContent = "Show all " + matching.length;
      }
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        region = chip.getAttribute("data-region-filter");
        expanded = false;
        chips.forEach((c) => {
          const on = c === chip;
          c.classList.toggle("is-on", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        applyStories();
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", () => { expanded = true; applyStories(); });
    }
    applyStories();
  }

  /* ======================================================================
     4. ROUTE ROTATOR — the hero eyebrow: a live departing route
     This is the fix for an abstract headline: it puts people in it.
     ====================================================================== */
  const routeFrom = $("[data-route-from]");
  const routeTo   = $("[data-route-to]");
  if (routeFrom && routeTo && !REDUCED) {
    let routes = [];
    try { routes = JSON.parse(routeFrom.dataset.routeList || "[]"); } catch { routes = []; }

    if (routes.length > 1) {
      let i = 0;
      const swap = (el, text) => {
        el.classList.add("is-out");
        window.setTimeout(() => {
          el.textContent = text;
          el.classList.remove("is-out");
        }, 260);
      };
      window.setInterval(() => {
        i = (i + 1) % routes.length;
        swap(routeFrom, routes[i][0]);
        swap(routeTo, routes[i][1]);
      }, 2800);
    }
  }

  /* ======================================================================
     5. MARQUEE — duplicate contents once for a seamless loop.
     The clone is aria-hidden or a screen reader reads every item twice.
     ====================================================================== */
  $$(".marquee__track").forEach((track) => {
    const items = Array.from(track.children);
    const clone = document.createElement("div");
    clone.setAttribute("aria-hidden", "true");
    clone.style.display = "contents";
    items.forEach((item) => clone.appendChild(item.cloneNode(true)));
    track.appendChild(clone);
  });

  /* ======================================================================
     6. COLLAPSIBLE
     CRITICAL: collapsing changes document height, which invalidates the
     cached pixel start/end of every scroll trigger below it. Sections get
     stranded at opacity:0 and look permanently broken — and only after a
     user interacts, so a screenshot pass never catches it.
     ====================================================================== */
  let refreshQueued = false;
  const queueRefresh = () => {
    if (refreshQueued || !window.ScrollTrigger) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      window.ScrollTrigger.refresh();
    });
  };

  $$(".collapsible__toggle").forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));

      if (REDUCED) {
        panel.hidden = open;
        queueRefresh();
        return;
      }

      if (open) {
        const h = panel.scrollHeight;
        panel.style.height = `${h}px`;
        panel.hidden = false;
        requestAnimationFrame(() => { panel.style.height = "0px"; });
        const done = () => {
          panel.hidden = true;
          panel.style.height = "";
          panel.removeEventListener("transitionend", done);
          queueRefresh();
        };
        panel.addEventListener("transitionend", done);
        window.setTimeout(done, 520);
      } else {
        panel.hidden = false;
        const h = panel.scrollHeight;
        panel.style.height = "0px";
        requestAnimationFrame(() => { panel.style.height = `${h}px`; });
        const done = () => {
          panel.style.height = "";
          panel.removeEventListener("transitionend", done);
          queueRefresh();
        };
        panel.addEventListener("transitionend", done);
        window.setTimeout(done, 520);
      }
    });
  });

  /* ======================================================================
     7. COUNTERS — animate only when scrolled into view, once
     ====================================================================== */
  const counters = $$("[data-count-to]");
  if (counters.length) {
    const run = (el) => {
      const target = parseFloat(el.dataset.countTo);
      const decimals = parseInt(el.dataset.countDecimals || "0", 10);
      const prefix = el.dataset.countPrefix || "";
      const suffix = el.dataset.countSuffix || "";
      if (REDUCED) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }
      const dur = 1400;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo — same curve as everything
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach((c) => cio.observe(c));
    } else {
      counters.forEach(run);
    }
  }

  /* ======================================================================
     8. Anchors go through Lenis so smooth scroll doesn't fight itself
     ====================================================================== */
  if (lenis) {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }

  /* expose for other modules */
  window.MERITALIEN = { lenis, REDUCED, queueRefresh };
})();
