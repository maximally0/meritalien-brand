"""Verification for the meritalien-brand kit.

Not a test suite — there is no framework here. It asserts the properties that
actually break: exported tokens are complete and valid, icons come from one
source, rendered PDFs are the right page size with fonts embedded, templates
load with no console errors or external requests, and designed artifacts never
pull in the site's article print stylesheet.

Usage:  python verify.py
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = r"C:\Users\rishh\workspace\meritalien-brand"
PY = sys.executable

results: list[tuple[bool, str, str]] = []


def check(ok: bool, name: str, detail: str = "") -> None:
    results.append((ok, name, detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def run(args: list[str], cwd: str = ROOT) -> subprocess.CompletedProcess:
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=300)


print("=" * 72)
print("1. generators/export-tokens.py")
print("=" * 72)

# --- completeness: must FAIL loudly if it cannot classify a variable ----------
tmp = tempfile.mkdtemp(prefix="hermes-verify-")
broken = os.path.join(tmp, "broken.css")
with open(broken, "w", encoding="utf-8") as fh:
    # one classifiable var + one deliberately unrecognised var
    fh.write(":root {\n  --accent: #00e07a;\n  --mystery-token: 42px;\n}\n")
src = os.path.join(ROOT, "tokens", "tokens.css")
shutil.copyfile(src, src + ".bak")
shutil.copyfile(broken, src)
r = run([PY, "generators/export-tokens.py"])
shutil.copyfile(src + ".bak", src)
os.remove(src + ".bak")
check(r.returncode != 0 and "UNCLASSIFIED" in r.stdout,
      "fails loudly on an unclassifiable variable",
      f"exit={r.returncode}")

# --- the real run ------------------------------------------------------------
r = run([PY, "generators/export-tokens.py"])
check(r.returncode == 0, "runs clean on the real tokens.css", f"exit={r.returncode}")
m = re.search(r"parsed (\d+) variables", r.stdout)
parsed = int(m.group(1)) if m else 0
m2 = re.search(r"exported (\d+) tokens", r.stdout)
exported = int(m2.group(1)) if m2 else 0
check(parsed == exported and parsed > 0,
      "every variable exported (no silent drops)", f"{exported}/{parsed}")

# --- DTCG validity -----------------------------------------------------------
data = json.load(open(os.path.join(ROOT, "tokens", "tokens.json"), encoding="utf-8"))
bad_both, missing_type, leaves = [], [], []


def walk(node, path=""):
    if isinstance(node, dict):
        children = [k for k in node if not k.startswith("$")]
        if "$value" in node:
            leaves.append(path)
            if children:
                bad_both.append(path)
            if "$type" not in node:
                missing_type.append(path)
        for k, v in node.items():
            if not k.startswith("$"):
                walk(v, f"{path}.{k}" if path else k)


walk(data)
check(not bad_both, "no node is both a token and a group (valid DTCG)",
      f"{len(bad_both)} offenders" if bad_both else "")
check(not missing_type, "every token declares $type",
      f"{len(missing_type)} missing" if missing_type else "")
check(len(leaves) == parsed, "token count matches the source", f"{len(leaves)} leaves")

scss = open(os.path.join(ROOT, "tokens", "tokens.scss"), encoding="utf-8").read()
names = re.findall(r"^\$([a-z0-9_]+):", scss, re.M)
check(len(names) == parsed, "tokens.scss covers every variable", f"{len(names)} vs {parsed}")
# The real bug class is COLLISION, not count: an earlier emitter turned s-1..s-4
# into one "$s_$1" and ink-600..900 into "$ink_$100", so the file had the right
# number of lines but silently lost values. Assert uniqueness, and that no name
# carries a stray non-identifier character.
dupes = sorted({n for n in names if names.count(n) > 1})
check(not dupes, "no duplicate SCSS identifiers (values cannot silently overwrite)",
      ", ".join(dupes[:4]) if dupes else "")
check(all(re.fullmatch(r"[a-z][a-z0-9_]*", n) for n in names),
      "all SCSS identifiers are well-formed",
      next((n for n in names if not re.fullmatch(r"[a-z][a-z0-9_]*", n)), ""))
check(not re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", scss),
      "tokens.scss contains no stray control characters",
      # non-ASCII is fine (the header comment carries an em-dash); only C0 control
      # bytes indicate the mangled-escape bug this guards against.
      repr(re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", scss)) if
      re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", scss) else "")

print()
print("=" * 72)
print("2. generators/make-icons.py")
print("=" * 72)

r = run([PY, "generators/make-icons.py"])
check(r.returncode == 0, "runs clean", f"exit={r.returncode}")
icons = os.path.join(ROOT, "assets", "icons")
expected = ["favicon.svg", "favicon-32.png", "apple-touch-icon.png",
            "icon-192.png", "icon-512.png",
            "icon-192-maskable.png", "icon-512-maskable.png"]
missing = [i for i in expected if not os.path.exists(os.path.join(icons, i))]
check(not missing, "all 7 icon files present", f"missing: {missing}" if missing else "")

# PNG dimensions must match the filename, and maskable must be full-bleed
try:
    from PIL import Image
    for name, want in [("icon-192.png", 192), ("icon-512.png", 512),
                       ("apple-touch-icon.png", 180),
                       ("icon-192-maskable.png", 192), ("icon-512-maskable.png", 512)]:
        im = Image.open(os.path.join(icons, name))
        check(im.size == (want, want), f"{name} is {want}x{want}", f"got {im.size}")
    # a maskable icon must have NO transparency (the OS applies its own mask)
    for name in ("icon-192-maskable.png", "icon-512-maskable.png"):
        im = Image.open(os.path.join(icons, name)).convert("RGBA")
        alpha = im.getchannel("A")
        corner = alpha.getpixel((2, 2))
        check(corner == 255, f"{name} is full-bleed (opaque corners)", f"corner alpha={corner}")
except ImportError:
    check(False, "PIL available for icon checks", "Pillow missing")

print()
print("=" * 72)
print("3. generators/render-pdf.py  — page box")
print("=" * 72)

try:
    import fitz
except ImportError:
    fitz = None
    check(False, "pymupdf available", "install pymupdf")

out = os.path.join(tmp, "o")
os.makedirs(out, exist_ok=True)

cases = [
    ("templates/deck-slide.html", "deck.pdf", True, (960.0, 540.0), "16:9"),
    ("templates/onepager.html", "onepager.pdf", False, (595.0, 842.0), "A4"),
]
for srcf, name, deck, want, label in cases:
    args = [PY, "generators/render-pdf.py", srcf, os.path.join(out, name)]
    if deck:
        args.append("--deck")
    r = run(args)
    if r.returncode != 0:
        check(False, f"{name} renders", r.stderr[-120:])
        continue
    pdf_path = os.path.join(out, name)
    with fitz.open(pdf_path) as doc:
        w, h = doc[0].rect.width, doc[0].rect.height
        page_count = doc.page_count
    ok = abs(w - want[0]) < 1.5 and abs(h - want[1]) < 1.5
    check(ok, f"{name} page box is {label}", f"{w:.0f}x{h:.0f}pt (want {want[0]:.0f}x{want[1]:.0f})")
    check(page_count >= 1, f"{name} has pages", f"{page_count}")
    # fonts must be embedded or the PDF substitutes on another machine
    with open(pdf_path, "rb") as fh:
        fonts = set(re.findall(rb"/FontName\s*/([A-Za-z0-9+\-]+)", fh.read()))
    check(len(fonts) > 0, f"{name} embeds fonts", f"{len(fonts)} faces")

print()
print("=" * 72)
print("4. templates — load clean, no console errors")
print("=" * 72)

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None
    check(False, "playwright available", "install playwright")

if sync_playwright:
    inspect = """() => {
      const q = s => document.querySelector(s);
      const cs = e => e ? getComputedStyle(e) : null;
      return {
        external: [...document.querySelectorAll('link[href],script[src],img[src]')]
          .map(e => e.href || e.src)
          .filter(u => u.startsWith('http') && !u.includes('localhost')),
        hOverflow: document.documentElement.scrollWidth >
                   document.documentElement.clientWidth + 1,
        revealTotal: document.querySelectorAll('[data-reveal]').length,
        revealIn: document.querySelectorAll('[data-reveal].is-in').length,
        grid3: cs(q('.grid-3')) ? cs(q('.grid-3')).gridTemplateColumns : '',
        inkBg: cs(q('.slide--ink')) ? cs(q('.slide--ink')).backgroundColor : '',
      };
    }"""
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for tmpl, deck in [("section-starter.html", False),
                           ("motion-demo.html", False),
                           ("deck-slide.html", True),
                           ("onepager.html", False)]:
            path = os.path.join(ROOT, "templates", tmpl)
            errs, failed = [], []
            pg = br.new_page(viewport={"width": 1280 if deck else 900,
                                       "height": 720 if deck else 900})
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("requestfailed", lambda r: failed.append(r.url.split("/")[-1]))
            try:
                pg.goto("file:///" + path.replace("\\", "/"), wait_until="load", timeout=45000)
                pg.emulate_media(media="print" if deck else "screen")
                pg.wait_for_timeout(1200)
                d = pg.evaluate(inspect)
                check(not errs, f"{tmpl} no console errors", "; ".join(errs[:2]))
                check(not failed, f"{tmpl} no failed requests", ", ".join(failed[:3]))
                check(not d["external"], f"{tmpl} loads nothing external",
                      ", ".join(d["external"][:2]))
                check(not d["hOverflow"], f"{tmpl} no horizontal overflow")
                if deck:
                    check(d["inkBg"] == "rgb(11, 11, 12)",
                          "deck-slide ink cover is actually ink (not the article print palette)",
                          d["inkBg"])
                    check(len(d["grid3"].split()) == 3 or d["grid3"] == "",
                          "onepager/deck grids not collapsed by the print stylesheet",
                          d["grid3"])
            except Exception as e:
                check(False, f"{tmpl} loads", str(e)[:120])
            pg.close()
        br.close()

print()
print("=" * 72)
print("5. print.css / designed artifacts must not pull in extra.css")
print("=" * 72)

for tmpl in ("deck-slide.html", "onepager.html"):
    body = open(os.path.join(ROOT, "templates", tmpl), encoding="utf-8").read()
    # it may be *named* in an explanatory comment, but must not be linked
    linked = bool(re.search(r'<link[^>]+href="[^"]*extra\.css"', body))
    check(not linked, f"{tmpl} does not link extra.css")

pc = open(os.path.join(ROOT, "templates", "print.css"), encoding="utf-8").read()
check("print-color-adjust: exact" in pc, "print.css keeps backgrounds (ink bands survive)")
check("[data-reveal]" in pc and "opacity: 1 !important" in pc,
      "print.css neutralises un-fired reveals (no blank pages)")

print()
print("=" * 72)
print("6. git hygiene")
print("=" * 72)

r = run(["git", "status", "--porcelain"])
check(r.stdout.strip() == "", "working tree clean (everything committed)",
      f"{len(r.stdout.strip().splitlines())} dirty" if r.stdout.strip() else "")
r = run(["git", "log", "--oneline", "-1"])
check(r.returncode == 0, "has commits", r.stdout.strip()[:60])
r = run(["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
check("origin/main" in r.stdout, "tracks origin/main", r.stdout.strip())

print()
print("=" * 72)
fails = [n for ok, n, _ in results if not ok]
print(f"RESULT: {len(results) - len(fails)}/{len(results)} checks passed")
if fails:
    print("FAILED:")
    for f in fails:
        print(f"  - {f}")
print("=" * 72)

try:
    shutil.rmtree(tmp)
except OSError as e:
    # On Windows an unclosed handle blocks deletion. Say so rather than leaking
    # 36KB per run into the temp directory silently.
    print(f"  (temp dir not removed: {e})")
sys.exit(1 if fails else 0)
