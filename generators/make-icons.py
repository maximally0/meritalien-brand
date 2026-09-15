"""Rasterise the favicon SVG into the PNG icons the OS and PWA need.

The SVG is the single source of truth. Everything else is derived from it, so the
browser tab, the iOS home screen and the Android install icon cannot drift apart.

There used to be two different marks: favicon.svg was hand-authored (geometric M
plus a green dot at the lower right) while apple-touch-icon.png was drawn
separately with PIL (a green vertical *bar* plus a Geist-M font glyph, bar on the
left). Same brand, two logos — and nobody would notice until someone added the
site to their home screen.

Usage:  python generators/make-icons.py
"""
from __future__ import annotations

import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#0b0b0c"/>
  <!-- M: monoline skeleton (13.75,20) -> (25,43) -> (36.25,20), weight 5.5, mitred, clipped to the 28x24 cap box -->
  <path d="M11.00 44.00 16.50 44.00 16.50 31.88 22.43 44.00 27.57 44.00 33.50 31.88 33.50 44.00 39.00 44.00 39.00 20.00 36.25 20.00 33.19 20.00 25.00 36.74 16.81 20.00 13.75 20.00 11.00 20.00Z" fill="#fbfaf8"/>
  <circle cx="48" cy="39" r="5" fill="#00e07a"/>
</svg>
"""

# name -> size. 180 = apple-touch-icon, 192/512 = PWA manifest, 32 = legacy PNG.
SIZES = {
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "favicon-32.png": 32,
}

MASKABLE_SIZES = {
    "icon-192-maskable.png": 192,
    "icon-512-maskable.png": 512,
}


def maskable_svg() -> str:
    """Full-bleed variant for Android.

    A `maskable` icon must NOT carry its own transparency or rounded corners —
    the OS applies the mask, so pre-rounded corners show through as a broken
    shape inside the circle. The background bleeds to all four edges and the mark
    is scaled to 0.82 about the centre, which puts it inside the 80% safe zone.
    """
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<rect width="64" height="64" fill="#0b0b0c"/>'
        '<g transform="translate(32 32) scale(0.82) translate(-32 -32)">'
        '<path d="M14 44V20h6.2l6.4 12.4L33 20h6.2v24h-5.4V29.6L29 40h-4.6L19.4 29.6V44z" '
        'fill="#fbfaf8"/>'
        '<circle cx="47.5" cy="41.5" r="4.5" fill="#00e07a"/>'
        "</g></svg>"
    )


def main() -> int:
    import base64

    from playwright.sync_api import sync_playwright

    # write the source of truth next to the icons too
    icons_dir = os.path.join(ROOT, "assets", "icons")
    os.makedirs(icons_dir, exist_ok=True)
    with open(os.path.join(icons_dir, "favicon.svg"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(FAVICON)

    b64 = base64.b64encode(FAVICON.encode()).decode()
    mb64 = base64.b64encode(maskable_svg().encode()).decode()

    jobs = [(n, s, b64) for n, s in SIZES.items()]
    jobs += [(n, s, mb64) for n, s in MASKABLE_SIZES.items()]

    made = []
    # rendered through a real browser engine, so the raster is the same shape the
    # tab draws. Playwright is already a dependency of the wider project.
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name, size, data in jobs:
            page = browser.new_page(viewport={"width": size, "height": size},
                                    device_scale_factor=1)
            page.set_content(
                '<html><body style="margin:0;background:transparent">'
                f'<img src="data:image/svg+xml;base64,{data}" '
                f'width="{size}" height="{size}"></body></html>'
            )
            page.wait_for_timeout(120)
            out = os.path.join(icons_dir, name)
            page.screenshot(path=out, omit_background=True)
            page.close()
            made.append((name, size, os.path.getsize(out)))
        browser.close()

    for name, size, n in made:
        print(f"  {name:<26} {size:>3}x{size:<3} {n // 1024:>3}KB")

    # The 180px icon is expected at the site root beside favicon.svg.
    site = os.path.join(ROOT, "site")
    if os.path.isdir(site):
        shutil.copyfile(os.path.join(icons_dir, "apple-touch-icon.png"),
                        os.path.join(site, "apple-touch-icon.png"))
        print("\n  copied apple-touch-icon.png to site/")

    print(f"\nwrote {len(made)} icons into assets/icons/ from one SVG")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
