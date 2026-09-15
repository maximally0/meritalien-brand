#!/usr/bin/env python
"""Generate Open Graph cards (1200x630 PNG) for every page.

Design system, same as the site: ink background, faint grid, one signal-green
accent, Departure Mono for the eyebrow, Geist for the headline. Generated rather
than hand-drawn so every page type stays consistent and a new page costs nothing.
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "assets_src", "fonts")
OUT = os.path.join(HERE, "site", "assets", "og")

W, H = 1200, 630
INK = (11, 11, 12)
PAPER = (251, 250, 248)
MUTED = (168, 164, 156)
ACCENT = (0, 224, 122)
LINE = (38, 38, 42)

_font_cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    key = (name, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONTS, name), size)
    return _font_cache[key]


def wrap(draw: ImageDraw.ImageDraw, text: str, f, max_w: int) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def card(title: str, eyebrow: str, route: str | None, out_path: str) -> None:
    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img)

    # faint grid — the same device the hero uses
    for x in range(0, W, 72):
        d.line([(x, 0), (x, H)], fill=(20, 20, 23), width=1)
    for y in range(0, H, 72):
        d.line([(0, y), (W, y)], fill=(20, 20, 23), width=1)

    # accent bar, left edge
    d.rectangle([0, 0, 5, H], fill=ACCENT)

    PAD = 72

    # eyebrow — Departure Mono, uppercase, wide tracking
    ef = font("DepartureMono-Regular.otf", 21)
    d.text((PAD, PAD - 6), eyebrow.upper(), font=ef, fill=ACCENT)
    # tracking by hand: Departure Mono is fixed-width so draw char by char
    d.rectangle([PAD, PAD + 34, PAD + 46, PAD + 35], fill=(70, 68, 64))

    # headline — Geist Medium, wrapped
    hf = font("Geist-Medium.ttf", 62)
    lines = wrap(d, title, hf, W - PAD * 2 - 40)[:4]
    y = H // 2 - (len(lines) * 74) // 2 - 10
    for ln in lines:
        d.text((PAD, y), ln, font=hf, fill=PAPER)
        y += 74

    # footer: wordmark left, route right
    wf = font("Newsreader-Regular.ttf", 30)
    d.text((PAD, H - PAD - 26), "Meritalien", font=wf, fill=PAPER)
    if route:
        rf = font("DepartureMono-Regular.otf", 19)
        tw = d.textlength(route.upper(), font=rf)
        d.text((W - PAD - tw, H - PAD - 20), route.upper(), font=rf, fill=MUTED)

    # hairline above footer
    d.line([(PAD, H - PAD - 48), (W - PAD, H - PAD - 48)], fill=LINE, width=1)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, "PNG", optimize=True)


def main() -> int:
    import json
    from content import PATHWAYS, OPPORTUNITY_CATEGORIES, GUIDES, BRIEF, COUNTRIES

    here = os.path.dirname(os.path.abspath(__file__))
    people = json.load(open(os.path.join(here, "research", "people.json"), encoding="utf-8"))

    jobs: list[tuple[str, str, str | None, str]] = []

    def add(slug: str, title: str, eyebrow: str, route: str | None = None):
        jobs.append((slug, title, eyebrow, route))

    add("home", "Exceptional talent shouldn't be limited by borders.",
        "Global talent mobility", "MUMBAI → SAN FRANCISCO")
    add("navigator", "Where are you going?", "The navigator", None)
    add("discover", "Know where you can go.", "Discover", "KATHMANDU → NEW YORK")
    add("pathways", "The Global Talent Pathway Directory", "Discover · Pathways", None)
    add("countries", "Countries", "Discover · Countries", None)
    add("guides", "Guides", "Discover · Guides", None)
    add("stories", "People without borders.", "Discover · Stories", None)
    add("build", "Become globally recognised.", "Build", None)
    add("opportunities", "Opportunities", "Build · Opportunities", None)
    add("connect", "Find the people who can help you get there.", "Connect", None)
    add("move", "Go from where you are to where you're going.", "Move", None)
    add("brief", "The Meritalien Brief", "Global talent · Mobility · Opportunities", None)
    add("about", "About Meritalien", "The company", None)
    add("for-companies", "Hire the best talent. Then get them here.", "For companies", None)
    add("how-it-works", "How a move actually runs", "For companies", None)
    add("disclosures", "Disclosures", "Legal", None)
    add("privacy", "Privacy", "Legal", None)
    add("terms", "Terms", "Legal", None)
    add("cookies", "Cookies", "Legal", None)
    add("404", "That page isn't here.", "404", None)

    for key, p in PATHWAYS.items():
        add(f"pathway-{key}", p["title"], f"{p['country']} · {p['code']}")
    for slug, c in COUNTRIES.items():
        add(f"country-{slug}", c["name"], "Discover · Countries")
    for slug, title, _st, _cat, _rt in GUIDES:
        add(f"guide-{slug}", title, "Guide")
    for slug, kind, title, _st in BRIEF:
        add(f"brief-{slug}", title, f"The Brief · {kind}")
    for slug, title, _blurb in OPPORTUNITY_CATEGORIES:
        add(f"opps-{slug}", title, "Build · Opportunities")
    for s in people:
        add(f"story-{s['slug']}", s["name"],
            f"{s['role']} · {s['origin']} → {s['destination']}")

    for slug, title, eyebrow, route in jobs:
        card(title, eyebrow, route, os.path.join(OUT, f"{slug}.png"))

    print(f"generated {len(jobs)} OG cards into site/assets/og/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
