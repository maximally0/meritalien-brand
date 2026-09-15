"""Render the LinkedIn thumbnails and verify them.

    python thumbnail/render.py

Renders each variant at 1200x627 (1.91:1, LinkedIn's centre-crop shape) at 2x and
downsamples, then verifies.

Two measurement traps this file exists to avoid, both of which produced false
failures on the first attempt:

  1. CONTRAST must be measured against the background UNDER THE TYPE, not across a
     whole horizontal band. Sampling the full width includes areas no text touches
     -- on these cards the right-hand photo is bright and unscrimmed, so band
     sampling reported 1.70:1 on a card whose type actually sits on near-black.
     This file asks the browser for each text element's real box, then samples the
     bare (copy-hidden) render inside those boxes only.

  2. Measuring the FINISHED image is meaningless. The white glyphs are the lightest
     pixels in their own box, so you measure text against text and get ~1.04:1 on a
     perfectly good card.

Accent counting dilates before flood-filling: thin italic serif strokes break into
fragments and would otherwise count as a dozen separate "accents".
"""
from __future__ import annotations

import io
import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
W, H = 1200, 627
VARIANTS = ["route", "statement", "split"]

GREEN = (0, 224, 122)
PAPER = (251, 250, 248)

# which elements carry type, per variant. The wordmark is excluded: its green
# "alien" is part of the logo, not an accent use.
TEXT_SELECTORS = {
    "route": [".eyebrow", ".route", ".note", ".site"],
    "statement": [".eyebrow", "h1", ".site"],
    "split": [".eyebrow", "h1", ".sub", ".site"],
}


def lum(p):
    f = lambda c: (c / 255) / 12.92 if c / 255 <= 0.03928 else (((c / 255) + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2])


def contrast(a, b):
    l1, l2 = lum(a), lum(b)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def render(name: str, hide_copy: bool = False):
    """Return (image, list of text boxes) — boxes are in 1200x627 space."""
    src = HERE / f"{name}.html"
    html = src.read_text(encoding="utf-8")
    if hide_copy:
        html = html.replace(
            ".stage {",
            ".stage > * > *, .stage > * { visibility: hidden; }\n"
            "  .photo, .scrim, .shot, .blend { visibility: visible; }\n"
            "  .stage {", 1)
        tmp = HERE / f"_bare-{name}.html"
        tmp.write_text(html, encoding="utf-8")
        uri = tmp.resolve().as_uri()
    else:
        uri = src.resolve().as_uri()

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=2)
        pg.goto(uri, wait_until="load")
        pg.wait_for_timeout(1300)
        pg.evaluate("async () => { if (document.fonts) await document.fonts.ready; }")
        pg.wait_for_timeout(300)
        boxes = pg.evaluate(
            """(sels) => sels.flatMap(s => [...document.querySelectorAll(s)].map(el => {
                 const rg = document.createRange(); rg.selectNodeContents(el);
                 const r = rg.getBoundingClientRect();
                 return { sel: s, x: r.left, y: r.top, w: r.width, h: r.height };
               }))""",
            TEXT_SELECTORS[name],
        )
        raw = pg.screenshot()
        pg.close()
        b.close()
    im = Image.open(io.BytesIO(raw)).convert("RGB").resize((W, H), Image.LANCZOS)
    return im, boxes


def green_count(im: Image.Image, tol: int = 48) -> int:
    """Count distinct accent regions, dilating first so thin strokes stay one blob."""
    px = im.load()
    m = [[1 if (abs(px[x, y][0] - GREEN[0]) < tol and abs(px[x, y][1] - GREEN[1]) < tol
                and abs(px[x, y][2] - GREEN[2]) < tol) else 0 for x in range(W)]
         for y in range(H)]
    # dilate by 14px
    R = 14
    d = [[0] * W for _ in range(H)]
    for y in range(H):
        row = m[y]
        for x in range(W):
            if row[x]:
                for yy in range(max(0, y - R), min(H, y + R + 1)):
                    dr = d[yy]
                    for xx in range(max(0, x - R), min(W, x + R + 1)):
                        dr[xx] = 1
    seen = [[False] * W for _ in range(H)]
    clusters = 0
    for y in range(H):
        for x in range(W):
            if d[y][x] and not seen[y][x]:
                clusters += 1
                stack = [(x, y)]
                while stack:
                    cx, cy = stack.pop()
                    if not (0 <= cx < W and 0 <= cy < H) or seen[cy][cx] or not d[cy][cx]:
                        continue
                    seen[cy][cx] = True
                    stack += [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]
    return clusters


print("=" * 74)
summary = []
for name in VARIANTS:
    im, boxes = render(name)
    im.save(HERE / "img" / f"thumb-{name}.png")
    bare, _ = render(name, hide_copy=True)
    bare.save(HERE / "img" / f"_bare-{name}.png")

    print(f"\n  {name.upper()}")
    worst = 99.0
    for bx in boxes:
        x1 = max(0, int(bx["x"])); y1 = max(0, int(bx["y"]))
        x2 = min(W, int(bx["x"] + bx["w"])); y2 = min(H, int(bx["y"] + bx["h"]))
        if x2 <= x1 or y2 <= y1:
            continue
        px = list(bare.crop((x1, y1, x2, y2)).get_flattened_data()) or [(0, 0, 0)]
        c = contrast(PAPER, max(px, key=lum))
        worst = min(worst, c)
        need = 3.0 if bx["w"] > 300 else 4.5
        flag = "ok" if c >= need else "FAIL"
        print(f"    {bx['sel']:<10} {int(bx['w'])}x{int(bx['h'])}  contrast {c:5.2f}:1  "
              f"needs {need}  {flag}")
    n = green_count(im)
    summary.append((name, worst, n))
    print(f"    accent regions: {n}")

print("\n" + "=" * 74)
for name, worst, n in summary:
    print(f"  {name:<11} worst type contrast {worst:5.2f}:1   accent regions {n}")
print("=" * 74)

cw = 780
ch = int(cw / 1.91)
sheet = Image.new("RGB", (cw, (ch + 14) * len(VARIANTS)), (32, 32, 35))
for i, name in enumerate(VARIANTS):
    sheet.paste(Image.open(HERE / "img" / f"thumb-{name}.png").resize((cw, ch), Image.LANCZOS),
                (0, i * (ch + 14)))
sheet.save(HERE / "img" / "contact-sheet.jpg", quality=90)
print("  contact sheet -> thumbnail/img/contact-sheet.jpg")

for f in HERE.glob("_bare-*.html"):
    f.unlink()
