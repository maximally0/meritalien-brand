/* ==========================================================================
   MERITALIEN — globe.js
   A dotted orthographic globe with great-circle arcs, drawn on 2D canvas.
   No three.js, no WebGL context limits, no 500KB dependency — just math.

   Why orthographic: it's the projection that makes a globe read as a globe
   (no distortion at the rim), and back-face culling comes free from cos(c).
   ========================================================================== */
(() => {
  "use strict";

  const canvas = document.querySelector("[data-globe]");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const stage = canvas.parentElement;
  const readout = document.querySelector("[data-globe-readout]");
  const REDUCED = (window.MERITALIEN && window.MERITALIEN.REDUCED) ||
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const RAD = Math.PI / 180;
  const ACCENT = "#00e07a";
  const DOT = "rgba(251,250,248,0.30)";
  const ARC = "rgba(0,224,122,0.52)";

  /* ---------- places (real coordinates, from the brief's own journeys) ---------- */
  const P = {
    "san francisco": [37.77, -122.42],
    lagos: [6.52, 3.38],         london: [51.51, -0.13],
    karachi: [24.86, 67.01],     manchester: [53.48, -2.24],
    manila: [14.60, 120.98],     toronto: [43.65, -79.38],
    "são paulo": [-23.55, -46.63], sydney: [-33.87, 151.21],
    hyderabad: [17.39, 78.49],   berlin: [52.52, 13.40],
    kathmandu: [27.72, 85.32],   "new york": [40.71, -74.01],
    budapest: [47.50, 19.04],    boston: [42.36, -71.06],
    dhaka: [23.81, 90.41],       colombo: [6.93, 79.86],
    jakarta: [-6.21, 106.85],    hanoi: [21.03, 105.85],
    singapore: [1.35, 103.82],   nairobi: [-1.29, 36.82],
    accra: [5.60, -0.19],        johannesburg: [-26.20, 28.05],
    cairo: [30.04, 31.24],       dubai: [25.20, 55.27],
    amman: [31.95, 35.93],       "buenos aires": [-34.60, -58.38],
    bogota: [4.71, -74.07],      "mexico city": [19.43, -99.13],
    warsaw: [52.23, 21.01],      kyiv: [50.45, 30.52],
    istanbul: [41.01, 28.98],    paris: [48.86, 2.35],
    madrid: [40.42, -3.70],      "hong kong": [22.32, 114.17],
    tokyo: [35.68, 139.69],      seoul: [37.57, 126.98],
    auckland: [-36.85, 174.76],  mumbai: [19.08, 72.88],
  };

  /* The navigator speaks in countries; the globe draws in cities.
     Without this map the globe simply ignores every selection. */
  const COUNTRY_CITY = {
    india: "mumbai", pakistan: "karachi", bangladesh: "dhaka",
    "sri-lanka": "colombo", nepal: "kathmandu",
    philippines: "manila", indonesia: "jakarta", vietnam: "hanoi",
    singapore: "singapore",
    nigeria: "lagos", kenya: "nairobi", ghana: "accra", "south-africa": "johannesburg",
    egypt: "cairo", uae: "dubai", jordan: "amman",
    brazil: "são paulo", argentina: "buenos aires", colombia: "bogota", mexico: "mexico city",
    poland: "warsaw", hungary: "budapest", ukraine: "kyiv", turkey: "istanbul",
    "united-kingdom": "london", germany: "berlin", france: "paris", spain: "madrid",
    china: "hong kong", japan: "tokyo", "south-korea": "seoul",
    "united-states": "san francisco", canada: "toronto",
    australia: "sydney", "new-zealand": "auckland",
  };

  const resolveCity = (k) => {
    if (!k) return null;
    const key = String(k).toLowerCase();
    if (P[key]) return key;
    return COUNTRY_CITY[key] || null;
  };

  const ROUTES = [
    ["mumbai", "san francisco"],
    ["lagos", "london"],
    ["karachi", "manchester"],
    ["manila", "toronto"],
    ["são paulo", "sydney"],
    ["hyderabad", "berlin"],
    ["kathmandu", "new york"],
    ["budapest", "boston"],
  ];

  /* ---------- state ---------- */
  let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
  let rotY = -76;          // longitude of centre — starts showing South Asia
  let tilt = 12;           // latitude of centre — slight tilt reads better than 0
  let dotGrid = [];
  let active = 0;          // index into ROUTES
  let arcProgress = 0;
  let last = performance.now();

  /* ---------- geometry ---------- */
  function buildDots() {
    dotGrid = [];
    const step = 4.2;
    for (let lat = -84; lat <= 84; lat += step) {
      const latR = lat * RAD;
      const circ = Math.cos(latR);
      if (circ < 0.02) continue;
      const lonStep = Math.min(360, step / circ);
      for (let lon = -180; lon < 180; lon += lonStep) {
        dotGrid.push([latR, lon * RAD]);
      }
    }
  }

  function project(latR, lonR) {
    const p0 = tilt * RAD;
    const l0 = rotY * RAD;
    const cosc = Math.sin(p0) * Math.sin(latR) + Math.cos(p0) * Math.cos(latR) * Math.cos(lonR - l0);
    if (cosc < 0) return null; // back face
    const x = Math.cos(latR) * Math.sin(lonR - l0);
    const y = Math.cos(p0) * Math.sin(latR) - Math.sin(p0) * Math.cos(latR) * Math.cos(lonR - l0);
    return [cx + R * x, cy - R * y, cosc];
  }

  /* great-circle interpolation: slerp on the unit sphere */
  function greatCircle(a, b, t) {
    const [la1, lo1] = a.map((v) => v * RAD);
    const [la2, lo2] = b.map((v) => v * RAD);
    const v1 = [Math.cos(la1) * Math.cos(lo1), Math.cos(la1) * Math.sin(lo1), Math.sin(la1)];
    const v2 = [Math.cos(la2) * Math.cos(lo2), Math.cos(la2) * Math.sin(lo2), Math.sin(la2)];
    let dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    dot = Math.max(-1, Math.min(1, dot));
    const om = Math.acos(dot);
    if (om < 1e-6) return a;
    const s = Math.sin(om);
    const A = Math.sin((1 - t) * om) / s;
    const B = Math.sin(t * om) / s;
    const x = A * v1[0] + B * v2[0];
    const y = A * v1[1] + B * v2[1];
    const z = A * v1[2] + B * v2[2];
    return [Math.asin(z) / RAD, Math.atan2(y, x) / RAD];
  }

  /* ---------- draw ---------- */
  function resize() {
    const rect = stage.getBoundingClientRect();
    // 2x is the point of diminishing returns for a dotted sphere, and on a 3x
    // phone it means 4x the pixels for a canvas that sits behind a headline.
    dpr = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1);
    W = Math.max(240, rect.width);
    H = Math.max(240, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.42;
  }

  function drawSphere() {
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    g.addColorStop(0, "rgba(251,250,248,0.055)");
    g.addColorStop(1, "rgba(251,250,248,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(251,250,248,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawDots() {
    const r = W > 520 ? 1.15 : 0.95;
    for (const [latR, lonR] of dotGrid) {
      const p = project(latR, lonR);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r * (0.55 + p[2] * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = DOT;
      ctx.fill();
    }
  }

  function drawArc(route, progress) {
    const a = P[route[0]];
    const b = P[route[1]];
    if (!a || !b) return;

    const STEPS = 96;
    const lift = 1.14; // arcs bow outward from the surface

    const pts = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const [lat, lon] = greatCircle(a, b, t);
      const p = project(lat * RAD, lon * RAD);
      // lift the arc toward the viewer radially
      if (p) {
        const k = Math.sin(Math.PI * t);
        const dx = p[0] - cx, dy = p[1] - cy;
        const m = Math.hypot(dx, dy) || 1;
        const amt = R * 0.20 * k;
        pts.push([p[0] + (dx / m) * amt * lift, p[1] + (dy / m) * amt * lift]);
      } else {
        pts.push(null);
      }
    }

    // base arc
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = ARC;
    let started = false;
    ctx.beginPath();
    for (const p of pts) {
      if (!p) { started = false; continue; }
      if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
      else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();

    // travelled portion, brighter
    const upto = Math.floor(STEPS * Math.min(1, progress));
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = ACCENT;
    ctx.beginPath();
    started = false;
    for (let i = 0; i <= upto; i++) {
      const p = pts[i];
      if (!p) { started = false; continue; }
      if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
      else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();

    // endpoints: origin hollow, destination solid accent
    const pa = project(a[0] * RAD, a[1] * RAD);
    const pb = project(b[0] * RAD, b[1] * RAD);
    if (pa) {
      ctx.beginPath(); ctx.arc(pa[0], pa[1], 2.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251,250,248,0.6)"; ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (pb) {
      const pulse = REDUCED ? 1 : 1 + Math.sin(performance.now() / 420) * 0.22;
      ctx.beginPath(); ctx.arc(pb[0], pb[1], 3.6 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT; ctx.fill();
      ctx.beginPath(); ctx.arc(pb[0], pb[1], 8 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,224,122,0.30)"; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  /* The loop must not run when nobody can see it. A canvas RAF redrawing a
     sphere two screens below the fold burns battery for nothing — and on a
     phone that is the difference between a warm and a hot handset. */
  let rafId = null;
  let running = false;
  let onScreen = true;

  function start() {
    if (running || REDUCED) return;
    running = true;
    rafId = requestAnimationFrame((t) => { last = t; frame(t); });
  }

  function stop() {
    running = false;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function frame(now) {
    const dt = Math.min(64, now - last);
    last = now;

    if (!REDUCED) {
      rotY += dt * 0.0075;
      if (rotY > 180) rotY -= 360;
      arcProgress += dt / 3400;
      if (arcProgress > 1.9) { arcProgress = 0; active = (active + 1) % ROUTES.length; updateReadout(); }
    }

    ctx.clearRect(0, 0, W, H);
    drawSphere();
    drawDots();
    drawArc(ROUTES[active], REDUCED ? 1 : Math.min(1, arcProgress));
    if (arcProgress > 1.6) {
      const nxt = ROUTES[(active + 1) % ROUTES.length];
      drawArc(nxt, Math.max(0, (arcProgress - 1.6) / 1.9));
    }

    // stop scheduling entirely once it scrolls away or the tab is hidden
    rafId = (running && onScreen && !document.hidden) ? requestAnimationFrame(frame) : null;
    if (rafId === null) running = false;
  }

  function updateReadout() {
    if (!readout) return;
    const r = ROUTES[active];
    readout.innerHTML = `<span class="eyebrow">Active route</span>
      <b>${r[0].toUpperCase()} &nbsp;→&nbsp; ${r[1].toUpperCase()}</b>`;
  }

  /* ---------- boot ---------- */
  buildDots();
  resize();
  updateReadout();
  window.addEventListener("resize", () => { resize(); });

  if (REDUCED) {
    // one static frame — still meaningful, just not moving
    ctx.clearRect(0, 0, W, H);
    drawSphere(); drawDots(); drawArc(ROUTES[0], 1);
  } else if ("IntersectionObserver" in window) {
    // Only draw while the globe is on screen.
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) start(); else stop();
    }, { threshold: 0 });
    io.observe(stage);
  } else {
    start();
  }

  // a backgrounded tab must not keep ticking
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else if (onScreen) start();
  });

  // let the navigator drive the globe
  window.MERITALIEN = Object.assign(window.MERITALIEN || {}, {
    globe: {
      focus(fromKey, toKey) {
        const from = resolveCity(fromKey);
        const to = resolveCity(toKey);
        if (!from || !to) return false;
        const b = P[to];
        let idx = ROUTES.findIndex((r) => r[0] === from && r[1] === to);
        if (idx === -1) {
          ROUTES.push([from, to]);
          idx = ROUTES.length - 1;
        }
        active = idx;
        arcProgress = 0.35;
        updateReadout();
        // rotate so the destination faces the viewer
        rotY = b[1];
        return true;
      },
      setTiltDeg(v) { tilt = v; },
    },
  });
})();
