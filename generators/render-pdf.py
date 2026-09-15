"""Render an HTML file to PDF at an exact page size.

Uses Playwright's Chromium rather than shelling out to a `chrome` binary, because
Playwright is already the project dependency and its bundled Chromium is a known
version. Same engine either way — this just removes the "which Chrome?" variable.

    python generators/render-pdf.py templates/deck-slide.html out/deck.pdf --deck
    python generators/render-pdf.py templates/onepager.html out/onepager.pdf

Sizes:
    --deck   1280x720 px  ==  960x540 pt   (16:9)
    default  A4           ==  794x1123 px

Then VERIFY the output (page count, page size, embedded fonts) and LOOK at every
page. A PDF nobody looked at is not a finished artifact.
"""
from __future__ import annotations

import argparse
import os
import sys

from playwright.sync_api import sync_playwright


def render(src: str, out: str, deck: bool, scale: float = 1.0) -> None:
    src_abs = os.path.abspath(src)
    out_abs = os.path.abspath(out)
    if not os.path.exists(src_abs):
        raise SystemExit(f"no such file: {src_abs}")
    os.makedirs(os.path.dirname(out_abs), exist_ok=True)

    # Playwright's page.pdf() takes CSS px, and Chrome converts px -> pt at x0.75.
    # So passing 1280x720px is what yields a 960x540pt page. Passing 960x540 here
    # produces a 720x405pt page -- a real bug that is invisible until you measure
    # the MediaBox, because the slides still look correct on screen.
    if deck:
        width, height = "1280px", "720px"      # -> 960 x 540 pt (16:9)
    else:
        width, height = "794px", "1123px"      # A4 at 96dpi -> 595 x 842 pt

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1280 if deck else 794,
                                         "height": 720 if deck else 1123},
                               device_scale_factor=1)
        page.goto("file:///" + src_abs.replace("\\", "/"), wait_until="load", timeout=60000)
        # fonts must be resolved or the PDF rasterises with fallback metrics
        page.wait_for_timeout(600)
        page.evaluate("async () => { if (document.fonts) await document.fonts.ready; }")
        page.emulate_media(media="print")
        page.wait_for_timeout(300)
        page.pdf(
            path=out_abs,
            width=width,
            height=height,
            print_background=True,             # keep the ink bands
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            prefer_css_page_size=False,
        )
        browser.close()

    print(f"  rendered -> {out_abs}  ({os.path.getsize(out_abs) // 1024}KB)")
    print(f"  page box  -> {width} x {height}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--deck", action="store_true", help="16:9 (960x540pt) instead of A4")
    a = ap.parse_args()
    render(a.src, a.out, a.deck)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
