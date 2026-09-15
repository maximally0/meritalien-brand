/* ==========================================================================
   MERITALIEN — navigator.js
   "Where are you going?" — brief §17 and §20.

   This is a real rules engine over real pathway categories, not a mood.
   It returns a STARTING POINT and says so. It does not assess eligibility:
   that requires a licensed professional and a look at the actual profile.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.querySelector("[data-navigator]");
  if (!root) return;

  const $ = (s, c = root) => c.querySelector(s);

  /* ---------- countries ---------- */
  const COUNTRIES = [
    { key: "india", label: "India", region: "South Asia" },
    { key: "pakistan", label: "Pakistan", region: "South Asia" },
    { key: "bangladesh", label: "Bangladesh", region: "South Asia" },
    { key: "sri-lanka", label: "Sri Lanka", region: "South Asia" },
    { key: "nepal", label: "Nepal", region: "South Asia" },
    { key: "philippines", label: "Philippines", region: "South-East Asia" },
    { key: "indonesia", label: "Indonesia", region: "South-East Asia" },
    { key: "vietnam", label: "Vietnam", region: "South-East Asia" },
    { key: "singapore", label: "Singapore", region: "South-East Asia" },
    { key: "nigeria", label: "Nigeria", region: "Africa" },
    { key: "kenya", label: "Kenya", region: "Africa" },
    { key: "ghana", label: "Ghana", region: "Africa" },
    { key: "south-africa", label: "South Africa", region: "Africa" },
    { key: "egypt", label: "Egypt", region: "Middle East" },
    { key: "uae", label: "United Arab Emirates", region: "Middle East" },
    { key: "jordan", label: "Jordan", region: "Middle East" },
    { key: "brazil", label: "Brazil", region: "Latin America" },
    { key: "argentina", label: "Argentina", region: "Latin America" },
    { key: "colombia", label: "Colombia", region: "Latin America" },
    { key: "mexico", label: "Mexico", region: "Latin America" },
    { key: "poland", label: "Poland", region: "Europe" },
    { key: "hungary", label: "Hungary", region: "Europe" },
    { key: "ukraine", label: "Ukraine", region: "Europe" },
    { key: "turkey", label: "Türkiye", region: "Europe" },
    { key: "united-kingdom", label: "United Kingdom", region: "Europe" },
    { key: "germany", label: "Germany", region: "Europe" },
    { key: "france", label: "France", region: "Europe" },
    { key: "spain", label: "Spain", region: "Europe" },
    { key: "china", label: "China", region: "East Asia" },
    { key: "japan", label: "Japan", region: "East Asia" },
    { key: "south-korea", label: "South Korea", region: "East Asia" },
    { key: "united-states", label: "United States", region: "North America" },
    { key: "canada", label: "Canada", region: "North America" },
    { key: "australia", label: "Australia", region: "Oceania" },
    { key: "new-zealand", label: "New Zealand", region: "Oceania" },
  ];

  const DESTINATIONS = [
    "united-states", "united-kingdom", "canada", "australia",
    "germany", "netherlands", "singapore", "new-zealand",
  ];

  const ROLES = [
    { key: "founder", label: "Founder" },
    { key: "researcher", label: "Researcher" },
    { key: "engineer", label: "Engineer" },
    { key: "scientist", label: "Scientist" },
    { key: "creator", label: "Creator" },
    { key: "designer", label: "Designer" },
    { key: "artist", label: "Artist" },
    { key: "academic", label: "Academic" },
    { key: "operator", label: "Operator" },
    { key: "business", label: "Business leader" },
  ];

  const INTENTS = [
    { key: "explore", label: "Explore my options" },
    { key: "build", label: "Build my profile first" },
    { key: "move", label: "Move as soon as possible" },
  ];

  /* ---------- pathways ----------
     High-level, accurate, and deliberately caveated. The bar for each of
     these is high. The navigator must never imply that it isn't.          */
  const PATHWAYS = {
    "o-1a": {
      code: "O-1A", country: "United States", countryKey: "united-states",
      name: "Extraordinary ability — sciences, education, business, athletics",
      kind: "Temporary work",
      blurb: "For people at the top of their field. An employer or agent files; a founder can often petition through their own company.",
      roles: ["founder", "researcher", "engineer", "scientist", "academic", "operator", "business"],
      intents: ["explore", "move"],
      weight: 3,
    },
    "o-1b": {
      code: "O-1B", country: "United States", countryKey: "united-states",
      name: "Extraordinary ability — arts, motion picture, television",
      kind: "Temporary work",
      blurb: "The creative-track counterpart to O-1A. Assessed on a distinct set of criteria, with a different evidence pattern.",
      roles: ["creator", "artist", "designer"],
      intents: ["explore", "move"],
      weight: 3,
    },
    "eb-1a": {
      code: "EB-1A", country: "United States", countryKey: "united-states",
      name: "Extraordinary ability — permanent residence",
      kind: "Permanent residence",
      blurb: "Self-petitionable — no employer required. The highest evidentiary bar, and the one most founders build toward over years.",
      roles: ["founder", "researcher", "scientist", "academic", "engineer", "creator", "artist", "designer", "operator", "business"],
      intents: ["explore", "build"],
      weight: 3,
    },
    "eb-1b": {
      code: "EB-1B", country: "United States", countryKey: "united-states",
      name: "Outstanding professors and researchers",
      kind: "Permanent residence",
      blurb: "For internationally recognised academics with a permanent research or teaching offer. Employer-sponsored.",
      roles: ["researcher", "academic", "scientist"],
      intents: ["explore"],
      weight: 2,
    },
    "eb-2-niw": {
      code: "EB-2 NIW", country: "United States", countryKey: "united-states",
      name: "National interest waiver",
      kind: "Permanent residence",
      blurb: "Self-petitionable. Turns on whether your work advances a national interest and whether waiving the job offer serves it. A long game, often run alongside O-1A.",
      roles: ["founder", "researcher", "engineer", "scientist", "academic", "operator"],
      intents: ["explore", "build"],
      weight: 3,
    },
    "uk-global-talent": {
      code: "UK GLOBAL TALENT", country: "United Kingdom", countryKey: "united-kingdom",
      name: "Global Talent — endorsed route",
      kind: "Temporary, leads to settlement",
      blurb: "Requires endorsement by a recognised body before you apply — the endorsement stage is the real work, and it is profile-based rather than offer-based.",
      roles: ["founder", "researcher", "engineer", "scientist", "creator", "designer", "artist", "academic", "operator", "business"],
      intents: ["explore", "move", "build"],
      weight: 3,
    },
    "ca-talent": {
      code: "CANADA — TALENT", country: "Canada", countryKey: "canada",
      name: "High-skill and talent pathways",
      kind: "Varies by route",
      blurb: "Canada runs several distinct high-skill routes with different selection logic. Which one applies depends on your profile and whether you have an offer.",
      roles: ["founder", "researcher", "engineer", "scientist", "creator", "designer", "artist", "academic", "operator", "business"],
      intents: ["explore", "move"],
      weight: 2,
    },
    "au-talent": {
      code: "AUSTRALIA — TALENT", country: "Australia", countryKey: "australia",
      name: "High-skill and talent pathways",
      kind: "Varies by route",
      blurb: "Australia's talent routes have been restructured in recent years. The applicable route depends on your field and international standing.",
      roles: ["founder", "researcher", "engineer", "scientist", "academic", "operator"],
      intents: ["explore", "move"],
      weight: 2,
    },
    "other-destination": {
      code: "DIRECTORY", country: "Other destinations", countryKey: "*",
      name: "We are still mapping this corridor",
      kind: "In progress",
      blurb: "We publish guides corridor by corridor and do not want to guess. Ask us directly and we will tell you what we know and what we do not.",
      roles: ["founder", "researcher", "engineer", "scientist", "creator", "designer", "artist", "academic", "operator", "business"],
      intents: ["explore"],
      weight: 1,
    },
  };

  /* ---------- the engine ---------- */
  function match({ dest, role, intent }) {
    const out = [];
    for (const [key, p] of Object.entries(PATHWAYS)) {
      if (p.countryKey !== "*" && p.countryKey !== dest) continue;
      if (p.countryKey === "*" && dest !== "other") continue;
      if (!p.roles.includes(role)) continue;
      let score = p.weight;
      if (p.intents.includes(intent)) score += 2;
      if (intent === "build" && (key === "eb-1a" || key === "eb-2-niw")) score += 2;
      if (intent === "move" && (key === "o-1a" || key === "o-1b" || key === "uk-global-talent")) score += 1;
      out.push({ key, ...p, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 4);
  }

  /* ---------- select population ---------- */
  function fill(sel, items, placeholder) {
    sel.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    ph.disabled = true;
    ph.selected = true;
    sel.appendChild(ph);

    const groups = {};
    items.forEach((c) => {
      const g = c.region || "—";
      (groups[g] = groups[g] || []).push(c);
    });
    Object.entries(groups).forEach(([g, list]) => {
      const og = document.createElement("optgroup");
      og.label = g;
      list.forEach((c) => {
        const o = document.createElement("option");
        o.value = c.key;
        o.textContent = c.label;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
  }

  const selFrom = $('[data-nav="from"]');
  const selTo   = $('[data-nav="to"]');
  const selRole = $('[data-nav="role"]');
  const selWant = $('[data-nav="want"]');
  const outEl   = $("[data-nav-result]");

  if (selFrom) fill(selFrom, COUNTRIES, "Where are you?");
  if (selTo)   fill(selTo, COUNTRIES.filter((c) => DESTINATIONS.includes(c.key)), "Where do you want to go?");
  if (selRole) fill(selRole, ROLES, "What do you do?");
  if (selWant) fill(selWant, INTENTS, "What are you looking for?");

  /* ---------- render ---------- */
  function render(results, ctx) {
    if (!outEl) return;

    if (!results.length) {
      outEl.innerHTML = `
        <p class="eyebrow">Here's where we'd start</p>
        <p style="font-family:var(--font-serif);font-size:var(--t-lead);color:var(--text-invert-muted);max-width:34ch">
          We don't have a mapped corridor for that combination yet. That is a gap in our directory,
          not a statement about your chances. Ask us directly.
        </p>`;
      return;
    }

    const rows = results
      .map(
        (r) => `
      <a class="result-row" href="../discover/pathways/${r.key}/" data-pathway="${r.key}">
        <span class="result-row__code">${r.code}</span>
        <span class="result-row__name">${r.name}</span>
        <span class="result-row__note">${r.kind}</span>
      </a>`
      )
      .join("");

    outEl.innerHTML = `
      <p class="eyebrow">Here's where we'd start</p>
      <p style="font-family:var(--font-serif);font-size:var(--t-lead);color:var(--text-invert-muted);max-width:38ch">
        ${ctx.from ? `${ctx.fromLabel} &rarr; ${ctx.toLabel}` : "Based on your answers"}. These are the
        routes most people with your profile begin with.
      </p>
      <div class="result-list">${rows}</div>
      <div class="btn-row" style="margin-top:var(--s-6)">
        <a class="btn btn--primary" href="../about/">Talk to us about your record
          <span class="btn__arrow" aria-hidden="true">&rarr;</span></a>
      </div>`;
  }

  function current() {
    const from = selFrom && selFrom.value;
    const to   = selTo && selTo.value;
    const role = selRole && selRole.value;
    const want = selWant && selWant.value;
    if (!to || !role) return null;
    const dest = to;
    const label = (k) => (COUNTRIES.find((c) => c.key === k) || {}).label || dest;
    return {
      from, to, role, intent: want || "explore",
      fromLabel: from ? label(from) : null,
      toLabel: label(to),
    };
  }

  function update() {
    const ctx = current();
    if (!ctx) return;
    const results = match({ dest: ctx.to, role: ctx.role, intent: ctx.intent });

    // keep the "other destination" fallback honest
    if (!results.length) {
      const fallback = PATHWAYS["other-destination"];
      render([{ key: "other-destination", ...fallback }], ctx);
    } else {
      render(results, ctx);
    }

    // drive the globe
    if (window.MERITALIEN && window.MERITALIEN.globe && ctx.from) {
      window.MERITALIEN.globe.focus(ctx.from, ctx.to);
    }

    // shareable state
    const slug = [ctx.from, ctx.to, ctx.role, ctx.intent].filter(Boolean).join("-");
    if (history.replaceState) history.replaceState(null, "", `#${slug}`);
  }

  [selFrom, selTo, selRole, selWant].forEach((s) => {
    if (s) s.addEventListener("change", update);
  });

  // hydrate from the URL hash so a shared link reproduces the result
  const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (hash) {
    const live = Object.fromEntries(COUNTRIES.map((c) => [c.key, true]));
    const roles = new Set(ROLES.map((r) => r.key));
    const intents = new Set(INTENTS.map((i) => i.key));
    const parts = hash.split("-");
    // greedy re-join because country keys contain dashes
    const matched = [];
    for (let i = parts.length; i > 0; i--) {
      const candidate = parts.slice(0, i).join("-");
      if (live[candidate] || roles.has(candidate) || intents.has(candidate)) {
        matched.push(candidate);
        parts.splice(0, i);
        i = parts.length + 1;
      }
    }
    const [f, t, r, w] = matched;
    if (f && live[f] && selFrom) selFrom.value = f;
    if (t && live[t] && selTo)   selTo.value = t;
    if (r && roles.has(r) && selRole) selRole.value = r;
    if (w && intents.has(w) && selWant) selWant.value = w;
  }

  if (selTo && selRole) update();
})();
