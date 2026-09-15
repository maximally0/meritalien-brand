"""Render the Meritalien LinkedIn cover directions to PNG.

Authors at 1128 x 191 CSS px (LinkedIn's cover render size), screenshots at
device_scale_factor=2 so every glyph is rasterised at 2x, then resamples with
Lanczos to the two delivery sizes:

    1512 x 256   LinkedIn's official recommended (and minimum) upload size
    1128 x 191   what LinkedIn renders on the page

Also writes a QA pass per design with the keep-out box drawn on top, so the
safe area can be eyeballed rather than asserted.

    python banner/render.py
"""
from __future__ import annotations

import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
QA = HERE / "_qa"

DESIGNS = ("design-01", "design-02", "design-03")

UPLOAD = (1512, 256)   # LinkedIn Help, "Image specifications for your LinkedIn
                       # Pages and Career Pages" (answer/a563309): Page cover
                       # image, minimum 1512x256, recommended 1512x256.
DISPLAY = (1128, 191)  # the size LinkedIn renders the cover at.


def main() -> None:
    QA.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--allow-file-access-from-files"])
        page = browser.new_page(
            viewport={"width": 1128, "height": 191},
            device_scale_factor=2,
        )

        for name in DESIGNS:
            html = (HERE / f"{name}.html").resolve()
            page.goto(html.as_uri(), wait_until="load")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(1200)

            master = QA / f"{name}@2x.png"
            page.screenshot(path=str(master))

            im = Image.open(master)
            assert im.size == (2256, 382), im.size

            im.resize(UPLOAD, Image.LANCZOS).save(HERE / f"{name}.png")
            im.resize(DISPLAY, Image.LANCZOS).save(HERE / f"{name}-1128x191.png")

            # QA overlay: keep-out box on
            page.evaluate(
                "document.querySelectorAll('.keepout')"
                ".forEach(el => el.classList.add('is-on'))"
            )
            page.wait_for_timeout(150)
            page.screenshot(path=str(QA / f"{name}-keepout@2x.png"))

            print(f"{name}: master {im.size} -> {UPLOAD} + {DISPLAY}")

        browser.close()


if __name__ == "__main__":
    main()
